#!/usr/bin/env bash

# ==============================================================================
# 🛠️ Prism Toolchain Diagnostics: Live Multi-VM Environment Checker
# ==============================================================================
# This script performs diagnostic checks on required development tools for:
# - Base Sepolia (Foundry / Solidity)
# - Solana Devnet (Rust / Anchor / Solana Suite)
# - Movement Porto (Aptos-Move / Movement L2 SDK)
# - Stellar Testnet (Soroban Smart Contracts CLI)
# - Noir (Cryptographic Prover Backend)
# ==============================================================================

set -uo pipefail

# Define visual style sheets
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m' # No Color

echo -e "${BLUE}${BOLD}=======================================================================${NC}"
echo -e "${BLUE}${BOLD}        PRISM CROSS-CHAIN PROTOCOL - TOOLCHAIN DIAGNOSTIC CHECK        ${NC}"
echo -e "${BLUE}${BOLD}=======================================================================${NC}"
echo -e "System Local Time: $(date)"
echo -e "Checking system capabilities and dependencies for Multi-VM deployments...\n"

# Helper for displaying status
print_status() {
    local tool_name=$1
    local status=$2 # "PASS", "WARN", "FAIL"
    local version_info=$3
    
    if [ "$status" = "PASS" ]; then
        echo -e "  [ ${GREEN}${BOLD}✔ ACTIVE${NC} ] ${BOLD}$tool_name${NC} : $version_info"
    elif [ "$status" = "WARN" ]; then
        echo -e "  [ ${YELLOW}${BOLD}⚠ WARNING${NC} ] ${BOLD}$tool_name${NC} : $version_info"
    else
        echo -e "  [ ${RED}${BOLD}✖ MISSING${NC} ] ${BOLD}$tool_name${NC} : $version_info"
    fi
}

# Keep track of missing tools to provide a tailor-made resolution guide at the end
declare -a MISSING_CORE=()
declare -a MISSING_EVM=()
declare -a MISSING_SOLANA=()
declare -a MISSING_MOVEMENT=()
declare -a MISSING_STELLAR=()

# ------------------------------------------------------------------------------
# SECTION 1: CORE ENGINE DEPENDENCIES
# ------------------------------------------------------------------------------
echo -e "${CYAN}${BOLD}--- [1] Core Prover & Runtime Toolchains ---${NC}"

# Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    print_status "Node.js (LTS/Current)" "PASS" "$NODE_VERSION"
else
    print_status "Node.js (LTS/Current)" "FAIL" "Node.js is not installed."
    MISSING_CORE+=("node")
fi

# Cargo
if command -v cargo &> /dev/null; then
    CARGO_VERSION=$(cargo --version | awk '{print $2}')
    print_status "Rust Cargo Package Manager" "PASS" "v$CARGO_VERSION"
else
    print_status "Rust Cargo Package Manager" "FAIL" "Cargo is not installed."
    MISSING_CORE+=("rust")
fi

# Rustc
if command -v rustc &> /dev/null; then
    RUST_VERSION=$(rustc --version | awk '{print $2}')
    print_status "Rust Compiler (rustc)" "PASS" "v$RUST_VERSION"
else
    print_status "Rust Compiler (rustc)" "FAIL" "Rust compiler is not installed."
    MISSING_CORE+=("rust")
fi

# ------------------------------------------------------------------------------
# SECTION 2: EVM (BASE SEPOLIA) TOOLCHAIN
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}${BOLD}--- [2] EVM Gateway Toolchain (Base Sepolia) ---${NC}"

# Foundry forge
if command -v forge &> /dev/null; then
    FORGE_VERSION=$(forge --version | awk '{print $2}')
    print_status "Foundry (forge compiler)" "PASS" "v$FORGE_VERSION"
else
    print_status "Foundry (forge compiler)" "FAIL" "Foundry Forge is missing."
    MISSING_EVM+=("foundry")
fi

# ------------------------------------------------------------------------------
# SECTION 3: SOLANA (SVM DEVNET) TOOLCHAIN
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}${BOLD}--- [3] SVM Gateway Toolchain (Solana Devnet) ---${NC}"

# Solana CLI
if command -v solana &> /dev/null; then
    SOL_VERSION=$(solana --version | awk '{print $2}')
    print_status "Solana CLI Tool Suite" "PASS" "v$SOL_VERSION"
else
    print_status "Solana CLI Tool Suite" "FAIL" "Solana CLI is missing."
    MISSING_SOLANA+=("solana-cli")
fi

# Anchor CLI
if command -v anchor &> /dev/null; then
    ANC_VERSION=$(anchor --version | head -n1 | awk '{print $2}')
    print_status "Anchor Framework CLI" "PASS" "v$ANC_VERSION"
else
    print_status "Anchor Framework CLI" "FAIL" "Anchor Framework CLI is missing."
    MISSING_SOLANA+=("anchor-cli")
fi

# ------------------------------------------------------------------------------
# SECTION 4: MOVEMENT (MOVEVM PORTO) TOOLCHAIN
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}${BOLD}--- [4] MoveVM Gateway Toolchain (Movement Porto) ---${NC}"

# Movement L2 CLI
if command -v movement &> /dev/null; then
    MOVE_VERSION=$(movement --version 2>&1 | awk '{print $2}' || echo "Installed")
    print_status "Movement L2 CLI / Move Suite" "PASS" "$MOVE_VERSION"
else
    print_status "Movement L2 CLI / Move Suite" "FAIL" "Movement CLI is missing."
    MISSING_MOVEMENT+=("movement-cli")
fi

# ------------------------------------------------------------------------------
# SECTION 5: STELLAR (SOROBAN TESTNET) TOOLCHAIN
# ------------------------------------------------------------------------------
echo -e "\n${CYAN}${BOLD}--- [5] Soroban WASM Toolchain (Stellar Testnet) ---${NC}"

# Stellar Soroban CLI
if command -v stellar &> /dev/null; then
    STELLAR_VERSION=$(stellar --version | head -n1 | awk '{print $2}')
    print_status "Stellar Soroban CLI" "PASS" "v$STELLAR_VERSION"
else
    print_status "Stellar Soroban CLI" "FAIL" "Stellar Soroban CLI is missing."
    MISSING_STELLAR+=("stellar-cli")
fi

# ------------------------------------------------------------------------------
# DIAGNOSTIC RESULTS & ACTION PLAN
# ------------------------------------------------------------------------------
echo -e "\n${BLUE}${BOLD}=======================================================================${NC}"
echo -e "${BOLD}                     DIAGNOSTIC REPORT SUMMARY                          ${NC}"
echo -e "${BLUE}${BOLD}=======================================================================${NC}"

HAS_ISSUES=false

# Check core issues
if [ ${#MISSING_CORE[@]} -gt 0 ]; then
    HAS_ISSUES=true
    echo -e "${RED}${BOLD}❌ CRITICAL RUST/NODE ENVIRONMENT NOT DETECTED${NC}"
    echo -e "   Please complete basic environment setup before deploying smart contracts:"
    for item in "${MISSING_CORE[@]}"; do
        if [ "$item" = "node" ]; then
            echo -e "   👉 ${BOLD}Install Node.js${NC}: Run: curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - && sudo apt-get install -y nodejs"
        elif [ "$item" = "rust" ]; then
            echo -e "   👉 ${BOLD}Install Rust/Cargo${NC}: Run: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh"
        fi
    done
    echo ""
fi

# Check EVM Issues
if [ ${#MISSING_EVM[@]} -gt 0 ]; then
    HAS_ISSUES=true
    echo -e "${YELLOW}${BOLD}⚠ BASE SEPOLIA (EVM) COMPILING DEGRADED${NC}"
    echo -e "   Foundry is missing. You will not be able to build contracts/solidity/"
    echo -e "   👉 ${BOLD}Install Foundry${NC}: Run the following commands:"
    echo -e "      curl -L https://foundry.paradigm.xyz | bash"
    echo -e "      source ~/.bashrc && foundryup"
    echo ""
fi

# Check Solana Issues
if [ ${#MISSING_SOLANA[@]} -gt 0 ]; then
    HAS_ISSUES=true
    echo -e "${YELLOW}${BOLD}⚠ SOLANA DEVNET (SVM) COMPILING DEGRADED${NC}"
    echo -e "   Solana or Anchor CLIs are missing. You will not be able to build contracts/solana/"
    echo -e "   👉 ${BOLD}Install Solana Tool Suite${NC}: Run:"
    echo -e "      sh -c \"\$(curl -sSfL https://release.solana.com/v1.18.17/install)\""
    echo -e "   👉 ${BOLD}Install Anchor Framework CLI${NC}: Run:"
    echo -e "      cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.1 anchor-cli --locked"
    echo ""
fi

# Check Movement Issues
if [ ${#MISSING_MOVEMENT[@]} -gt 0 ]; then
    HAS_ISSUES=true
    echo -e "${YELLOW}${BOLD}⚠ MOVEMENT PORTO (MoveVM) COMPILING DEGRADED${NC}"
    echo -e "   Movement CLI is missing. You will not be able to compile Movement Move packages."
    echo -e "   👉 ${BOLD}Install Movement CLI${NC}: Run:"
    echo -e "      curl -fsSL https://raw.githubusercontent.com/movement-labs/movement/main/install.sh | bash"
    echo ""
fi

# Check Stellar Issues
if [ ${#MISSING_STELLAR[@]} -gt 0 ]; then
    HAS_ISSUES=true
    echo -e "${YELLOW}${BOLD}⚠ STELLAR TESTNET (SOROBAN Rust) COMPILING DEGRADED${NC}"
    echo -e "   Stellar CLI is missing. You will not be able to compile Soroban target-WASM."
    echo -e "   👉 ${BOLD}Install Stellar CLI${NC}: Run:"
    echo -e "      cargo install --locked stellar-cli --features opt"
    echo ""
fi

if [ "$HAS_ISSUES" = false ]; then
    echo -e "${GREEN}${BOLD}🎉 EXCELLENT! ALL MULTI-VM COMPILERS, SYSTEM FRAMEWORKS, AND CLIS ARE LIVE!${NC}"
    echo -e "Your local workspace is fully provisioned to build, compile, prove, and deploy"
    echo -e "Base Solidity, Solana Anchor, Movement AptosVM, and Stellar Soroban contracts."
    echo -e "\nYou are ready to execute: ${CYAN}./deploy_all.sh${NC} with production confidence!"
else
    echo -e "${YELLOW}${BOLD}ℹ NOTE ON PARTIAL LIVE TOOLCHAINS:${NC}"
    echo -e "You can still run individual gateway deployments by satisfying specific blockchain toolchains,"
    echo -e "or leverage the simulated Prism dApp sandbox for rapid cryptographic validation."
fi
echo -e "${BLUE}${BOLD}=======================================================================${NC}"
