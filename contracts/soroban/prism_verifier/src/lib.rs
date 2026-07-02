//! PrismZK Clearinghouse Contract - Stellar Soroban
//!
//! VERIFICATION MODEL: this contract targets the Noir/Barretenberg (BN254, UltraHonk)
//! circuit in circuits/src/main.nr. Soroban does not yet expose live BN254 pairing or
//! Poseidon host functions on-chain — CAP-0074 (BN254 host functions) and CAP-0075
//! (Poseidon/Poseidon2 permutations) are proposed but not shipped as of this writing:
//!   https://github.com/stellar/stellar-protocol/blob/master/core/cap-0074.md
//!   https://github.com/stellar/stellar-protocol/blob/master/core/cap-0075.md
//! Only BLS12-381 (CAP-0059) is live on-chain today, via env.crypto().bls12_381().
//!
//! Per Stellar's own guidance for this situation ("attestation oracle" pattern), this
//! contract does NOT attempt to verify the ZK proof's pairing equation on-chain. Instead:
//!   1. The proof is verified off-chain by a trusted attestor (`bb verify`, or any
//!      Noir/UltraHonk verifier) running alongside the Solver Daemon.
//!   2. The attestor signs (nullifier, payload_commitment, max_block_height) with the
//!      registered ed25519 attestor key.
//!   3. This contract checks that signature via the real, shipped `ed25519_verify` host
//!      function, then enforces the replay + time-window invariants itself.
//!
//! This trades full trustless on-chain SNARK verification for a signed-oracle model —
//! explicitly weaker than native verification, but it is the documented, working-today
//! path for BN254/Noir circuits on Soroban. Swap step 3 for a real pairing check (or
//! rebuild the circuit on BLS12-381 + Groth16, see stellar/soroban-examples/groth16_verifier)
//! once CAP-0074/0075 ship.
//!
//! NOTE: this is deployed as its own WASM binary, separate from `master_state_registry`
//! (see ../master_state_registry). Soroban does not support two `#[contract]` structs with
//! colliding exported function names (both had `initialize`) in a single WASM — each
//! contract needs its own crate/binary.

#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror, BytesN, Bytes, Env, log, symbol_short,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum VerifierError {
    NotInitialized = 1,
    AlreadyInitialized = 2,
}

#[contracttype]
#[derive(Clone)]
pub enum VerifierDataKey {
    AttestorKey,
}

#[contract]
pub struct PrismVerifier;

#[contractimpl]
impl PrismVerifier {
    /// Registers the ed25519 public key of the trusted off-chain attestor that verifies
    /// Noir/UltraHonk proofs and signs clearance attestations. Must be called once before
    /// `verify_and_clear_intent`.
    pub fn initialize(env: Env, attestor_key: BytesN<32>) -> Result<(), VerifierError> {
        let storage = env.storage().instance();
        if storage.has(&VerifierDataKey::AttestorKey) {
            return Err(VerifierError::AlreadyInitialized);
        }
        storage.set(&VerifierDataKey::AttestorKey, &attestor_key);
        Ok(())
    }

    /// Clears an intent for multi-VM execution based on a signed off-chain attestation
    /// that the corresponding Noir/UltraHonk proof was verified.
    ///
    /// # Arguments
    /// * `attestation_signature` - ed25519 signature (by the registered attestor key) over
    ///   `nullifier || payload_commitment || max_block_height` (big-endian u32), certifying
    ///   that the attestor independently ran `bb verify` (or equivalent) and it passed.
    /// * `nullifier` - The unique 32-byte nullifier for replay prevention.
    /// * `payload_commitment` - The 32-byte hash binding the multi-chain execution variables.
    /// * `max_block_height` - The maximum Stellar ledger sequence under which this intent is valid.
    pub fn verify_and_clear_intent(
        env: Env,
        attestation_signature: BytesN<64>,
        nullifier: BytesN<32>,
        payload_commitment: BytesN<32>,
        max_block_height: u32,
    ) -> Result<(), VerifierError> {
        let current_ledger = env.ledger().sequence();

        // INVARIANT 1: Temporal Window Verification
        if current_ledger > max_block_height {
            panic!("PrismZK Error: Transaction window has expired.");
        }

        let storage = env.storage().temporary();

        // INVARIANT 2: Replay Prevention Check
        if storage.has(&nullifier) {
            panic!("PrismZK Error: Nullifier already spent. Double spend attempt aborted.");
        }

        // INVARIANT 3: Attestation Signature Verification (see module docs for rationale)
        let attestor_key: BytesN<32> = env
            .storage()
            .instance()
            .get(&VerifierDataKey::AttestorKey)
            .ok_or(VerifierError::NotInitialized)?;

        let mut message = Bytes::new(&env);
        message.append(&nullifier.clone().into());
        message.append(&payload_commitment.clone().into());
        message.extend_from_array(&max_block_height.to_be_bytes());

        env.crypto()
            .ed25519_verify(&attestor_key, &message, &attestation_signature);

        // Save nullifier mapped to the payload commitment to prevent double-spending
        storage.set(&nullifier, &payload_commitment);

        // INVARIANT 4: Dynamic State-Rent & TTL Extension
        let life_ttl_required = max_block_height.saturating_sub(current_ledger);

        if life_ttl_required > 0 {
            env.storage().temporary().extend_ttl(&nullifier, life_ttl_required, life_ttl_required);
        }

        // Emit public clearance attestation event so that off-chain TEE Solver Daemons can pick it up.
        env.events().publish(
            (symbol_short!("prism_att"), nullifier.clone()),
            payload_commitment.clone(),
        );

        log!(&env, "PrismZK: Intent cleared successfully.", nullifier, payload_commitment);
        Ok(())
    }
}
