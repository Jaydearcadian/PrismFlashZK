#!/usr/bin/env node
/**
 * Compile-time step for the PrismZK Noir circuit.
 *
 * Compiles circuits/src/main.nr → ACIR (via @noir-lang/noir_wasm, no `nargo` CLI needed)
 * and derives the UltraHonk verification key (via @aztec/bb.js). Writes two committed
 * artifacts the runtime depends on:
 *   - circuits/target/prism_circuit.json  (ACIR program: bytecode + ABI, used by the client prover)
 *   - circuits/target/prism_vk.bin        (verification key, used by the server-side attestor)
 *
 * Re-run whenever circuits/src/main.nr changes — the VK is circuit-bound.
 *
 *   npm run compile-circuit
 *
 * Toolchain is pinned in package.json: @noir-lang/noir_js + noir_wasm 1.0.0-beta.22,
 * paired with @aztec/bb.js 5.0.0-nightly.20260522 (the bb version noir beta.22 targets).
 */
import { createRequire } from "module";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const CIRCUIT_DIR = path.join(REPO_ROOT, "circuits");
const TARGET_DIR = path.join(CIRCUIT_DIR, "target");

// noir_wasm's ESM `import` entry resolves to the browser build (where the file-manager
// helper is a stub). `require()` selects the "node" export condition → the CJS build that
// can read the real filesystem and exposes `createFileManager`.
const noirWasm = require("@noir-lang/noir_wasm");

export async function compileCircuit() {
  const fm = noirWasm.createFileManager(CIRCUIT_DIR);
  const compiled = await noirWasm.compile(fm);
  const program = compiled.program;
  fs.mkdirSync(TARGET_DIR, { recursive: true });
  fs.writeFileSync(path.join(TARGET_DIR, "prism_circuit.json"), JSON.stringify(program));
  return program;
}

export async function deriveVerificationKey(program) {
  const { Barretenberg, BackendType, UltraHonkBackend } = await import("@aztec/bb.js");
  // Force the WASM backend: the node default first probes a native `bb` unix socket that
  // doesn't exist here and hangs before falling back.
  const api = await Barretenberg.new({ backend: BackendType.Wasm });
  const backend = new UltraHonkBackend(program.bytecode, api);
  const vk = await backend.getVerificationKey();
  fs.writeFileSync(path.join(TARGET_DIR, "prism_vk.bin"), Buffer.from(vk));
  await api.destroy?.();
  return vk;
}

async function main() {
  console.log("Compiling circuits/src/main.nr → ACIR ...");
  const program = await compileCircuit();
  console.log(`  ✔ noir ${program.noir_version.split("+")[0]}; wrote circuits/target/prism_circuit.json`);
  console.log("Deriving UltraHonk verification key ...");
  const vk = await deriveVerificationKey(program);
  console.log(`  ✔ wrote circuits/target/prism_vk.bin (${vk.length} bytes)`);
  console.log("Done.");
  process.exit(0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    console.error("compile_circuit failed:", e.message);
    console.error((e.stack || "").split("\n").slice(0, 8).join("\n"));
    process.exit(1);
  });
}
