#!/usr/bin/env node

/**
 * 🌐 Prism Cross-Chain Intent Settlement Protocol: Real-Time Live Session Dashboard
 * ==============================================================================
 * This script pulls data from the active Express server and provides an immersive
 * ANSI-colored, real-time terminal visual of multi-chain connections, proof states,
 * and solver daemon relay operations.
 */

import { argv } from "process";

const PORT = 3000;
const SERVER_URL = `http://localhost:${PORT}`;

// ANSI Escape Codes for UI rendering
const CLEAR = "\x1b[2J\x1b[H";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const UNDERLINE = "\x1b[4m";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE = "\x1b[34m";
const MAGENTA = "\x1b[35m";
const CYAN = "\x1b[36m";
const WHITE = "\x1b[37m";

const BG_BLACK = "\x1b[40m";
const BG_BLUE = "\x1b[44m";
const BG_CYAN = "\x1b[46m";

// State Tracker
let uptime = 0;
let isConnected = false;
let demoMode = false;
let logHistory = [];

// Fallback Mock State (used if backend is offline or for extra visual flair)
const mockState = {
  chains: {
    base: { blockHeight: 18452030, deposits: [], claims: [], balances: { User: 1000, Solver: 5000, Escrow: 0 } },
    stellar: { ledgerSequence: 5240321, clearedIntents: [], balances: { User: 500, Solver: 10000 } },
    solana: { slot: 124503210, balances: { User: 12.5, Solver: 1500 } },
    movement: { ledgerVersion: 85210940, balances: { User: 250, Solver: 25000 } }
  },
  prover: {
    nullifier: "0x3f5c88e9...",
    payload: "0x89e1a2f4...",
    constraints: 95,
    proofSize: 1024,
    status: "STANDBY"
  }
};

// Start a local interval ticker for simulated data
setInterval(() => {
  uptime++;
  if (demoMode || !isConnected) {
    mockState.chains.base.blockHeight += 1;
    mockState.chains.stellar.ledgerSequence += 1;
    mockState.chains.solana.slot += 3;
    mockState.chains.movement.ledgerVersion += 4;

    // Periodically simulate a mock swap if in full demo mode
    if (uptime % 12 === 0) {
      simulateMockSwap();
    }
  }
}, 1000);

function simulateMockSwap() {
  mockState.prover.status = "PROVING";
  addLocalLog("DAEMON", "Simulated Incoming Swap Intent detected on Base Sepolia.");
  
  setTimeout(() => {
    mockState.prover.status = "VERIFYING";
    mockState.chains.base.balances.User -= 100;
    mockState.chains.base.balances.Escrow += 100;
    addLocalLog("INFO", "Noir client witness compiled (95 constraints satisfied).");
  }, 1500);

  setTimeout(() => {
    mockState.prover.status = "FINALIZING";
    addLocalLog("SUCCESS", "Soroban contract validated UltraHonk ZK proof!");
  }, 3000);

  setTimeout(() => {
    mockState.chains.base.balances.Escrow -= 100;
    mockState.chains.base.balances.Solver += 100;
    mockState.chains.solana.balances.User += 45;
    mockState.chains.movement.balances.User += 45;
    mockState.prover.status = "SETTLED";
    addLocalLog("SUCCESS", "Payout disbursed concurrently on Solana & Movement.");
  }, 4500);

  setTimeout(() => {
    mockState.prover.status = "STANDBY";
  }, 7000);
}

function addLocalLog(type, msg) {
  const time = new Date().toISOString().substring(11, 19);
  logHistory.unshift(`[${time}] [${type}] ${msg}`);
  if (logHistory.length > 8) logHistory.pop();
}

// Initial logs
addLocalLog("DAEMON", "Dashboard listener initiated.");
addLocalLog("DAEMON", "Attempting connection to Prism live gateway API on port 3000...");

async function fetchServerState() {
  try {
    const resChains = await fetch(`${SERVER_URL}/api/chains`);
    const dataChains = await resChains.json();
    
    const resLogs = await fetch(`${SERVER_URL}/api/solver-logs`);
    const dataLogs = await resLogs.json();

    isConnected = true;
    demoMode = false;

    // Map live server states to our dashboard display model
    mockState.chains = dataChains;
    
    // Extract prover/swap detail from active deposits if any
    const activeDeposits = dataChains.base.deposits || [];
    if (activeDeposits.length > 0) {
      const latest = activeDeposits[activeDeposits.length - 1];
      mockState.prover.nullifier = latest.nullifier.substring(0, 18) + "...";
      mockState.prover.payload = latest.payloadCommitment.substring(0, 18) + "...";
      mockState.prover.status = latest.locked ? "LOCKED/PROVING" : "SETTLED";
    } else {
      mockState.prover.status = "STANDBY";
    }

    // Merge logs
    if (dataLogs && dataLogs.length > 0) {
      logHistory = dataLogs.slice(0, 7).map(l => `[${l.timestamp}] [${l.type}] ${l.message}`);
    }
  } catch (err) {
    if (isConnected) {
      addLocalLog("WARN", "Lost connection to live server. Entering sandbox fallback mode.");
    }
    isConnected = false;
    demoMode = true;
  }
}

function drawTerminal() {
  process.stdout.write(CLEAR);

  // 1. HEADER ROW
  console.log(`${BG_BLUE}${WHITE}${BOLD}  PRISM CROSS-CHAIN INTENT SETTLEMENT  ::  LIVE REAL-TIME SESSION  ${RESET}`);
  console.log(`  ${BOLD}Uptime:${NC} ${uptime}s   ${BOLD}Target API:${NC} ${CYAN}${SERVER_URL}${NC}   ${BOLD}Status:${NC} ${
    isConnected ? `${GREEN}${BOLD}✔ LIVE INTERACTIVE${NC}` : `${YELLOW}${BOLD}⚠ SIMULATED FALLBACK${NC}`
  }`);
  console.log(`${BLUE}================================================================================${RESET}`);

  // 2. NETWORK NODES AND VALUATION CHANNELS
  console.log(`${BOLD}${CYAN}  1. MULTI-VM TARGET NETWORKS & LEDGER SEQUENCES${RESET}`);
  console.log(`  ┌──────────────────────────────────────────┬─────────────────────────────────┐`);
  
  // Base vs Stellar
  const baseHeight = formatVal(mockState.chains.base.blockHeight);
  const stellSeq = formatVal(mockState.chains.stellar.ledgerSequence);
  console.log(`  │  ${BOLD}BASE SEPOLIA (EVM)${RESET}                     │  ${BOLD}STELLAR SOROBAN (Rust/WASM)${RESET}    │`);
  console.log(`  │  Block Height : ${CYAN}${baseHeight}${RESET}             │  Ledger Sequence : ${CYAN}${stellSeq}${RESET}         │`);
  console.log(`  │  User Balance : ${YELLOW}${formatBal(mockState.chains.base.balances, "UserWallet", "User")} USDC${RESET}         │  User Balance    : ${YELLOW}${formatBal(mockState.chains.stellar.balances, "UserWallet", "User")} USDC${RESET}      │`);
  console.log(`  │  Solver Bal.  : ${YELLOW}${formatBal(mockState.chains.base.balances, "SolverWallet", "Solver")} USDC${RESET}         │  Solver Balance  : ${YELLOW}${formatBal(mockState.chains.stellar.balances, "SolverWallet", "Solver")} USDC${RESET}     │`);
  console.log(`  │  Escrow Lock  : ${MAGENTA}${formatBal(mockState.chains.base.balances, "EscrowContract", "Escrow")} USDC${RESET}          │                                 │`);

  console.log(`  ├──────────────────────────────────────────┼─────────────────────────────────┤`);

  // Solana vs Movement
  const solSlot = formatVal(mockState.chains.solana.slot);
  const moveVer = formatVal(mockState.chains.movement.ledgerVersion);
  console.log(`  │  ${BOLD}SOLANA DEVNET (SVM)${RESET}                      │  ${BOLD}MOVEMENT PORTO (MoveVM)${RESET}        │`);
  console.log(`  │  Slot Number  : ${CYAN}${solSlot}${RESET}            │  Ledger Version  : ${CYAN}${moveVer}${RESET}        │`);
  console.log(`  │  User Balance : ${YELLOW}${formatBal(mockState.chains.solana.balances, "UserWallet", "User")} SOL${RESET}              │  User Balance    : ${YELLOW}${formatBal(mockState.chains.movement.balances, "UserWallet", "User")} MOVE${RESET}     │`);
  console.log(`  │  Solver Bal.  : ${YELLOW}${formatBal(mockState.chains.solana.balances, "SolverWallet", "Solver")} SOL${RESET}           │  Solver Balance  : ${YELLOW}${formatBal(mockState.chains.movement.balances, "SolverWallet", "Solver")} MOVE${RESET}    │`);
  
  console.log(`  └──────────────────────────────────────────┴─────────────────────────────────┘`);

  // 3. GRAPHICAL CHANNEL MAP
  console.log(`\n${BOLD}${CYAN}  2. LOGICAL CRYPTOGRAPHIC SWAP FLOW & TELEMETRY${RESET}`);
  console.log(`  `);
  
  const step = mockState.prover.status;
  const p1 = step === "PROVING" || step === "LOCKED/PROVING" ? `${YELLOW}■■▶${RESET}` : "───";
  const p2 = step === "VERIFYING" ? `${YELLOW}■■▶${RESET}` : "───";
  const p3 = step === "FINALIZING" || step === "SETTLED" ? `${GREEN}■■▶${RESET}` : "───";

  console.log(`     [Base Sepolia] ===(Lock ${p1})===> [Stellar Soroban Verifier]`);
  console.log(`           │                                  │`);
  console.log(`     (Dispute Claims)                   (ZK Proof Verified ${p2})`);
  console.log(`           ▼                                  ▼`);
  console.log(`     [Optimistic Watchdog]             [Solver Relay Network]`);
  console.log(`           │                                  │`);
  console.log(`           └─────────── (Concurrently Disbursed ${p3}) ───────┐`);
  console.log(`                                                       ▼`);
  console.log(`                                         [Solana]  &  [Movement]`);

  // 4. CRYPTOGRAPHIC PROVER STATS
  console.log(`\n${BOLD}${CYAN}  3. NOIR ULTRAHONK PROVING BACKEND${RESET}`);
  console.log(`  ┌────────────────────────────────────────────────────────────────────────────┐`);
  console.log(`  │  ${BOLD}Nullifier Hash:${RESET} ${WHITE}${mockState.prover.nullifier.padEnd(20)}${RESET} │  ${BOLD}Circuit Constraints:${RESET} ${CYAN}${mockState.prover.constraints} custom gates${RESET}     │`);
  console.log(`  │  ${BOLD}Commitment Hash:${RESET} ${WHITE}${mockState.prover.payload.padEnd(20)}${RESET}│  ${BOLD}Honk Proof Size:${RESET}     ${CYAN}${mockState.prover.proofSize} Bytes${RESET}               │`);
  console.log(`  │  ${BOLD}Execution Phase:${RESET} ${MAGENTA}${step.padEnd(14)}${RESET}             │  ${BOLD}Verifier Engine:${RESET}     ${GREEN}Soroban Rust WASM${RESET}        │`);
  console.log(`  └────────────────────────────────────────────────────────────────────────────┘`);

  // 5. SOLVER DAEMON LOGGER
  console.log(`\n${BOLD}${CYAN}  4. SOLVER DAEMON LOGSTREAM (REAL-TIME POLLING)${RESET}`);
  console.log(`  ┌────────────────────────────────────────────────────────────────────────────┐`);
  for (let i = 0; i < 7; i++) {
    const log = logHistory[i] || "";
    // Colorize specific words in log streams
    let coloredLog = log
      .replace("[DAEMON]", `[${MAGENTA}DAEMON${RESET}]`)
      .replace("[INFO]", `[${CYAN}INFO${RESET}]`)
      .replace("[SUCCESS]", `[${GREEN}SUCCESS${RESET}]`)
      .replace("[WARN]", `[${YELLOW}WARN${RESET}]`)
      .replace("[ERROR]", `[${RED}ERROR${RESET}]`);
    console.log(`  │ ${coloredLog.padEnd(86).substring(0, 86)} │`);
  }
  console.log(`  └────────────────────────────────────────────────────────────────────────────┘`);
  console.log(`  ${BOLD}${WHITE}Control-C to exit the live session dashboard at any time.${RESET}\n`);
}

function formatVal(v) {
  return v ? v.toLocaleString() : "0";
}

function formatBal(balances, key, backup) {
  const b = balances[key] !== undefined ? balances[key] : (balances[backup] !== undefined ? balances[backup] : 0);
  return typeof b === "number" ? b.toFixed(2) : Number(b).toFixed(2);
}

// Start visual tick
setInterval(async () => {
  await fetchServerState();
  drawTerminal();
}, 1000);
