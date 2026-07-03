#!/usr/bin/env node
/**
 * Preflight: wallet + funding check for all four PrismZK testnets.
 *
 * For each of Base Sepolia (EVM), Solana Devnet, Stellar Testnet, and Movement Porto:
 *   1. Ensures a private key AND its address exist in .env — generating any that are missing
 *      (existing keys are preserved; safe to re-run).
 *   2. Checks the on-chain balance, and where the network has a programmatic faucet
 *      (Solana airdrop, Stellar Friendbot, Movement faucet) it funds automatically.
 *      Where it can't (Base Sepolia), it prints the address + faucet link to fund by hand.
 *
 *   node scripts/preflight.js
 *
 * RPCs/faucets are overridable via env (BASE_RPC_URL, SOLANA_RPC_URL, STELLAR_HORIZON_URL,
 * MOVEMENT_RPC_URL, MOVEMENT_FAUCET_URL).
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Wallet, JsonRpcProvider, formatEther } from "ethers";
import { Keypair as SolKeypair, Connection, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Keypair as StellarKeypair, Horizon } from "@stellar/stellar-sdk";
import { Account as MoveAccount, Ed25519PrivateKey, Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const ENV_PATH = path.join(REPO_ROOT, ".env");

const BASE_RPC = process.env.BASE_RPC_URL || "https://sepolia.base.org";
const SOLANA_RPC = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const STELLAR_HORIZON = process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org";
const STELLAR_FRIENDBOT = process.env.STELLAR_FRIENDBOT_URL || "https://friendbot.stellar.org";
const MOVEMENT_RPC = process.env.MOVEMENT_RPC_URL || "https://aptos.testnet.porto.movementlabs.xyz/v1";
const MOVEMENT_FAUCET = process.env.MOVEMENT_FAUCET_URL || "https://faucet.testnet.porto.movementlabs.xyz";

const FAUCET_LINKS = {
  base: "https://www.alchemy.com/faucets/base-sepolia  (or https://faucet.quicknode.com/base/sepolia)",
  movement: "https://faucet.movementlabs.xyz",
};

const C = { r: "\x1b[31m", g: "\x1b[32m", y: "\x1b[33m", c: "\x1b[36m", d: "\x1b[2m", b: "\x1b[1m", x: "\x1b[0m" };
const ok = (s) => `${C.g}${s}${C.x}`;
const warn = (s) => `${C.y}${s}${C.x}`;
const bad = (s) => `${C.r}${s}${C.x}`;

// ---- .env read / merge / write (preserves unrelated keys) ----
function readEnv() {
  const vars = {};
  if (fs.existsSync(ENV_PATH)) {
    for (const line of fs.readFileSync(ENV_PATH, "utf8").split("\n")) {
      const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
      if (!m) continue;
      let v = (m[2] || "").trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
      vars[m[1].trim()] = v;
    }
  }
  return vars;
}
function writeEnv(vars) {
  const body = Object.entries(vars).map(([k, v]) => `${k}="${v}"`).join("\n") + "\n";
  fs.writeFileSync(ENV_PATH, body);
}

const results = [];
function record(chain, address, balance, unit, status) {
  results.push({ chain, address, balance, unit, status });
}

// ---- key provisioning ----
function ensureKeys(env) {
  let generated = 0;

  // EVM
  if (!env.EVM_PRIVATE_KEY) {
    const w = Wallet.createRandom();
    env.EVM_PRIVATE_KEY = w.privateKey; env.EVM_ADDRESS = w.address; generated++;
    console.log(`  ${warn("generated")} Base Sepolia (EVM) wallet`);
  } else if (!env.EVM_ADDRESS) {
    env.EVM_ADDRESS = new Wallet(env.EVM_PRIVATE_KEY).address;
  }

  // Solana (SOLANA_PRIVATE_KEY = JSON byte array of the secret key)
  if (!env.SOLANA_PRIVATE_KEY) {
    const kp = SolKeypair.generate();
    env.SOLANA_PRIVATE_KEY = "[" + Array.from(kp.secretKey).join(",") + "]";
    env.SOLANA_ADDRESS = kp.publicKey.toBase58(); generated++;
    console.log(`  ${warn("generated")} Solana Devnet wallet`);
  } else if (!env.SOLANA_ADDRESS) {
    env.SOLANA_ADDRESS = SolKeypair.fromSecretKey(Uint8Array.from(JSON.parse(env.SOLANA_PRIVATE_KEY))).publicKey.toBase58();
  }

  // Stellar
  if (!env.STELLAR_PRIVATE_KEY) {
    const kp = StellarKeypair.random();
    env.STELLAR_PRIVATE_KEY = kp.secret(); env.STELLAR_ADDRESS = kp.publicKey(); generated++;
    console.log(`  ${warn("generated")} Stellar Testnet wallet`);
  } else if (!env.STELLAR_ADDRESS) {
    env.STELLAR_ADDRESS = StellarKeypair.fromSecret(env.STELLAR_PRIVATE_KEY).publicKey();
  }

  // Movement (Aptos)
  if (!env.MOVEMENT_PRIVATE_KEY) {
    const a = MoveAccount.generate();
    env.MOVEMENT_PRIVATE_KEY = a.privateKey.toString(); env.MOVEMENT_ADDRESS = a.accountAddress.toString(); generated++;
    console.log(`  ${warn("generated")} Movement Porto wallet`);
  } else if (!env.MOVEMENT_ADDRESS) {
    env.MOVEMENT_ADDRESS = MoveAccount.fromPrivateKey({ privateKey: new Ed25519PrivateKey(env.MOVEMENT_PRIVATE_KEY) }).accountAddress.toString();
  }

  return generated;
}

// ---- funding checks ----
async function checkBase(env) {
  const addr = env.EVM_ADDRESS;
  try {
    const provider = new JsonRpcProvider(BASE_RPC);
    const bal = await provider.getBalance(addr);
    const eth = Number(formatEther(bal));
    if (eth > 0) record("Base Sepolia", addr, eth.toFixed(5), "ETH", ok("funded"));
    else record("Base Sepolia", addr, "0", "ETH", warn(`fund manually → ${FAUCET_LINKS.base}`));
  } catch (e) {
    record("Base Sepolia", addr, "?", "ETH", bad(`RPC unreachable — fund manually → ${FAUCET_LINKS.base}`));
  }
}

async function checkSolana(env) {
  const kp = SolKeypair.fromSecretKey(Uint8Array.from(JSON.parse(env.SOLANA_PRIVATE_KEY)));
  const addr = kp.publicKey.toBase58();
  try {
    const conn = new Connection(SOLANA_RPC, "confirmed");
    let bal = await conn.getBalance(kp.publicKey);
    if (bal < 0.5 * LAMPORTS_PER_SOL) {
      try {
        const sig = await conn.requestAirdrop(kp.publicKey, 2 * LAMPORTS_PER_SOL);
        await conn.confirmTransaction(sig, "confirmed");
        bal = await conn.getBalance(kp.publicKey);
        record("Solana Devnet", addr, (bal / LAMPORTS_PER_SOL).toFixed(3), "SOL", ok("airdropped"));
      } catch {
        record("Solana Devnet", addr, (bal / LAMPORTS_PER_SOL).toFixed(3), "SOL", warn("airdrop rate-limited — retry, or use https://faucet.solana.com"));
      }
    } else {
      record("Solana Devnet", addr, (bal / LAMPORTS_PER_SOL).toFixed(3), "SOL", ok("funded"));
    }
  } catch {
    record("Solana Devnet", addr, "?", "SOL", bad("RPC unreachable — fund manually → https://faucet.solana.com"));
  }
}

async function checkStellar(env) {
  const addr = env.STELLAR_ADDRESS;
  const server = new Horizon.Server(STELLAR_HORIZON);
  try {
    const acct = await server.loadAccount(addr);
    const xlm = acct.balances.find((b) => b.asset_type === "native");
    record("Stellar Testnet", addr, xlm ? Number(xlm.balance).toFixed(2) : "0", "XLM", ok("funded"));
  } catch {
    // account not found → unfunded → Friendbot creates + funds it
    try {
      const r = await fetch(`${STELLAR_FRIENDBOT}/?addr=${encodeURIComponent(addr)}`);
      if (!r.ok) throw new Error(String(r.status));
      const acct = await server.loadAccount(addr);
      const xlm = acct.balances.find((b) => b.asset_type === "native");
      record("Stellar Testnet", addr, xlm ? Number(xlm.balance).toFixed(2) : "0", "XLM", ok("friendbot-funded"));
    } catch {
      record("Stellar Testnet", addr, "0", "XLM", warn(`fund manually → ${STELLAR_FRIENDBOT}/?addr=${addr}`));
    }
  }
}

async function checkMovement(env) {
  const account = MoveAccount.fromPrivateKey({ privateKey: new Ed25519PrivateKey(env.MOVEMENT_PRIVATE_KEY) });
  const addr = account.accountAddress.toString();
  const aptos = new Aptos(new AptosConfig({ network: Network.CUSTOM, fullnode: MOVEMENT_RPC, faucet: MOVEMENT_FAUCET }));
  let octas = 0;
  try { octas = Number(await aptos.getAccountAPTAmount({ accountAddress: account.accountAddress })); } catch { octas = 0; }
  if (octas > 0) {
    record("Movement Porto", addr, (octas / 1e8).toFixed(4), "MOVE", ok("funded"));
    return;
  }
  try {
    await aptos.fundAccount({ accountAddress: account.accountAddress, amount: 1e8 });
    octas = Number(await aptos.getAccountAPTAmount({ accountAddress: account.accountAddress }));
    record("Movement Porto", addr, (octas / 1e8).toFixed(4), "MOVE", ok("faucet-funded"));
  } catch {
    record("Movement Porto", addr, "0", "MOVE", warn(`fund manually → ${FAUCET_LINKS.movement}  (addr: ${addr})`));
  }
}

function printSummary() {
  console.log(`\n${C.b}=== WALLET & FUNDING SUMMARY ===${C.x}`);
  for (const r of results) {
    console.log(`\n${C.c}${C.b}${r.chain}${C.x}`);
    console.log(`  address : ${r.address}`);
    console.log(`  balance : ${r.balance} ${r.unit}`);
    console.log(`  status  : ${r.status}`);
  }
  const needsManual = results.filter((r) => /manual|rate-limited|unreachable/i.test(r.status));
  console.log(`\n${C.b}${results.length - needsManual.length}/${results.length}${C.x} chains funded automatically.`);
  if (needsManual.length) {
    console.log(`${warn("Action needed:")} fund the address(es) above for: ${needsManual.map((r) => r.chain).join(", ")}, then re-run this script to confirm.`);
  } else {
    console.log(ok("All wallets funded — you're ready to run scripts/deploy_testnet.js"));
  }
}

async function main() {
  console.log(`${C.b}PrismZK preflight — checking wallets & funding across 4 testnets${C.x}\n`);
  const env = readEnv();
  const generated = ensureKeys(env);
  writeEnv(env);
  if (generated) console.log(`  ${ok(`wrote ${generated} new wallet(s) to .env`)}`);
  else console.log(`  ${ok("all 4 wallets already present in .env")}`);

  console.log(`\nChecking balances & funding where possible...`);
  await checkBase(env);
  await checkSolana(env);
  await checkStellar(env);
  await checkMovement(env);
  printSummary();
  process.exit(0);
}

main().catch((e) => { console.error(bad("preflight failed:"), e.message); process.exit(1); });
