// PrismZK - Local Proving Circuit
// Enforces replay prevention and state binding invariants over the BN254 scalar field.
//
// The circuit COMPUTES the nullifier and payload_commitment from private inputs and
// RETURNS them as public outputs (rather than taking them as asserted public inputs).
// This means the two security-critical values are, by construction, exactly what the
// proof attests — the off-chain attestor and the Soroban contract consume the proof's
// public outputs directly, so there is no separate JS-side Poseidon2 to bit-match for
// these two values (only intents_root is computed off-circuit, from barretenberg's own
// poseidon2 — see src/lib/prism_prover.ts).
//
// NOTE ON ON-CHAIN VERIFICATION: Soroban does not yet expose live BN254 pairing or
// Poseidon host functions (CAP-0074 / CAP-0075 are proposed, not shipped as of this
// writing). Until they land, a proof from this circuit is verified off-chain and
// relayed on-chain via a signed attestation, per Stellar's documented near-term pattern
// for Noir/BN254 circuits. See contracts/soroban/prism_verifier/src/lib.rs.

use poseidon::poseidon2::Poseidon2;

fn main(
    // --- Private Witness Inputs ---
    secret_key: Field,
    nonce: Field,
    intents_root: Field, // Poseidon2 commitment of multi-VM destination parameters

    // --- Public Input ---
    // u32 (not u64) to match the Soroban verifier's 68-byte attestation message
    // (nullifier(32) || payload_commitment(32) || max_block_height.to_be_bytes()).
    max_block_height: pub u32,
) -> pub (Field, Field) {
    // Replay Prevention Invariant (Nullifier N = Poseidon2(secret_key, nonce)).
    // Only reproducible by whoever knows secret_key, so it doubles as the
    // identity-authority check — no separate public-key derivation step is needed.
    let nullifier = Poseidon2::hash([secret_key, nonce], 2);

    // State Binding Invariant (Commitment C = Poseidon2(intents_root, max_block_height)).
    // If a Solver changes the destination wallet or amount, intents_root changes, so the
    // commitment changes, and the proof no longer matches the on-chain-checked value.
    let payload_commitment = Poseidon2::hash([intents_root, max_block_height as Field], 2);

    (nullifier, payload_commitment)
}
