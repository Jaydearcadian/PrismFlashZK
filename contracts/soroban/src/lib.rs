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

#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, contracterror, BytesN, Bytes, Env, Symbol, log, symbol_short, Map, Vec,
    xdr::ToXdr,
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

// ==============================================================================
// 🏛️ MASTER STATE REGISTRY FOR CROSS-VM SINGULAR VIRTUAL POOL (SVP)
// ==============================================================================

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    NotInitialized = 1,
    AlreadyInitialized = 2,
    NullifierAlreadySpent = 3,
    StaleTransaction = 4,
    InvalidSignature = 5,
    ChainNotFound = 6,
    MathOverflow = 7,
    DivisionByZero = 8,
    InsufficientCollateral = 9,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Initialized,
    ValidatorKey,
    GlobalSupply,
    InitialPrice,
    Slope,
    Balances, // Map<Symbol, u128>
    Weights,  // Map<Symbol, u32>
}

#[contract]
pub struct MasterStateRegistry;

#[contractimpl]
impl MasterStateRegistry {
    /// Initializes the Master State Registry with global bonding curve and initial spoke-chain balance sheets.
    pub fn initialize(
        env: Env,
        validator_key: BytesN<32>,
        initial_price: u128,
        slope: u128,
        chains: Vec<Symbol>,
        weights: Vec<u32>,
        initial_balances: Vec<u128>,
    ) -> Result<(), Error> {
        let storage = env.storage().instance();
        if storage.has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }

        if chains.len() != weights.len() || chains.len() != initial_balances.len() {
            return Err(Error::MathOverflow);
        }

        storage.set(&DataKey::Initialized, &true);
        storage.set(&DataKey::ValidatorKey, &validator_key);
        storage.set(&DataKey::InitialPrice, &initial_price);
        storage.set(&DataKey::Slope, &slope);

        let mut balances_map: Map<Symbol, u128> = Map::new(&env);
        let mut weights_map: Map<Symbol, u32> = Map::new(&env);
        let mut total_supply: u128 = 0;

        for i in 0..chains.len() {
            let chain = chains.get(i).ok_or(Error::ChainNotFound)?;
            let weight = weights.get(i).ok_or(Error::MathOverflow)?;
            let balance = initial_balances.get(i).ok_or(Error::MathOverflow)?;

            balances_map.set(chain.clone(), balance);
            weights_map.set(chain, weight);
            total_supply = total_supply.checked_add(balance).ok_or(Error::MathOverflow)?;
        }

        storage.set(&DataKey::Balances, &balances_map);
        storage.set(&DataKey::Weights, &weights_map);
        storage.set(&DataKey::GlobalSupply, &total_supply);

        Ok(())
    }

    /// Calculates total collateral currently managed across all spoke chains.
    pub fn get_global_collateral(env: Env) -> Result<u128, Error> {
        let storage = env.storage().instance();
        if !storage.has(&DataKey::Initialized) {
            return Err(Error::NotInitialized);
        }
        let balances: Map<Symbol, u128> = storage.get(&DataKey::Balances).ok_or(Error::NotInitialized)?;
        let mut total: u128 = 0;
        for (_chain, balance) in balances.iter() {
            total = total.checked_add(balance).ok_or(Error::MathOverflow)?;
        }
        Ok(total)
    }

    /// Calculates the Localized Divergence Factor (Delta_i) for a given spoke chain.
    /// Delta_i = Local_Vault_Balance / (Global_Collateral * Target_Weight_i)
    /// Scaled to 4 decimal places (10000 = 1.0 equilibrium).
    pub fn get_divergence_factor(env: Env, chain: Symbol) -> Result<u32, Error> {
        let storage = env.storage().instance();
        if !storage.has(&DataKey::Initialized) {
            return Err(Error::NotInitialized);
        }

        let balances: Map<Symbol, u128> = storage.get(&DataKey::Balances).ok_or(Error::NotInitialized)?;
        let weights: Map<Symbol, u32> = storage.get(&DataKey::Weights).ok_or(Error::NotInitialized)?;

        let local_balance = balances.get(chain.clone()).ok_or(Error::ChainNotFound)?;
        let weight = weights.get(chain).ok_or(Error::ChainNotFound)?;

        let global_collateral = Self::get_global_collateral(env.clone())?;
        if global_collateral == 0 {
            return Ok(10000); // Perfect equilibrium fallback
        }

        // To achieve precise calculation with scaled fixed-point math:
        // Delta = (Local_Balance * 10000) / Expected_Balance
        // Expected_Balance = (Global_Collateral * Weight) / 10000
        // Combined Formula: Delta = (Local_Balance * 100000000) / (Global_Collateral * Weight)
        let numerator = (local_balance as u128)
            .checked_mul(100000000)
            .ok_or(Error::MathOverflow)?;

        let denominator = global_collateral
            .checked_mul(weight as u128)
            .ok_or(Error::MathOverflow)?;

        if denominator == 0 {
            return Ok(10000);
        }

        let delta = numerator.checked_div(denominator).ok_or(Error::DivisionByZero)?;

        if delta > 100000 {
            Ok(100000) // Cap upper boundary to prevent overflow
        } else {
            Ok(delta as u32)
        }
    }

    /// Implements Asymmetric Localized Pricing formula:
    /// If Delta_i drops below the equilibrium threshold (0.85 / 8500), 
    /// programmatically apply a local price penalty (lambda) to protect the vault.
    pub fn get_localized_price(env: Env, chain: Symbol) -> Result<u128, Error> {
        let storage = env.storage().instance();
        if !storage.has(&DataKey::Initialized) {
            return Err(Error::NotInitialized);
        }

        let initial_price: u128 = storage.get(&DataKey::InitialPrice).ok_or(Error::NotInitialized)?;
        let slope: u128 = storage.get(&DataKey::Slope).ok_or(Error::NotInitialized)?;
        let global_supply: u128 = storage.get(&DataKey::GlobalSupply).ok_or(Error::NotInitialized)?;

        // Bonding Curve: Global Price = Initial Price + (Slope * Global Supply)
        let global_price = initial_price
            .checked_add(slope.checked_mul(global_supply).ok_or(Error::MathOverflow)?)
            .ok_or(Error::MathOverflow)?;

        let delta = Self::get_divergence_factor(env.clone(), chain)?;

        // Equilibrium threshold is 0.85 (8500 basis points)
        if delta < 8500 {
            // Apply localized price penalty (lambda coefficient = 2)
            // Penalty fraction = (8500 - delta) * 2
            let divergence = 8500u32.checked_sub(delta).ok_or(Error::MathOverflow)?;
            let penalty_bps = (divergence as u128)
                .checked_mul(2)
                .ok_or(Error::MathOverflow)?;

            // Cap maximum penalty to 90% (9000 bps) to prevent price going negative or zero
            let penalty_bps = if penalty_bps > 9000 { 9000 } else { penalty_bps };

            let multiplier = 10000u128.checked_sub(penalty_bps).ok_or(Error::MathOverflow)?;
            let local_price = global_price
                .checked_mul(multiplier)
                .ok_or(Error::MathOverflow)?
                .checked_div(10000)
                .ok_or(Error::DivisionByZero)?;

            Ok(local_price)
        } else {
            Ok(global_price)
        }
    }

    /// Validates client signatures, updates instance balance sheets, updates global pricing bonding curve,
    /// and logs a multi-chain synchronization event.
    pub fn register_cross_vm_action(
        env: Env,
        nullifier: BytesN<32>,
        chain: Symbol,
        amount_delta: i128, // Positive for deposits, negative for payouts
        signature: BytesN<64>,
    ) -> Result<u128, Error> {
        let storage = env.storage().instance();
        if !storage.has(&DataKey::Initialized) {
            return Err(Error::NotInitialized);
        }

        // 1. Replay Prevention: Check and register nullifier in Temporary Storage
        let temp_storage = env.storage().temporary();
        if temp_storage.has(&nullifier) {
            return Err(Error::NullifierAlreadySpent);
        }
        temp_storage.set(&nullifier, &true);
        temp_storage.extend_ttl(&nullifier, 5000, 5000);

        // 2. Intent Cryptographic Signature Verification
        let validator_key: BytesN<32> = storage.get(&DataKey::ValidatorKey).ok_or(Error::NotInitialized)?;
        
        let mut message = Bytes::new(&env);
        message.append(&nullifier.clone().into());
        message.append(&chain.clone().to_xdr(&env));

        let is_positive = amount_delta >= 0;
        let abs_amount = amount_delta.unsigned_abs();

        let mut amount_bytes = Bytes::new(&env);
        amount_bytes.push_back(if is_positive { 1u8 } else { 0u8 });

        let mut temp = abs_amount;
        for _ in 0..16 {
            let byte = (temp & 0xFF) as u8;
            amount_bytes.push_back(byte);
            temp >>= 8;
        }
        message.append(&amount_bytes);

        // ed25519_verify returns () and panics internally on an invalid signature —
        // it does not return a bool, so Error::InvalidSignature can no longer be
        // returned from here; an invalid signature now aborts the transaction directly.
        env.crypto().ed25519_verify(&validator_key, &message, &signature);

        // 3. Update Balance Sheets (Instance Storage)
        let mut balances: Map<Symbol, u128> = storage.get(&DataKey::Balances).ok_or(Error::NotInitialized)?;
        let current_balance = balances.get(chain.clone()).ok_or(Error::ChainNotFound)?;

        let updated_balance = if is_positive {
            current_balance
                .checked_add(abs_amount)
                .ok_or(Error::MathOverflow)?
        } else {
            if current_balance < abs_amount {
                return Err(Error::InsufficientCollateral);
            }
            current_balance
                .checked_sub(abs_amount)
                .ok_or(Error::MathOverflow)?
        };

        balances.set(chain.clone(), updated_balance);
        storage.set(&DataKey::Balances, &balances);

        // 4. Update Global Supply Sheet
        let global_supply: u128 = storage.get(&DataKey::GlobalSupply).ok_or(Error::NotInitialized)?;
        let updated_global_supply = if is_positive {
            global_supply
                .checked_add(abs_amount)
                .ok_or(Error::MathOverflow)?
        } else {
            global_supply
                .checked_sub(abs_amount)
                .ok_or(Error::MathOverflow)?
        };
        storage.set(&DataKey::GlobalSupply, &updated_global_supply);

        // 5. Bonding Curve Recalculation
        let initial_price: u128 = storage.get(&DataKey::InitialPrice).ok_or(Error::NotInitialized)?;
        let slope: u128 = storage.get(&DataKey::Slope).ok_or(Error::NotInitialized)?;
        
        let current_global_price = initial_price
            .checked_add(slope.checked_mul(updated_global_supply).ok_or(Error::MathOverflow)?)
            .ok_or(Error::MathOverflow)?;

        // 6. Emit GlobalPoolStateSync Event
        env.events().publish(
            (symbol_short!("sync"), nullifier),
            (current_global_price, balances),
        );

        Ok(current_global_price)
    }
}
