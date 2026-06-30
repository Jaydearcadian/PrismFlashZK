#!/usr/bin/env bash

# ==============================================================================
# 🌐 Prism Cross-Chain Intent Settlement Protocol: Multi-VM Deployer Automator
# ==============================================================================
# This shell script compiles, builds, and deploys all smart contracts across:
# 1. Base Sepolia Testnet (EVM)
# 2. Solana Devnet (SVM)
# 3. Movement Porto Testnet (MoveVM)
# 4. Stellar Testnet (Soroban Rust WASM)
# ==============================================================================

set -euo pipefail

# --- Load Environment Variables ---
if [ -f .env ]; then
    echo -e "\033[0;34mLoading credentials from .env file...\033[0m"
    while IFS= read -r line || [ -n "$line" ]; do
        # Skip comments and empty lines
        [[ "$line" =~ ^#.*$ ]] && continue
        [[ -z "$line" ]] && continue
        # Parse and export
        key=$(echo "$line" | cut -d'=' -f1 | xargs)
        val=$(echo "$line" | cut -d'=' -f2- | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//" | xargs)
        export "$key"="$val"
    done < .env
fi


# Visual format helpers
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0;33m' # No Color
NC_PLAIN='\033[0m'

echo -e "${BLUE}================================================================${NC_PLAIN}"
echo -e "${BLUE}  PRISM CROSS-CHAIN INTENT SETTLEMENT PROTOCOL - LAUNCH ENGINE  ${NC_PLAIN}"
echo -e "${BLUE}================================================================${NC_PLAIN}"

# --- Step 1: Pre-flight Checks ---
echo -e "\n${YELLOW}[1/5] Running pre-flight environment checks...${NC_PLAIN}"

declare -a REQUIRED_CLIS=("node" "cargo" "rustc")
for cli in "${REQUIRED_CLIS[@]}"; do
    if ! command -v "$cli" &> /dev/null; then
        echo -e "${RED}❌ Error: '$cli' is required but not installed. Please install it first.${NC_PLAIN}"
        exit 1
    fi
done
echo -e "${GREEN}✔ Core rust and node environments verified.${NC_PLAIN}"

# Check for Optional frameworks based on which chains the developer wants to target
echo -e "${BLUE}Checking multi-chain framework installations...${NC_PLAIN}"

# --- Foundry EVM check ---
HAS_FOUNDRY=true
if ! command -v forge &> /dev/null; then
    echo -e "${YELLOW}⚠ Warning: 'forge' (Foundry) not detected. EVM Base contract cannot be compiled/deployed automatically.${NC_PLAIN}"
    HAS_FOUNDRY=false
else
    echo -e "${GREEN}✔ Foundry (forge) detected.${NC_PLAIN}"
fi

# --- Solana CLI check ---
HAS_SOLANA=true
if ! command -v solana &> /dev/null || ! command -v anchor &> /dev/null; then
    echo -e "${YELLOW}⚠ Warning: 'solana' or 'anchor' CLI not detected. Solana Devnet programs cannot be built/deployed automatically.${NC_PLAIN}"
    HAS_SOLANA=false
else
    echo -e "${GREEN}✔ Solana Tool Suite & Anchor CLI detected.${NC_PLAIN}"
fi

# --- Movement CLI check ---
HAS_MOVEMENT=true
if ! command -v movement &> /dev/null; then
    echo -e "${YELLOW}⚠ Warning: 'movement' CLI not detected. Movement Porto module cannot be compiled/published automatically.${NC_PLAIN}"
    HAS_MOVEMENT=false
else
    echo -e "${GREEN}✔ Movement L2 CLI detected.${NC_PLAIN}"
fi

# --- Stellar CLI check ---
HAS_STELLAR=true
if ! command -v stellar &> /dev/null; then
    echo -e "${YELLOW}⚠ Warning: 'stellar' (Soroban CLI) not detected. Stellar Testnet contracts cannot be compiled/deployed automatically.${NC_PLAIN}"
    HAS_STELLAR=false
else
    echo -e "${GREEN}✔ Stellar Soroban CLI detected.${NC_PLAIN}"
fi


# --- Step 2: Deploy EVM Origin Escrow (Base Sepolia) ---
if [ "$HAS_FOUNDRY" = true ]; then
    echo -e "\n${YELLOW}[2/5] Deploying BaseEscrow.sol to Base Sepolia Testnet...${NC_PLAIN}"
    
    # Use environment variable if present, otherwise prompt
    if [ -z "${EVM_PRIVATE_KEY:-}" ]; then
        read -sp "Enter private key for Base Sepolia (or press Enter to skip EVM deployment): " EVM_PRIVATE_KEY
        echo ""
    else
        echo -e "${GREEN}✔ Loaded EVM_PRIVATE_KEY from .env configuration.${NC_PLAIN}"
    fi
    
    if [ -n "${EVM_PRIVATE_KEY:-}" ]; then
        cd contracts/solidity
        echo -e "${BLUE}Compiling Solidity contract with Foundry...${NC_PLAIN}"
        forge build
        
        echo -e "${BLUE}Deploying contract to Base Sepolia...${NC_PLAIN}"
        # We target the canonical Base Sepolia RPC
        DEPLOY_OUT=$(forge create --rpc-url https://sepolia.base.org \
          --private-key "$EVM_PRIVATE_KEY" \
          BaseEscrow.sol:BaseEscrow)
        
        echo -e "${GREEN}✔ Solidity Escrow deployed successfully!${NC_PLAIN}"
        echo "$DEPLOY_OUT"
        cd ../..
    else
        echo -e "${YELLOW}Skipping EVM deployment step (No key provided).${NC_PLAIN}"
    fi
else
    echo -e "\n${YELLOW}[2/5] EVM Escrow deployment skipped (Foundry missing).${NC_PLAIN}"
fi


# --- Step 3: Deploy Solana Vault (Solana Devnet) ---
if [ "$HAS_SOLANA" = true ]; then
    echo -e "\n${YELLOW}[3/5] Compiling and deploying Anchor Vault to Solana Devnet...${NC_PLAIN}"
    cd contracts/solana
    
    echo -e "${BLUE}Generating Solana program ID...${NC_PLAIN}"
    # Verify keypair exists
    if [ ! -f "target/deploy/solana_vault-keypair.json" ]; then
        echo -e "${BLUE}Initializing new keypair for solana_vault...${NC_PLAIN}"
        mkdir -p target/deploy
        solana-keygen new --no-bip39-passphrase --force -o target/deploy/solana_vault-keypair.json > /dev/null
    fi
    
    PROG_ID=$(solana address -k target/deploy/solana_vault-keypair.json)
    echo -e "Target Solana Program ID: ${GREEN}$PROG_ID${NC_PLAIN}"
    
    echo -e "${BLUE}Building Anchor rust code...${NC_PLAIN}"
    anchor build
    
    echo -e "${BLUE}Configuring target cluster to Solana Devnet...${NC_PLAIN}"
    solana config set --url devnet
    
    # Requesting Airdrop if balance is low
    BALANCE=$(solana balance | awk '{print $1}')
    if (( $(echo "$BALANCE < 0.5" | bc -l) )); then
        echo -e "${BLUE}SOL Balance ($BALANCE) is low. Requesting Devnet faucet airdrop...${NC_PLAIN}"
        solana airdrop 2 || echo -e "${RED}Airdrop request failed. Please fund $PROG_ID manually if deployment fails.${NC_PLAIN}"
    fi
    
    echo -e "${BLUE}Deploying Vault program to Solana Devnet...${NC_PLAIN}"
    anchor deploy --provider.cluster Devnet
    echo -e "${GREEN}✔ Anchor program deployed live on Solana Devnet!${NC_PLAIN}"
    cd ../..
else
    echo -e "\n${YELLOW}[3/5] Solana Devnet deployment skipped (Anchor/Solana CLI missing).${NC_PLAIN}"
fi


# --- Step 4: Deploy Movement Escrow (Movement Porto Testnet) ---
if [ "$HAS_MOVEMENT" = true ]; then
    echo -e "\n${YELLOW}[4/5] Compiling and publishing Aptos-Move module to Movement Porto...${NC_PLAIN}"
    cd contracts/move
    
    if [ ! -d ".aptos" ]; then
        echo -e "${BLUE}Initializing Move profile on Movement...${NC_PLAIN}"
        # Interactive configuration or automated profile setup
        movement init --profile default --network testnet --assume-yes
    fi
    
    echo -e "${BLUE}Funding Movement L2 account via faucet...${NC_PLAIN}"
    movement account fund-with-faucet --profile default || echo "Faucet call completed or skipped."
    
    echo -e "${BLUE}Compiling Move module...${NC_PLAIN}"
    movement move compile
    
    echo -e "${BLUE}Publishing package...${NC_PLAIN}"
    movement move publish --profile default
    echo -e "${GREEN}✔ Move package published on Movement Porto Testnet!${NC_PLAIN}"
    cd ../..
else
    echo -e "\n${YELLOW}[4/5] Movement Porto deployment skipped (Movement CLI missing).${NC_PLAIN}"
fi


# --- Step 5: Deploy Stellar Soroban Clearinghouse (Stellar Testnet) ---
if [ "$HAS_STELLAR" = true ]; then
    echo -e "\n${YELLOW}[5/5] Compiling and deploying Rust contract to Stellar Testnet...${NC_PLAIN}"
    cd contracts/soroban
    
    echo -e "${BLUE}Compiling rust contract to optimized WASM target...${NC_PLAIN}"
    stellar contract build
    
    # Generate keys if they do not exist
    if ! stellar keys address deployer &> /dev/null; then
        echo -e "${BLUE}Generating Stellar keypair: deployer...${NC_PLAIN}"
        stellar keys generate --global deployer --network testnet
    fi
    
    echo -e "${BLUE}Deploying to Stellar Testnet...${NC_PLAIN}"
    ST_DEPLOY=$(stellar contract deploy \
      --wasm target/wasm32-unknown-unknown/release/prism_soroban_escrow.wasm \
      --source deployer \
      --network testnet)
      
    echo -e "${GREEN}✔ Stellar Soroban Contract deployed successfully!${NC_PLAIN}"
    echo -e "Contract Address: ${GREEN}$ST_DEPLOY${NC_PLAIN}"
    cd ../..
else
    echo -e "\n${YELLOW}[5/5] Stellar Testnet deployment skipped (Stellar CLI missing).${NC_PLAIN}"
fi

echo -e "\n${BLUE}================================================================${NC_PLAIN}"
echo -e "${GREEN}🎉 MULTI-VM DEPLOYMENT PIPELINE COMPLETE!${NC_PLAIN}"
echo -e "Please read ${YELLOW}DEPLOYMENT_GUIDE.md${NC_PLAIN} for client-side configuration details."
echo -e "${BLUE}================================================================${NC_PLAIN}"
