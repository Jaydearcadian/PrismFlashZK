#!/usr/bin/env node

/**
 * 🛰️ Prism Cross-Chain Intent Settlement Protocol: Multi-Chain Event Watcher Daemon
 * ==============================================================================
 * This daemon acts as the system's off-chain event-listening network.
 * It monitors multiple heterogeneous virtual machine (VM) architectures:
 * - Base Sepolia (EVM Solidity logs)
 * - Stellar Testnet (Soroban event streams)
 * - Solana Devnet (SVM program log subscriptions)
 * - Movement Porto (Aptos-Move transaction streams)
 * 
 * When a transaction or state change is detected, it triggers the solver execution
 * agent to lock collateral, disburse concurrent payouts, and settle claims.
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";
import { execFileSync } from "child_process";
import { ethers } from "ethers";
import { Connection, PublicKey } from "@solana/web3.js";
import { Keypair as StellarKeypair, Horizon, xdr as stellarXdr } from "@stellar/stellar-sdk";
import { Aptos, AptosConfig, Network as AptosNetwork } from "@aptos-labs/ts-sdk";

// Visual layout constants
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const CYAN = "\x1b[36m";
const MAGENTA = "\x1b[35m";
const RED = "\x1b[31m";

console.log(`${MAGENTA}${BOLD}=======================================================================${RESET}`);
console.log(`${MAGENTA}${BOLD}         PRISM PROTOCOL - MULTI-CHAIN EVENT WATCHER DAEMON             ${RESET}`);
console.log(`${MAGENTA}${BOLD}=======================================================================${RESET}`);
console.log(`System Local Time: ${new Date().toISOString()}`);

// Load and parse .env variables
const envPath = path.join(process.cwd(), ".env");
const envVars = {};
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  content.split("\n").forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
    if (match) {
      const key = match[1].trim();
      let value = (match[2] || "").trim();
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      envVars[key] = value;
    }
  });
}

const BACKEND_URL = "http://localhost:3000";

// Extract deployment addresses
const BASE_ESCROW_ADDRESS = envVars["BASE_ESCROW_ADDRESS"] || "";
const SOLANA_VAULT_PROGRAM_ID = envVars["SOLANA_VAULT_PROGRAM_ID"] || "";
const STELLAR_ESCROW_ADDRESS = envVars["STELLAR_ESCROW_ADDRESS"] || "";
const MOVEMENT_ESCROW_ADDRESS = envVars["MOVEMENT_ESCROW_ADDRESS"] || "";

console.log(`\n${BOLD}Configuration & Gateways Status:${RESET}`);
console.log(`  • Base Sepolia Escrow : ${BASE_ESCROW_ADDRESS ? `${GREEN}${BASE_ESCROW_ADDRESS}${RESET}` : `${YELLOW}Not Deployed (Simulated Gateway Active)${RESET}`}`);
console.log(`  • Solana Vault Prog.  : ${SOLANA_VAULT_PROGRAM_ID ? `${GREEN}${SOLANA_VAULT_PROGRAM_ID}${RESET}` : `${YELLOW}Not Deployed (Simulated Gateway Active)${RESET}`}`);
console.log(`  • Stellar Soroban Esc.: ${STELLAR_ESCROW_ADDRESS ? `${GREEN}${STELLAR_ESCROW_ADDRESS}${RESET}` : `${YELLOW}Not Deployed (Simulated Gateway Active)${RESET}`}`);
console.log(`  • Movement Porto Esc. : ${MOVEMENT_ESCROW_ADDRESS ? `${GREEN}${MOVEMENT_ESCROW_ADDRESS}${RESET}` : `${YELLOW}Not Deployed (Simulated Gateway Active)${RESET}`}`);

// Event ABIs — these MUST match the events actually emitted by contracts/solidity/BaseEscrow.sol,
// or ethers silently never fires the listener. (They previously named Deposited/Settled/FraudDisputed,
// which the contract does not emit.)
const BaseEscrowABI = [
  "event USDCLocked(address indexed depositor, bytes32 indexed nullifier, bytes32 payloadCommitment, uint256 amount)",
  "event SettlementClaimed(bytes32 indexed nullifier, address indexed solver, string solanaTx, string movementTx, uint256 submitBlock)",
  "event SettlementFinalized(bytes32 indexed nullifier, address indexed solver, uint256 amount)",
  "event ClaimChallenged(bytes32 indexed nullifier, address indexed challenger, string reason)"
];

// Initialize Real / Simulated providers
let baseProvider = null;
let solanaConnection = null;

if (BASE_ESCROW_ADDRESS) {
  try {
    baseProvider = new ethers.JsonRpcProvider("https://sepolia.base.org");
    console.log(`${GREEN}✔ Connected to Base Sepolia JSON-RPC Provider.${RESET}`);
  } catch (err) {
    console.log(`${RED}✖ Failed to initialize Base Sepolia RPC. Falling back to local events.${RESET}`);
  }
}

if (SOLANA_VAULT_PROGRAM_ID) {
  try {
    solanaConnection = new Connection("https://api.devnet.solana.com", "confirmed");
    console.log(`${GREEN}✔ Connected to Solana Devnet RPC Gateway.${RESET}`);
  } catch (err) {
    console.log(`${RED}✖ Failed to initialize Solana Devnet RPC. Falling back to local events.${RESET}`);
  }
}

// Keep track of processed nullifiers to prevent double handling
const processedNullifiers = new Set();

/**
 * Live Multichain Loop: Fetches updates from local Express instance 
 * and relays to physical providers if connected.
 */
async function runWatcherLoop() {
  // 1. Fetch State from Local gateway
  try {
    const res = await fetch(`${BACKEND_URL}/api/chains`);
    const state = await res.json();
    
    // Check Base deposits
    const deposits = state.base?.deposits || {};
    for (const [nullifier, deposit] of Object.entries(deposits)) {
      if (!processedNullifiers.has(nullifier)) {
        processedNullifiers.add(nullifier);
        handleNewDeposit(nullifier, deposit);
      }
    }
  } catch (err) {
    // Backend offline, retry silently in background
  }
}

function handleNewDeposit(nullifier, deposit) {
  console.log(`\n${BLUE}${BOLD}[WATCHER] >>> NEW ORIGIN LOCK EVENT DETECTED <<<${RESET}`);
  console.log(`  ├─ Source Chain   : Base Sepolia (EVM)`);
  console.log(`  ├─ Depositor      : ${deposit.user || "0xUser"}`);
  console.log(`  ├─ Locked Amount  : ${GREEN}${deposit.amount} USDC${RESET}`);
  console.log(`  ├─ Nullifier Hash : ${CYAN}${nullifier}${RESET}`);
  console.log(`  ├─ Commitment     : ${deposit.payloadCommitment}`);
  console.log(`  └─ Deadline Height: Block #${deposit.maxBlockHeight}`);
  
  // Trigger local or real Solver response
  triggerSolverPayoutSequence(nullifier, deposit);
}

async function triggerSolverPayoutSequence(nullifier, deposit) {
  console.log(`\n${MAGENTA}${BOLD}[SOLVER] >>> TRIGGERING OUT-OF-BAND MULTI-CHAIN DISBURSAL <<<${RESET}`);
  console.log(`  • Intent Target: Payout ${YELLOW}${deposit.solanaAmount} SOL${RESET} on Solana and ${YELLOW}${deposit.movementAmount} MOVE${RESET} on Movement.`);
  
  // POST to Solver Daemon API to fire real/mock concurrent payouts
  try {
    const response = await fetch(`${BACKEND_URL}/api/claim`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nullifier,
        payloadCommitment: deposit.payloadCommitment,
        maxBlockHeight: deposit.maxBlockHeight
      })
    });
    const result = await response.json();
    if (result.success) {
      console.log(`${GREEN}${BOLD}✔ Solver successfully completed multi-chain payout routing!${RESET}`);
      console.log(`  └─ Claim Settlement submitted on Base Sepolia. Status: ${result.claim?.finalized ? "INSTANTLY SETTLED" : "LOCK_PENDING_OPTIMISTIC"}`);
    } else {
      console.log(`${RED}✖ Solver payout sequence failed: ${result.message}${RESET}`);
    }
  } catch (err) {
    console.log(`${RED}✖ Lost connection to solver daemon endpoint at ${BACKEND_URL}. Is server running?${RESET}`);
  }
}

// ------------------------------------------------------------------------------
// REAL BLOCKCHAIN LISTENERS (When actual gateway deployment credentials exist)
// ------------------------------------------------------------------------------
function startRealChainListeners() {
  if (baseProvider && BASE_ESCROW_ADDRESS) {
    console.log(`${CYAN}[WATCHER] Spawning real Solidity event listener on Base Sepolia...${RESET}`);
    const contract = new ethers.Contract(BASE_ESCROW_ADDRESS, BaseEscrowABI, baseProvider);

    // USDCLocked(depositor, nullifier, payloadCommitment, amount) — args arrive in the event's
    // declaration order, indexed and non-indexed alike. The on-chain lock does NOT carry the
    // Soroban deadline or the per-chain destination amounts: those live in the intent bound by
    // payloadCommitment, which the solver resolves off-chain (or from the ZK proof's public
    // inputs), not from this event.
    contract.on("USDCLocked", (depositor, nullifier, payloadCommitment, amount) => {
      const nullifierStr = ethers.hexlify(nullifier);
      if (!processedNullifiers.has(nullifierStr)) {
        processedNullifiers.add(nullifierStr);
        console.log(`${GREEN}${BOLD}[EVM ETHERS LOG] Live Base Sepolia USDCLocked captured!${RESET}`);
        handleNewDeposit(nullifierStr, {
          user: depositor,
          amount: parseFloat(ethers.formatUnits(amount, 6)), // tUSDC has 6 decimals
          payloadCommitment: ethers.hexlify(payloadCommitment),
          maxBlockHeight: undefined,   // resolved off-chain from the committed intent
          solanaAmount: undefined,
          movementAmount: undefined
        });
      }
    });

    // Settlement lifecycle — informational (the finalize/dispute state also drives the UI/registry).
    contract.on("SettlementFinalized", (nullifier, solver, amount) => {
      console.log(`${GREEN}[EVM] SettlementFinalized: ${ethers.hexlify(nullifier).substring(0, 12)}... released ${ethers.formatUnits(amount, 6)} tUSDC to ${solver}.${RESET}`);
    });
    contract.on("ClaimChallenged", (nullifier, challenger, reason) => {
      console.log(`${RED}[EVM] ClaimChallenged: ${ethers.hexlify(nullifier).substring(0, 12)}... by ${challenger} — ${reason}${RESET}`);
    });
  }

  if (solanaConnection && SOLANA_VAULT_PROGRAM_ID) {
    console.log(`${CYAN}[WATCHER] Spawning real SVM program log subscriber on Solana Devnet...${RESET}`);
    const pubKey = new PublicKey(SOLANA_VAULT_PROGRAM_ID);
    
    solanaConnection.onLogs(pubKey, (logs) => {
      if (logs.logs.some(l => l.includes("Instruction: FillPayout"))) {
        console.log(`${GREEN}${BOLD}[SVM SOLANA LOG] Payout Filled event detected for Solana Vault!${RESET}`);
      }
    }, "confirmed");
  }
}

// ------------------------------------------------------------------------------
// LIQUIDITY RECONCILIATION LOOP — real per-chain vault balances -> MasterStateRegistry
// ------------------------------------------------------------------------------
// Separate concern from the deposit watcher above: this polls real destination-vault
// balances (Solana, Movement) and, on a real change, calls the deployed
// master_state_registry Soroban contract's register_cross_vm_action with a real
// ed25519 signature, then mirrors the accepted value into liquidity-state.local.json
// via server.ts's /api/liquidity/seed (server.ts stays the sole writer of that file —
// see Stage D of the plan this implements).
//
// Uses a SEPARATE keypair (LIQUIDITY_VALIDATOR_PRIVATE_KEY) from any ZK-attestation
// key: this one only ever certifies "an on-chain balance changed", never "a proof was
// verified" — compromising the always-online watcher shouldn't let an attacker forge
// intent clearances.
const STELLAR_HORIZON_URL = envVars["STELLAR_HORIZON_URL"] || "https://horizon-testnet.stellar.org";
const MOVEMENT_RPC_URL = envVars["MOVEMENT_RPC_URL"] || "https://aptos.testnet.porto.movementlabs.xyz/v1";
const LIQUIDITY_VALIDATOR_PRIVATE_KEY = envVars["LIQUIDITY_VALIDATOR_PRIVATE_KEY"] || "";
const SOROBAN_DIR = path.join(process.cwd(), "contracts", "soroban");

// chainId (as used in deployments/prism-assets.*.json) -> short Symbol registered with
// master_state_registry.initialize() in scripts/create_multivm_token.js
const CHAIN_SYMBOLS = { "base-sepolia": "base", "solana-devnet": "solana", "movement-porto": "movement" };

const lastKnownBalances = {};

function isPending(value) {
  return !value || String(value).includes("PENDING_DEPLOYMENT");
}

function loadAssetRegistry() {
  const localPath = path.join(process.cwd(), "deployments", "prism-assets.local.json");
  const examplePath = path.join(process.cwd(), "deployments", "prism-assets.example.json");
  const target = fs.existsSync(localPath) ? localPath : examplePath;
  return JSON.parse(fs.readFileSync(target, "utf8"));
}

async function getRealVaultBalance(chainId, chainCfg) {
  const c = chainCfg.contracts || {};
  if (chainId === "solana-devnet" && solanaConnection && !isPending(c.vaultTokenAccount)) {
    const bal = await solanaConnection.getTokenAccountBalance(new PublicKey(c.vaultTokenAccount));
    return Number(bal.value.uiAmount || 0);
  }
  if (chainId === "movement-porto" && !isPending(c.coinModule) && !isPending(c.escrow)) {
    const aptos = new Aptos(new AptosConfig({ network: AptosNetwork.CUSTOM, fullnode: MOVEMENT_RPC_URL }));
    const amount = await aptos.getAccountCoinAmount({ accountAddress: c.escrow, coinType: c.coinModule });
    return Number(amount) / 1e6;
  }
  return null;
}

// Builds the exact byte layout master_state_registry::register_cross_vm_action verifies:
// nullifier(32) || Symbol::to_xdr(chain) || sign_byte(1) || 16-byte little-endian abs(delta).
// The Symbol XDR encoding was verified byte-for-byte against a real compiled Rust probe
// using soroban-sdk's own ToXdr trait during this session (see plan notes).
function buildRegistryMessage(nullifierBuf, chainSymbol, delta) {
  const symbolXdr = stellarXdr.ScVal.scvSymbol(chainSymbol).toXDR();
  const isPositive = delta >= 0;
  const absAmount = BigInt(Math.abs(Math.round(delta)));
  const amountBytes = Buffer.alloc(17);
  amountBytes[0] = isPositive ? 1 : 0;
  let temp = absAmount;
  for (let i = 0; i < 16; i++) {
    amountBytes[1 + i] = Number(temp & 0xffn);
    temp >>= 8n;
  }
  return Buffer.concat([nullifierBuf, symbolXdr, amountBytes]);
}

async function reconcileVault(chainId, vaultId, chainSymbol, realBalance, registryContractId) {
  const previous = lastKnownBalances[vaultId];
  lastKnownBalances[vaultId] = realBalance;
  if (previous === undefined || Math.abs(realBalance - previous) < 0.000001) return;
  const delta = realBalance - previous;

  const nullifierBuf = crypto
    .createHash("sha256")
    .update(`${chainId}:${vaultId}:${delta}:${Date.now()}`)
    .digest();
  const validatorKeypair = StellarKeypair.fromSecret(LIQUIDITY_VALIDATOR_PRIVATE_KEY);
  const message = buildRegistryMessage(nullifierBuf, chainSymbol, delta);
  const signature = validatorKeypair.sign(message);

  console.log(`${MAGENTA}${BOLD}[LIQUIDITY] >>> Real balance change on ${chainId}: ${previous} -> ${realBalance} (Δ${delta})${RESET}`);

  try {
    execFileSync(
      "stellar",
      [
        "contract", "invoke", "--id", registryContractId, "--source", "deployer", "--network", "testnet",
        "--", "register_cross_vm_action",
        "--nullifier", nullifierBuf.toString("hex"),
        "--chain", chainSymbol,
        "--amount_delta", Math.round(delta).toString(),
        "--signature", signature.toString("hex"),
      ],
      { cwd: SOROBAN_DIR, stdio: "inherit" }
    );

    await fetch(`${BACKEND_URL}/api/liquidity/seed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vaultId, amount: realBalance, mode: "set", nullifier: nullifierBuf.toString("hex") }),
    });
    console.log(`${GREEN}✔ master_state_registry updated and liquidity-state.local.json reconciled for ${vaultId}.${RESET}`);
  } catch (err) {
    console.log(`${RED}✖ Liquidity reconciliation failed for ${vaultId}: ${err.message}${RESET}`);
  }
}

async function runLiquidityReconciliationLoop() {
  if (!LIQUIDITY_VALIDATOR_PRIVATE_KEY) return; // not configured — skip silently, matches optional-real-chain pattern above
  let assets;
  try {
    assets = loadAssetRegistry();
  } catch {
    return;
  }
  const registryContractId = assets.stellarRegistry;
  if (isPending(registryContractId)) return;

  for (const [chainId, chainSymbol] of Object.entries(CHAIN_SYMBOLS)) {
    const chainCfg = assets.chains[chainId];
    if (!chainCfg) continue;
    try {
      const balance = await getRealVaultBalance(chainId, chainCfg);
      if (balance === null) continue;
      await reconcileVault(chainId, chainCfg.vaultId, chainSymbol, balance, registryContractId);
    } catch (err) {
      console.log(`${YELLOW}⚠ Could not poll real balance for ${chainId}: ${err.message}${RESET}`);
    }
  }
}

// Initialize Loop Pollers and Real listeners
setInterval(runWatcherLoop, 1500);
setInterval(runLiquidityReconciliationLoop, 10000);
startRealChainListeners();

console.log(`\n${GREEN}${BOLD}✔ Multi-chain Watcher Daemon successfully launched and listening...${RESET}`);
console.log(`Press Control-C to stop monitoring and terminate daemon.\n`);
