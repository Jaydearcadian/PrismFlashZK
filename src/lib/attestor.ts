/**
 * PrismZK attestor (server-side).
 *
 * The trusted off-chain signer in the optimistic + trusted-attestor model. It receives a
 * client-generated UltraHonk proof, verifies it against the circuit's verification key, and
 * — only if it verifies — signs the exact 68-byte message the Soroban `prism_verifier`
 * contract re-checks with `ed25519_verify`:
 *
 *     message = nullifier(32) || payload_commitment(32) || max_block_height (u32 big-endian)
 *
 * The attestor's ed25519 PUBLIC key is what `prism_verifier.initialize(attestor_key)`
 * registers on-chain; its private seed is ATTESTOR_PRIVATE_KEY (distinct from the liquidity
 * watcher's LIQUIDITY_VALIDATOR_PRIVATE_KEY — different trust domains).
 *
 * It signs the nullifier/commitment it EXTRACTS FROM THE VERIFIED PROOF's public inputs,
 * never values passed alongside untrusted — so a valid signature always corresponds to a
 * proof that actually verified for those exact public inputs.
 *
 * NOTE: verifyProof (UltraHonk) needs the Aztec CRS, same as proving. Runs wherever that
 * host is reachable; the pure signing/extraction helpers below need no CRS and are unit-tested.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nacl from "tweetnacl";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VK_PATH = path.resolve(__dirname, "../../circuits/target/prism_vk.bin");
const BN254_FR = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

/** 0x-hex (or decimal) field string → 32-byte big-endian buffer. */
export function fieldToBytes(field: string): Uint8Array {
  let v = BigInt(field) % BN254_FR;
  const out = new Uint8Array(32);
  for (let i = 31; i >= 0; i--) {
    out[i] = Number(v & 0xffn);
    v >>= 8n;
  }
  return out;
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  return "0x" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Extract (nullifier, payload_commitment) from a proof's public-input vector without
 * assuming bb's public-input ordering: the entry numerically equal to max_block_height is
 * the public parameter; the other two (kept in their original relative order) are the
 * circuit's return tuple (nullifier, payload_commitment).
 */
export function extractPublicInputs(
  publicInputs: string[],
  maxBlockHeight: number
): { nullifier: string; payloadCommitment: string } {
  if (publicInputs.length !== 3) {
    throw new Error(`expected 3 public inputs, got ${publicInputs.length}`);
  }
  const heightIdx = publicInputs.findIndex((f) => BigInt(f) === BigInt(maxBlockHeight));
  if (heightIdx === -1) {
    throw new Error("max_block_height not found among proof public inputs");
  }
  const rest = publicInputs.filter((_, i) => i !== heightIdx);
  return { nullifier: rest[0], payloadCommitment: rest[1] };
}

/** Build the exact 68-byte message the Soroban prism_verifier contract re-hashes. */
export function buildAttestationMessage(
  nullifier: string,
  payloadCommitment: string,
  maxBlockHeight: number
): Uint8Array {
  const height = new Uint8Array(4);
  new DataView(height.buffer).setUint32(0, maxBlockHeight, false); // big-endian
  const msg = new Uint8Array(68);
  msg.set(fieldToBytes(nullifier), 0);
  msg.set(fieldToBytes(payloadCommitment), 32);
  msg.set(height, 64);
  return msg;
}

/** ed25519 keypair from the 32-byte ATTESTOR_PRIVATE_KEY seed (hex). */
export function attestorKeypair(seedHex = process.env.ATTESTOR_PRIVATE_KEY): nacl.SignKeyPair {
  if (!seedHex) throw new Error("ATTESTOR_PRIVATE_KEY not set");
  const seed = hexToBytes(seedHex);
  if (seed.length !== 32) throw new Error("ATTESTOR_PRIVATE_KEY must be a 32-byte hex seed");
  return nacl.sign.keyPair.fromSeed(seed);
}

/** The public key to register on-chain via prism_verifier.initialize(attestor_key). */
export function attestorPublicKeyHex(seedHex?: string): string {
  return bytesToHex(attestorKeypair(seedHex).publicKey);
}

/** Detached ed25519 signature over the 68-byte attestation message. */
export function signAttestation(
  nullifier: string,
  payloadCommitment: string,
  maxBlockHeight: number,
  seedHex?: string
): string {
  const kp = attestorKeypair(seedHex);
  const message = buildAttestationMessage(nullifier, payloadCommitment, maxBlockHeight);
  return bytesToHex(nacl.sign.detached(message, kp.secretKey));
}

let cachedVk: Uint8Array | null = null;
export function loadVk(): Uint8Array {
  if (cachedVk) return cachedVk;
  if (!fs.existsSync(VK_PATH)) {
    throw new Error(`Verification key not found at ${VK_PATH} — run \`npm run compile-circuit\` first.`);
  }
  cachedVk = new Uint8Array(fs.readFileSync(VK_PATH));
  return cachedVk;
}

export interface Attestation {
  signature: string;         // 0x-hex, 64-byte ed25519 detached signature
  nullifier: string;
  payloadCommitment: string;
  maxBlockHeight: number;
}

/**
 * Verify a client UltraHonk proof and, if valid, sign the clearance attestation.
 * Throws if the proof does not verify (no signature is issued).
 */
export async function attest(
  proofHex: string,
  publicInputs: string[],
  maxBlockHeight: number
): Promise<Attestation> {
  const { Barretenberg, BackendType, UltraHonkVerifierBackend } = await import("@aztec/bb.js");
  const vk = loadVk();
  const api = await Barretenberg.new({ backend: BackendType.Wasm });
  try {
    const backend = new UltraHonkVerifierBackend(api);
    const verified = await backend.verifyProof({
      proof: hexToBytes(proofHex),
      publicInputs,
      verificationKey: vk,
    });
    if (!verified) throw new Error("proof verification failed");
  } finally {
    await api.destroy?.();
  }

  const { nullifier, payloadCommitment } = extractPublicInputs(publicInputs, maxBlockHeight);
  const signature = signAttestation(nullifier, payloadCommitment, maxBlockHeight);
  return { signature, nullifier, payloadCommitment, maxBlockHeight };
}
