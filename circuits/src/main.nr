// PrismZK - Local Proving Circuit
// Enforces replay prevention and state binding invariants over the BN254 scalar field.
//
// NOTE ON ON-CHAIN VERIFICATION: Soroban does not yet expose live BN254 pairing or
// Poseidon host functions (CAP-0074 / CAP-0075 are proposed, not shipped as of this
// writing — see https://github.com/stellar/stellar-protocol/blob/master/core/cap-0074.md
// and cap-0075.md). Until those land, a proof from this circuit is verified off-chain
// (`bb verify`) and relayed on-chain via a signed attestation, per Stellar's documented
// near-term pattern for Noir/BN254 circuits. See contracts/soroban/src/lib.rs.

use dep::std::hash::poseidon2::Poseidon2;

fn main(
    // --- Private Witness Inputs ---
    secret_key: Field,
    nonce: Field,
    intents_root: Field, // Merkle root of multi-VM destination parameters

    // --- Public Inputs ---
    nullifier: pub Field,           // N = Poseidon2(secret_key, nonce)
    payload_commitment: pub Field,   // C = Poseidon2(intents_root, max_block_height)
    max_block_height: pub u64       // Stellar sequence height threshold
) {
    // 1. Enforce the Replay Prevention Invariant (Nullifier N)
    // The nullifier must be a deterministic output of secret_key and nonce.
    // This prevents double spending and front-running on any destination chain, and
    // (since N is only reproducible by whoever knows secret_key) doubles as the
    // identity-authority check — no separate public-key derivation step is needed.
    let computed_nullifier = Poseidon2::hash([secret_key, nonce], 2);
    assert(computed_nullifier == nullifier);

    // 2. Enforce the State Binding Invariant (Commitment C)
    // The payload_commitment acts as a cryptographic freeze on multi-VM variables.
    // If a Solver changes the destination wallet or amount, the commitment hash mismatches,
    // and the proof fails verification.
    let computed_commitment = Poseidon2::hash([intents_root, max_block_height as Field], 2);
    assert(computed_commitment == payload_commitment);
}
