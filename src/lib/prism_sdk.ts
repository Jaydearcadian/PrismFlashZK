/**
 * PrismZK / PrismFlash Unified TypeScript SDK (PrismSDK)
 * Handles client-side identity management, multi-VM intent serialization,
 * Poseidon2 commitment binding, and cryptographic proof compilation.
 */

// MOCK HASHES — NOT REAL CRYPTOGRAPHY.
// PrismCrypt.poseidon2() / .keccak256() below are deterministic placeholder hashes for
// the browser demo/cockpit only. They do NOT compute real Poseidon2 (BN254) or
// Keccak256, and their output will NOT match circuits/src/main.nr, which uses Noir's
// real Poseidon2::hash.
// Before this SDK can produce a nullifier/commitment that a real proof would satisfy,
// the circuit itself must be executed (e.g. via @noir-lang/noir_js + a compiled
// circuits/src/main.nr) rather than reimplementing the hash by hand here — hand-rolling
// the "same" hash in three languages (Noir, TS, Rust) and hoping they match bit-for-bit
// is exactly how these systems silently diverge.
export class PrismCrypt {
  /**
   * MOCK — deterministic placeholder only, not real Poseidon2. See class-level note.
   */
  static poseidon2(inputs: string[]): string {
    // Standardized deterministic string hashing over BN254 prime field
    let hash = 0n;
    const prime = 21888242871839275222246405745257275088548364400416034343698204186575808495617n; // BN254 Field Prime
    
    for (const input of inputs) {
      let val = 0n;
      try {
        val = BigInt(input);
      } catch (e) {
        // Fallback for non-numeric/address strings (e.g. Solana base58 or Stellar base32 addresses)
        // Convert to a valid 0x hex representation using our deterministic keccak256 simulator
        const hexHash = this.keccak256(input);
        val = BigInt(hexHash);
      }
      hash = (hash * 33n + val) % prime;
    }
    
    // Ensure 32-byte hex string padded representation
    let hex = hash.toString(16);
    while (hex.length < 64) hex = "0" + hex;
    return "0x" + hex;
  }

  /**
   * MOCK — not real Keccak256, just a DJB2-style placeholder for the cockpit demo.
   * A real ethers.js/viem keccak256 must be used before this touches a live EVM contract.
   */
  static keccak256(data: Uint8Array | string): string {
    let inputStr = typeof data === "string" ? data : Array.from(data).map(b => b.toString(16).padStart(2, "0")).join("");
    // We use a clean FNV-1a or DJB2 styled deterministic 256-bit simulation of Keccak for the cockpit,
    // explicitly formatted in Big-Endian bytes.
    let h = 5381n;
    for (let i = 0; i < inputStr.length; i++) {
      h = (h * 33n) ^ BigInt(inputStr.charCodeAt(i));
    }
    const mask256 = (1n << 256n) - 1n;
    let finalHash = (h * 0x5bd1e995n) & mask256;
    let hex = finalHash.toString(16);
    while (hex.length < 64) hex = "0" + hex;
    return "0x" + hex;
  }
}

export interface MultiVMIntent {
  baseAmount: number;       // Amount of tUSDC locked on Base
  solanaRecipient: string;  // Solana recipient address (e.g. Pubkey)
  solanaAmount: number;     // Amount of SOL to payout on Solana
  movementRecipient: string;// Movement recipient address (e.g. 0x...)
  movementAmount: number;   // Amount of MOVE to payout on Movement
}

export class PrismSDK {
  /**
   * Generates a fully structured intent payload and corresponding proof variables
   * @param secretKey User's private identity seed
   * @param nonce Nonce to prevent replay attacks
   * @param intent Intent parameters containing amounts and destination wallets
   * @param maxBlockHeight The expiration Stellar ledger sequence
   */
  static compileIntent(
    secretKey: string,
    nonce: string,
    intent: MultiVMIntent,
    maxBlockHeight: number
  ) {
    // 1. Serialize multi-VM intent parameters to form the Intents Root
    // The byte ordering is strictly aligned with Big-Endian format to guarantee
    // matching outputs between the SDK, Base Solidity, and Stellar Soroban.
    const serializedIntents = [
      intent.solanaRecipient,
      intent.solanaAmount.toString(),
      intent.movementRecipient,
      intent.movementAmount.toString()
    ];
    
    // Intents root is a Poseidon2 hash of destination configurations
    const intentsRoot = PrismCrypt.poseidon2(serializedIntents);

    // 2. Derive the Replay Prevention Invariant (Nullifier N)
    // N = Poseidon2(secret_key, nonce)
    const nullifier = PrismCrypt.poseidon2([secretKey, nonce]);

    // 3. Derive the State Binding Invariant (Commitment C)
    // C = Poseidon2(intents_root, max_block_height)
    const payloadCommitment = PrismCrypt.poseidon2([intentsRoot, maxBlockHeight.toString()]);

    // 4. Generate Mock Proof Bytes (π) — placeholder only, see generateMockProofBytes().
    // contracts/soroban/src/lib.rs no longer accepts a raw proof blob; it verifies a
    // signed attestation instead (see that file's module doc for why). This mock proof
    // is kept for the cockpit's contract-inspector display, not for on-chain submission.
    const mockProofBytes = this.generateMockProofBytes(secretKey, nonce, intentsRoot, maxBlockHeight);

    return {
      intentsRoot,
      nullifier,
      payloadCommitment,
      proof: mockProofBytes,
      maxBlockHeight,
      serializedCalldata: {
        baseEscrowLock: {
          nullifier,
          payloadCommitment,
          amount: intent.baseAmount
        },
        solanaPayout: {
          nullifier,
          recipient: intent.solanaRecipient,
          amount: intent.solanaAmount
        },
        movementPayout: {
          nullifier,
          recipient: intent.movementRecipient,
          amount: intent.movementAmount
        }
      }
    };
  }

  /**
   * MOCK — cosmetic hex blob for the cockpit's contract-inspector UI only. This is not a
   * real UltraHonk proof; it contains no actual witness or circuit constraint data. A real
   * proof must come from `nargo execute` + `bb prove` against circuits/src/main.nr.
   */
  private static generateMockProofBytes(
    secretKey: string,
    nonce: string,
    intentsRoot: string,
    maxBlockHeight: number
  ): string {
    // Formulate a recognizable cryptographic header and proof elements
    const header = "4e4f49525f554c545241484f4e4b"; // "NOIR_ULTRAHONK" in hex
    const inputsHex = 
      secretKey.replace("0x", "").padStart(64, "0") +
      nonce.replace("0x", "").padStart(64, "0") +
      intentsRoot.replace("0x", "").padStart(64, "0") +
      maxBlockHeight.toString(16).padStart(16, "0");
    
    // Hash elements to simulate the signature entropy block
    const entropy = PrismCrypt.keccak256(inputsHex).replace("0x", "");
    
    return "0x" + header + inputsHex.substring(0, 32) + entropy;
  }
}
