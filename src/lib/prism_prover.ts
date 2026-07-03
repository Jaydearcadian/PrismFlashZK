/**
 * PrismZK client-side prover.
 *
 * Runs in the browser (bb.js is WASM) so the user's secret_key never leaves the client —
 * the "Chainless Identity / master key never exposed" property. Produces a real Noir
 * UltraHonk proof whose public outputs are (nullifier, payload_commitment); a server-side
 * attestor (src/lib/attestor.ts) verifies that proof and signs the clearance the Soroban
 * contract checks.
 *
 * REAL CRYPTO — no mocks. The two security-critical values (nullifier, payload_commitment)
 * are computed *inside* the circuit and returned as public outputs, so there is no JS-side
 * Poseidon2 to bit-match for them. The one off-circuit hash, `intents_root`, uses bb.js's
 * own `poseidon2Hash`, which was verified byte-for-byte identical to the circuit's
 * `Poseidon2::hash` (same barretenberg round constants).
 *
 * Requires the compiled circuit artifact circuits/target/prism_circuit.json — run
 * `npm run compile-circuit` first (needs access to the Aztec CRS host to also emit the VK).
 */
import { Noir } from "@noir-lang/noir_js";
import { UltraHonkBackend, Barretenberg, BackendType, BarretenbergSync } from "@aztec/bb.js";
import type { MultiVMIntent } from "./prism_sdk";

// BN254 scalar field prime — field elements are reduced mod this.
const BN254_FR = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

// Loaded lazily at runtime via fetch (NOT a static import) so the Vite build doesn't try
// to bundle circuits/target/prism_circuit.json — that file is gitignored and produced by
// `npm run compile-circuit`, and the server serves it as a static asset. Fetching keeps the
// app building even before the circuit is compiled, and fails with a clear message at
// prove-time if it's missing.
let circuitProgram: any | null = null;
async function loadCircuit(): Promise<any> {
  if (circuitProgram) return circuitProgram;
  const res = await fetch("/circuits/target/prism_circuit.json");
  if (!res.ok) {
    throw new Error(
      "Compiled circuit not found at /circuits/target/prism_circuit.json — run `npm run compile-circuit` first."
    );
  }
  circuitProgram = await res.json();
  return circuitProgram;
}

/** value (decimal string, 0x-hex, number, or bigint) → 32-byte big-endian field buffer. */
export function toFieldBuffer(value: string | number | bigint): Uint8Array {
  let v: bigint;
  if (typeof value === "bigint") v = value;
  else if (typeof value === "number") v = BigInt(value);
  else if (value.startsWith("0x")) v = BigInt(value);
  else v = BigInt(value);
  v = ((v % BN254_FR) + BN254_FR) % BN254_FR;
  const buf = new Uint8Array(32);
  for (let i = 31; i >= 0; i--) {
    buf[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return buf;
}

function toHex(bytes: Uint8Array): string {
  return "0x" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Real Poseidon2 over the BN254 scalar field, via barretenberg (bb.js) — the SAME
 * primitive the Noir circuit uses. Inputs are field-encoded (see toFieldBuffer).
 * Verified in-repo: poseidon2Field(['5','7']) === the circuit's Poseidon2::hash([5,7],2).
 */
export async function poseidon2Field(inputs: Array<string | number | bigint>): Promise<string> {
  const api = await BarretenbergSync.initSingleton();
  const res = api.poseidon2Hash({ inputs: inputs.map((x) => toFieldBuffer(x)) });
  return toHex(res.hash);
}

/**
 * Deterministic commitment over the multi-VM destination parameters. This is the circuit's
 * private `intents_root` input — the circuit takes it as given and folds it into
 * payload_commitment, so any stable, binding encoding works; we use poseidon2 over the four
 * destination fields (addresses reduced to a field via SHA-256 → mod p, amounts directly).
 * Whoever audits a cleared intent recomputes this from the destinations and checks that
 * payload_commitment = poseidon2(intents_root, max_block_height) matches on-chain.
 */
export async function computeIntentsRoot(intent: MultiVMIntent): Promise<string> {
  const addrField = async (addr: string): Promise<bigint> => {
    const data = new TextEncoder().encode(addr);
    const digest = await getSubtle().digest("SHA-256", data);
    return BigInt(toHex(new Uint8Array(digest))) % BN254_FR;
  };
  const fields = [
    await addrField(intent.solanaRecipient),
    BigInt(intent.solanaAmount),
    await addrField(intent.movementRecipient),
    BigInt(intent.movementAmount),
  ];
  return poseidon2Field(fields);
}

// SubtleCrypto is `crypto.subtle` in the browser and `globalThis.crypto.subtle` in Node ≥ 20.
function getSubtle(): SubtleCrypto {
  const c: any = (globalThis as any).crypto;
  if (!c?.subtle) throw new Error("SubtleCrypto unavailable (need a browser or Node >= 20)");
  return c.subtle;
}

export interface ProofResult {
  proofHex: string;        // 0x-hex of the UltraHonk proof bytes
  publicInputs: string[];  // field elements: max_block_height + the two returned commitments
  nullifier: string;       // returned public output (from witness execution)
  payloadCommitment: string; // returned public output
}

/**
 * Generate a real UltraHonk proof. NOTE: proving needs the Aztec CRS (trusted-setup SRS)
 * downloaded from crs.aztec-cdn.foundation — works in the browser / any network-open
 * environment, but NOT where that host is firewalled.
 */
export async function prove(
  secretKey: string,
  nonce: string,
  intentsRoot: string,
  maxBlockHeight: number
): Promise<ProofResult> {
  const program = await loadCircuit();
  const noir = new Noir(program);
  const { witness, returnValue } = await noir.execute({
    secret_key: secretKey,
    nonce,
    intents_root: intentsRoot,
    max_block_height: maxBlockHeight,
  });
  // return tuple (nullifier, payload_commitment)
  const [nullifier, payloadCommitment] = returnValue as [string, string];

  const api = await Barretenberg.new({ backend: BackendType.Wasm });
  const backend = new UltraHonkBackend(program.bytecode, api);
  const proof = await backend.generateProof(witness);
  await api.destroy?.();

  return {
    proofHex: toHex(proof.proof),
    publicInputs: proof.publicInputs,
    nullifier,
    payloadCommitment,
  };
}
