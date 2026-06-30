#!/usr/bin/env bash

# ==============================================================================
# 🚀 Prism Multi-VM Orchestrator: Unified Compile, Deploy, and Run Pipeline
# ==============================================================================
# This script automates the complete multi-chain operations cycle in one go:
# 1. Identity & Wallet Generation (creates fresh .env & Solana keypairs)
# 2. System Diagnostics (verifies local compiler paths)
# 3. Multi-VM Contract Deployment (Base Sepolia, Solana, Movement, Stellar)
# 4. Off-Chain Daemon Execution (starts watchers & solver daemons)
# 5. Live Dashboard Launch (real-time terminal visualization)
# ==============================================================================

set -uo pipefail

# Visual color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${BLUE}${BOLD}=======================================================================${NC}"
echo -e "${BLUE}${BOLD}        PRISM UNIFIED MULTI-VM ORCHESTRATION & DEPLOYMENT RUNNER       ${NC}"
echo -e "${BLUE}${BOLD}=======================================================================${NC}"
echo -e "System Local Time: $(date)"

# --- STEP 1: Provision identity credentials and wallet keys ---
echo -e "\n${CYAN}${BOLD}[STEP 1/5] Provisioning Cryptographic Wallets and Private Keys...${NC}"
if [ ! -f .env ] || ! grep -q "EVM_PRIVATE_KEY" .env; then
    echo -e "${YELLOW}No active .env credentials found or EVM keys missing. Booting auto-generation...${NC}"
    node generate_wallets.js
else
    echo -e "${GREEN}✔ Active cryptographic credentials already present in .env!${NC}"
fi

# --- STEP 2: Diagnostic Check of Local Compilers & CLIs ---
echo -e "\n${CYAN}${BOLD}[STEP 2/5] Running System Compiler Diagnostics...${NC}"
bash check_toolchain.sh

# --- STEP 3: Multi-Chain Gateway Smart Contract Deployments ---
echo -e "\n${CYAN}${BOLD}[STEP 3/5] Compiling and Deploying Smart Contracts to Testnets...${NC}"
chmod +x deploy_all.sh
./deploy_all.sh

# --- STEP 4: Boot Off-Chain Daemons in Background ---
echo -e "\n${CYAN}${BOLD}[STEP 4/5] Spawning Off-Chain Watcher and Solver Daemons...${NC}"

# Start local Node server if it isn't running (or user can start via npm run dev)
if ! lsof -i :3000 &> /dev/null; then
    echo -e "${BLUE}Starting Prism Backend Express Server on port 3000...${NC}"
    npm run dev &
    SERVER_PID=$!
    # Wait for server to boot
    sleep 3
else
    echo -e "${GREEN}✔ Prism Backend Server is already active on port 3000.${NC}"
fi

# Run the Multichain Event Watcher in the background
echo -e "${BLUE}Booting Multi-Chain Watcher Daemon (multichain_watcher.js)...${NC}"
node multichain_watcher.js &
WATCHER_PID=$!

# Run the Solver Execution Agent in the background
echo -e "${BLUE}Booting Solver Execution Agent (solver_agent.js)...${NC}"
node solver_agent.js &
SOLVER_PID=$!

# Trap script termination to clean up background processes cleanly
cleanup() {
    echo -e "\n${YELLOW}Terminating background daemons and service instances...${NC}"
    if [ -n "${SERVER_PID:-}" ]; then kill "$SERVER_PID" 2>/dev/null || true; fi
    if [ -n "$WATCHER_PID" ]; then kill "$WATCHER_PID" 2>/dev/null || true; fi
    if [ -n "$SOLVER_PID" ]; then kill "$SOLVER_PID" 2>/dev/null || true; fi
    echo -e "${GREEN}✔ Daemons shut down successfully.${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM EXIT

# --- STEP 5: Launch Live Interactive Console Monitoring ---
echo -e "\n${CYAN}${BOLD}[STEP 5/5] Launching Real-Time Live Session Dashboard...${NC}"
sleep 2
node live_dashboard.js

# Wait for background jobs
wait
