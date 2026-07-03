#!/usr/bin/env node
/**
 * Deploy orchestrator — deploys every contract that a real end-to-end swap needs, captures the
 * resulting on-chain addresses, and writes them into deployments/prism-assets.local.json so the
 * cockpit, watcher, and scripts/create_multivm_token.js all pick them up.
 *
 *   node scripts/deploy_testnet.js              # deploy the 4 contracts + Soroban registry code
 *   node scripts/deploy_testnet.js --with-token # also run create_multivm_token (issues the token
 *                                               # AND seeds the destination vaults/LPs) so you can
 *                                               # immediately try a swap
 *
 * Run scripts/preflight.js first (wallets + funding). Each chain is attempted independently: a
 * missing CLI or a failing chain is skipped with a warning, and whatever succeeds is still written
 * to deployments — so you can deploy what you can and fill in the rest later.
 *
 * NOTE: this shells out to forge / solana+anchor / movement / stellar. It was authored against the
 * commands in deploy_all.sh + DEPLOYMENT_GUIDE.md but a few CLI flags are version-specific — if a
 * step errors on a flag, the printed command shows exactly what ran so you can adjust.
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import nacl from "tweetnacl";
import base58 from "bs58";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(REPO_ROOT, ".env");
const DEPLOY_DIR = path.join(REPO_ROOT, "deployments");
const LOCAL = path.join(DEPLOY_DIR, "prism-assets.local.json");
const EXAMPLE = path.join(DEPLOY_DIR, "prism-assets.example.json");

const BASE_RPC = process.env.BASE_RPC_URL || "https://sepolia.base.org";
const MOVEMENT_RPC = process.env.MOVEMENT_RPC_URL || "https://aptos.testnet.porto.movementlabs.xyz/v1";
const withToken = process.argv.includes("--with-token");

const C = { r: "\x1b[31m", g: "\x1b[32m", y: "\x1b[33m", c: "\x1b[36m", b: "\x1b[1m", x: "\x1b[0m" };
const ok = (s) => `${C.g}${s}${C.x}`, warn = (s) => `${C.y}${s}${C.x}`, bad = (s) => `${C.r}${s}${C.x}`;
const step = (s) => console.log(`\n${C.c}${C.b}${s}${C.x}`);

// ---- env helpers ----
function readEnv() {
  const v = {};
  if (fs.existsSync(ENV_PATH)) for (const line of fs.readFileSync(ENV_PATH, "utf8").split("\n")) {
    const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/); if (!m) continue;
    let val = (m[2] || "").trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    v[m[1].trim()] = val;
  }
  return v;
}
function writeEnv(v) { fs.writeFileSync(ENV_PATH, Object.entries(v).map(([k, x]) => `${k}="${x}"`).join("\n") + "\n"); }

// ---- deployments merge (incremental, so partial deploys are preserved) ----
function loadDeployments() {
  const src = fs.existsSync(LOCAL) ? LOCAL : EXAMPLE;
  const d = JSON.parse(fs.readFileSync(src, "utf8"));
  delete d._comment;
  return d;
}
function saveDeployments(d) {
  fs.mkdirSync(DEPLOY_DIR, { recursive: true });
  fs.writeFileSync(LOCAL, JSON.stringify(d, null, 2));
}

function have(cli) {
  try { execFileSync("bash", ["-lc", `command -v ${cli}`], { stdio: "ignore" }); return true; }
  catch { return false; }
}
function run(cmd, args, opts = {}) {
  console.log(`${C.b}$ ${cmd} ${args.join(" ")}${C.x}`);
  const stdio = opts.stdio || ["ignore", "pipe", "pipe"];
  const input = opts.input ? Buffer.from(opts.input) : undefined;
  return execFileSync(cmd, args, {
    encoding: "utf8",
    stdio,
    input,
    ...opts,
    input: undefined,
  });
}

const summary = [];

// ---- Base Sepolia: BaseEscrow.sol via forge ----
function deployBase(env, d) {
  step("[1/4] Base Sepolia — BaseEscrow.sol (forge)");
  if (!have("forge")) { console.log(warn("forge not found — skipping (install Foundry).")); return; }
  if (!env.EVM_PRIVATE_KEY) { console.log(warn("EVM_PRIVATE_KEY missing — run preflight. Skipping.")); return; }
  try {
    const dir = path.join(REPO_ROOT, "contracts", "solidity");
    run("forge", ["build"], { cwd: dir });
    const out = run("forge", ["create", "--rpc-url", BASE_RPC, "--private-key", env.EVM_PRIVATE_KEY, "BaseEscrow.sol:BaseEscrow", "--broadcast"], { cwd: dir });
    const addr = (out.match(/Deployed to:\s*(0x[0-9a-fA-F]{40})/) || [])[1];
    if (!addr) throw new Error("could not parse deployed address from forge output");
    d.chains["base-sepolia"].contracts.escrow = addr;
    saveDeployments(d);
    console.log(ok(`BaseEscrow deployed: ${addr}`));
    summary.push(["Base Sepolia", ok(`escrow ${addr}`)]);
  } catch (e) { console.log(bad(`Base deploy failed: ${e.message.split("\n").slice(-3).join(" ")}`)); summary.push(["Base Sepolia", bad("failed")]); }
}

// ---- Solana Devnet: solana_vault (anchor) ----
function deploySolana(env, d) {
  step("[2/4] Solana Devnet — solana_vault (anchor)");
  if (!have("anchor") || !have("solana")) { console.log(warn("solana/anchor not found — skipping.")); return; }
  try {
    const dir = path.join(REPO_ROOT, "contracts", "solana");
    const kpPath = path.join(dir, "target", "deploy", "solana_vault-keypair.json");
    fs.mkdirSync(path.dirname(kpPath), { recursive: true });
    if (!fs.existsSync(kpPath)) run("solana-keygen", ["new", "--no-bip39-passphrase", "--force", "-o", kpPath]);
    const progId = run("solana", ["address", "-k", kpPath]).trim();
    console.log(`  program id: ${progId}`);

    // Sync declare_id!() and Anchor.toml to the freshly-generated program id.
    const libPath = path.join(dir, "programs", "solana_vault", "src", "lib.rs");
    let lib = fs.readFileSync(libPath, "utf8").replace(/declare_id!\("[^"]*"\)/, `declare_id!("${progId}")`);
    fs.writeFileSync(libPath, lib);
    const anchorToml = path.join(dir, "Anchor.toml");
    let toml = fs.readFileSync(anchorToml, "utf8").replace(/solana_vault\s*=\s*"[^"]*"/, `solana_vault = "${progId}"`);
    fs.writeFileSync(anchorToml, toml);

    // Use the funded .env payer for anchor (ANCHOR_WALLET), so we don't depend on ~/.config/solana.
    // The .env value may be either a 64-byte JSON byte array (direct) OR a 32-byte base58 seed;
    // we always convert to a proper JSON-array keypair file before invoking solana/anchor.
    const payerPath = path.join(dir, "target", "deploy", "prism-payer.json");
    const payerJson = (() => {
      const raw = (env.SOLANA_PRIVATE_KEY || "").trim();
      try {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length === 64) return arr;
      } catch { /* fall through to base58 decode */ }
      try {
        const seed = base58.decode(raw);
        if (seed.length === 32) {
          const sk = nacl.sign.keyPair.fromSeed(seed);
          return Array.from(sk.secretKey);
        }
        if (seed.length === 64) return Array.from(seed);
      } catch { /* ignore */ }
      throw new Error("SOLANA_PRIVATE_KEY neither JSON byte array nor seed/secret base58");
    })();
    fs.writeFileSync(payerPath, JSON.stringify(payerJson));
    const anchorEnv = { ...process.env, ANCHOR_WALLET: payerPath };

    run("solana", ["config", "set", "--url", "devnet"]);
    run("anchor", ["build"], { cwd: dir, env: anchorEnv });

    // Use solana-CLI's `program deploy` instead of `anchor deploy`. anchor deploy enforces
    // upgrade-authority matching across all callers; for our orchestrator we want fresh
    // program-id creation on first run, which solana program deploy handles gracefully.
    run(
      "solana",
      [
        "program", "deploy",
        "--url", "devnet",
        "--program-id", kpPath,
        "--keypair", payerPath,
        "target/deploy/solana_vault.so",
      ],
      { cwd: dir, env: anchorEnv }
    );

    d.chains["solana-devnet"].contracts.program = progId;
    saveDeployments(d);
    console.log(ok(`solana_vault deployed: ${progId}`));
    summary.push(["Solana Devnet", ok(`program ${progId}`)]);
  } catch (e) { console.log(bad(`Solana deploy failed: ${e.message.split("\n").slice(-3).join(" ")}`)); summary.push(["Solana Devnet", bad("failed")]); }
}

// ---- Movement Porto: movement_escrow + prism_pusd (movement) ----
function deployMovement(env, d) {
  step("[3/4] Movement Porto — movement_escrow + prism_pusd (movement)");
  if (!have("movement")) { console.log(warn("movement CLI not found — skipping.")); return; }
  if (!env.MOVEMENT_PRIVATE_KEY || !env.MOVEMENT_ADDRESS) { console.log(warn("MOVEMENT_* missing — run preflight. Skipping.")); return; }
  try {
    const dir = path.join(REPO_ROOT, "contracts", "move");
    // Publish under the funded account; --named-addresses overrides Move.toml's placeholder prism_addr.
    run("movement", ["init", "--profile", "prism", "--network", "custom", "--rest-url", MOVEMENT_RPC,
      "--private-key", env.MOVEMENT_PRIVATE_KEY, "--assume-yes"], { cwd: dir });
    run("movement", ["move", "publish", "--named-addresses", `prism_addr=${env.MOVEMENT_ADDRESS}`,
      "--profile", "prism", "--assume-yes"], { cwd: dir });

    d.chains["movement-porto"].contracts.escrow = `${env.MOVEMENT_ADDRESS}::movement_escrow`;
    d.chains["movement-porto"].contracts.coinModule = `${env.MOVEMENT_ADDRESS}::prism_pusd::PrismPUSD`;
    saveDeployments(d);
    console.log(ok(`Move package published under ${env.MOVEMENT_ADDRESS}`));
    summary.push(["Movement Porto", ok(`published @ ${env.MOVEMENT_ADDRESS}`)]);
  } catch (e) { console.log(bad(`Movement deploy failed: ${e.message.split("\n").slice(-3).join(" ")}`)); summary.push(["Movement Porto", bad("failed")]); }
}

// ---- Stellar Testnet: prism_verifier (deploy+init) + master_state_registry (upload) ----
function deployStellar(env, d) {
  step("[4/4] Stellar Testnet — prism_verifier + master_state_registry (stellar)");
  if (!have("stellar")) { console.log(warn("stellar CLI not found — skipping.")); return; }
  if (!env.STELLAR_PRIVATE_KEY) { console.log(warn("STELLAR_PRIVATE_KEY missing — run preflight. Skipping.")); return; }
  try {
    const dir = path.join(REPO_ROOT, "contracts", "soroban");
    // `deployer` already registered from a prior session — only run `keys add` if missing.
    const haveDeployer = execFileSync("bash", ["-lc", "stellar keys ls"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] })
      .split("\n").map((s) => s.trim()).includes("deployer");
    if (!haveDeployer) {
      try {
        run(
          "stellar",
          ["keys", "add", "deployer", "--secret-key", "--overwrite"],
          { input: env.STELLAR_PRIVATE_KEY + "\n", stdio: ["pipe", "pipe", "pipe"] }
        );
      } catch (e) {
        throw new Error(`stellar keys add deployer failed: ${e.message}`);
      }
    }
    run("stellar", ["contract", "build"], { cwd: dir });
    const rel = "target/wasm32v1-none/release";

    const verifierId = run("stellar", ["contract", "deploy", "--wasm", `${rel}/prism_verifier.wasm`, "--source", "deployer", "--network", "testnet"], { cwd: dir })
      .trim().split("\n").pop().trim();
    const registryHash = run("stellar", ["contract", "upload", "--wasm", `${rel}/master_state_registry.wasm`, "--source", "deployer", "--network", "testnet"], { cwd: dir })
      .trim().split("\n").pop().trim();

    // Register the attestor's ed25519 public key on the verifier (generate the seed if absent).
    if (!env.ATTESTOR_PRIVATE_KEY) { env.ATTESTOR_PRIVATE_KEY = crypto.randomBytes(32).toString("hex"); writeEnv(env); console.log(warn("generated ATTESTOR_PRIVATE_KEY → .env")); }
    const attestorPubHex = Buffer.from(nacl.sign.keyPair.fromSeed(Buffer.from(env.ATTESTOR_PRIVATE_KEY, "hex")).publicKey).toString("hex");
    try {
      run("stellar", ["contract", "invoke", "--id", verifierId, "--source", "deployer", "--network", "testnet", "--", "initialize", "--attestor_key", attestorPubHex], { cwd: dir });
      console.log(ok(`prism_verifier initialized with attestor key ${attestorPubHex.slice(0, 12)}...`));
    } catch { console.log(warn("verifier initialize failed (already initialized?) — continuing")); }

    d.chains.stellar.contracts.verifier = verifierId;
    d.registryWasmHash = registryHash;
    saveDeployments(d);
    console.log(ok(`prism_verifier: ${verifierId}`));
    console.log(ok(`master_state_registry WASM hash: ${registryHash}`));
    summary.push(["Stellar Testnet", ok(`verifier ${verifierId}`)]);
  } catch (e) { console.log(bad(`Stellar deploy failed: ${e.message.split("\n").slice(-3).join(" ")}`)); summary.push(["Stellar Testnet", bad("failed")]); }
}

function main() {
  console.log(`${C.b}PrismZK deploy — deploying contracts to testnets and recording addresses${C.x}`);
  const env = readEnv();
  const missing = ["EVM_PRIVATE_KEY", "SOLANA_PRIVATE_KEY", "STELLAR_PRIVATE_KEY", "MOVEMENT_PRIVATE_KEY"].filter((k) => !env[k]);
  if (missing.length) { console.log(bad(`Missing ${missing.join(", ")} — run: node scripts/preflight.js`)); process.exit(1); }

  const d = loadDeployments();
  deployBase(env, d);
  deploySolana(env, d);
  deployMovement(env, d);
  deployStellar(env, d);
  saveDeployments(d); // ensure the local registry exists as a scaffold even if some chains were skipped

  console.log(`\n${C.b}=== DEPLOYMENT SUMMARY ===${C.x}`);
  for (const [chain, status] of summary) console.log(`  ${chain.padEnd(16)} ${status}`);
  console.log(`\nWrote → ${path.relative(REPO_ROOT, LOCAL)}`);

  const hash = d.registryWasmHash;
  const tokenCmd = `node scripts/create_multivm_token.js --name "Prism USD" --symbol pUSD --supply 1000000 --registry-wasm-hash ${hash && !String(hash).includes("PENDING") ? hash : "<registry-wasm-hash>"}`;

  if (withToken && hash && !String(hash).includes("PENDING")) {
    step("[+] Issuing token + seeding destination vaults (create_multivm_token)");
    try {
      run("node", [path.join("scripts", "create_multivm_token.js"), "--name", "Prism USD", "--symbol", "pUSD", "--supply", "1000000", "--registry-wasm-hash", hash], { cwd: REPO_ROOT, stdio: "inherit" });
      console.log(ok("Token issued and vaults funded. Try a swap: npm run dev → open http://localhost:3011"));
    } catch (e) { console.log(bad(`token creation failed: ${e.message}`)); }
  } else {
    console.log(`\n${C.b}Next steps:${C.x}`);
    console.log(`  1. Issue the token + seed the destination vaults/LPs:\n     ${tokenCmd}`);
    console.log(`  2. Start the app and try a swap:  npm run dev  → http://localhost:3011 → Enter ZK Forge`);
    console.log(`  ${C.y}(re-run with --with-token to do step 1 automatically)${C.x}`);
  }
  process.exit(0);
}

main();
