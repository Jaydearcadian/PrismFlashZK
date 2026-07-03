/**
 * PrismZK / PrismFlash Unified TypeScript SDK (PrismSDK)
 * Client-side identity management, multi-VM intent serialization, and real Poseidon2
 * commitment binding.
 *
 * Cryptography is REAL — the mock PrismCrypt hashes that used to live here are gone.
 * nullifier, payload_commitment, and intents_root are computed with barretenberg's own
 * Poseidon2 (see src/lib/prism_prover.ts), which byte-matches the Noir circuit's
 * Poseidon2::hash. The actual UltraHonk proof is generated separately by prism_prover.prove()
 * during the cockpit's noir_prove step (client-side, so secret_key never leaves the browser).
 */
import { poseidon2Field, computeIntentsRoot } from "./prism_prover";

export interface MultiVMIntent {
  baseAmount: number;       // Amount of tUSDC locked on Base
  solanaRecipient: string;  // Solana recipient address (e.g. Pubkey)
  solanaAmount: number;     // Amount of SOL to payout on Solana
  movementRecipient: string;// Movement recipient address (e.g. 0x...)
  movementAmount: number;   // Amount of MOVE to payout on Movement
}

export interface DestinationPayout {
  chainId: string;
  vaultId: string;
  amount: number;
}

export interface CompiledIntent {
  intentsRoot: string;
  nullifier: string;
  payloadCommitment: string;
  maxBlockHeight: number;
  routePlan: { destinationPayouts: DestinationPayout[] };
  serializedCalldata: {
    baseEscrowLock: { nullifier: string; payloadCommitment: string; amount: number };
    solanaPayout: { nullifier: string; recipient: string; amount: number };
    movementPayout: { nullifier: string; recipient: string; amount: number };
  };
}

export class PrismSDK {
  /**
   * Compiles an intent into its real cryptographic commitments and the calldata/route plan
   * the rest of the flow needs. Does NOT generate the ZK proof — that is a separate,
   * heavier step (prism_prover.prove()) run in the cockpit's noir_prove phase. The values
   * computed here (nullifier, payload_commitment) equal the circuit's public outputs by
   * construction, since both use the same barretenberg Poseidon2.
   *
   * Async because Poseidon2 runs in WASM.
   */
  static async compileIntent(
    secretKey: string,
    nonce: string,
    intent: MultiVMIntent,
    maxBlockHeight: number
  ): Promise<CompiledIntent> {
    // intents_root: Poseidon2 commitment over the destination configuration.
    const intentsRoot = await computeIntentsRoot(intent);

    // Replay Prevention Invariant: N = Poseidon2(secret_key, nonce).
    const nullifier = await poseidon2Field([secretKey, nonce]);

    // State Binding Invariant: C = Poseidon2(intents_root, max_block_height).
    const payloadCommitment = await poseidon2Field([intentsRoot, maxBlockHeight]);

    // Route plan: destination spoke vaults + amounts, consumed by server.ts's
    // /api/swap/clear and /api/route/execute (matches the deployments/ vault ids).
    const destinationPayouts: DestinationPayout[] = [
      { chainId: "solana-devnet", vaultId: "solana-vault-pda", amount: intent.solanaAmount },
      { chainId: "movement-porto", vaultId: "movement-vault", amount: intent.movementAmount },
    ].filter((p) => p.amount > 0);

    return {
      intentsRoot,
      nullifier,
      payloadCommitment,
      maxBlockHeight,
      routePlan: { destinationPayouts },
      serializedCalldata: {
        baseEscrowLock: { nullifier, payloadCommitment, amount: intent.baseAmount },
        solanaPayout: { nullifier, recipient: intent.solanaRecipient, amount: intent.solanaAmount },
        movementPayout: { nullifier, recipient: intent.movementRecipient, amount: intent.movementAmount },
      },
    };
  }
}
