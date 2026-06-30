# 🔮 PrismZK & PrismFlash: Multi-VM Zero-Knowledge Intent Settlement Protocol

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Cryptography: Noir ZK](https://img.shields.io/badge/Cryptography-Noir%20ZK-magenta)](https://noir-lang.org/)
[![VM Ecosystem: Multi--VM](https://img.shields.io/badge/VM%20Ecosystem-EVM%20%7C%20SVM%20%7C%20MoveVM%20%7C%20Soroban-cyan)](#)

Welcome to **Prism**, a state-of-the-art cryptographic clearinghouse and asymmetric intent-settlement pipeline. By combining zero-knowledge cryptography with specialized off-chain solver daemons, Prism bridges the execution gap between **Ethereum (Base Sepolia EVM)**, **Stellar (Soroban Rust WASM)**, **Solana (Devnet Anchor SVM)**, and **Movement (Porto MoveVM)**.

---

## 📖 The Prism Narrative: The Multi-VM Cross-Chain Conundrum

In the multi-chain universe, users are fragmented across isolated Virtual Machines. Swapping assets between an EVM chain, an SVM chain, a MoveVM network, and a Soroban ledger traditionally requires crawling through sluggish, multi-hop liquidity bridges, trusting centralized wrappers, or exposing oneself to predatory front-running and MEV. 

**Prism** rewrites this paradigm. 

Instead of moving assets through physical bridges, Prism processes swaps as **Cryptographic Intents**. When a user wants to execute a cross-chain swap, they lock their capital on an **Origin Chain** (Base Sepolia) and generate an **UltraHonk Zero-Knowledge Proof** using the **Noir Domain Specific Language (DSL)**. 

This ZK-proof guarantees that the funds can *only* be unlocked on the origin chain if a matching, concurrent disbursal is successfully settled on the **Destination Chains** (Solana Devnet & Movement Porto). The clearinghouse of these proofs resides on **Stellar (Soroban)**, verifying the BN254 curve pairing in sub-second times. Off-chain **Solver Daemons** listen to these ledger syncs in real-time, executing instant out-of-band payouts and submitting the cryptographic settlement claims.

### The Lifecycle of a Prism Swap
```
      [Base Sepolia] ===( 1. Lock Assets )===> [BaseEscrow.sol]
            │                                         │
            │ (User generates Noir proof)             │ (Optimistic / TEE Verification)
            ▼                                         ▼
      [Stellar Soroban] <==( 2. Submit Proof )=== [Solver Daemon]
            │
            ├─► (Verifies Nullifier & State Binding over BN254)
            │
            ▼
      [Disbursal Spokes] ===( 3. Concurrent Payout )===> [Solana Devnet] & [Movement Porto]
```

---

## 🛠️ System Prerequisites & Installation

To run this entire multi-chain ecosystem locally and interact with public devnets/testnets, make sure you have the following toolchains installed:

### 1. System Level Runtime Tools
* **Node.js** v18+ & **NPM** (Runtime environment)
* **Rust** & **Cargo** (For compiling Solana Programs & Soroban WASM Contracts)

### 2. Smart Contract Frameworks
* **Foundry (Forge Compiler)**: For Base Sepolia Solidity contracts
  ```bash
  curl -L https://foundry.paradigm.xyz | bash
  foundryup
  ```
* **Solana Tool Suite & Anchor CLI**: For Solana SVM devnet programs
  ```bash
  sh -c "$(curl -sSfL https://release.solana.com/v1.18.17/install)"
  cargo install --git https://github.com/coral-xyz/anchor --tag v0.30.1 anchor-cli --locked
  ```
* **Movement L2 CLI**: For Movement Porto MoveVM packages
  ```bash
  curl -fsSL https://raw.githubusercontent.com/movement-labs/movement/main/install.sh | bash
  ```
* **Stellar Soroban CLI**: For Stellar Testnet WASM smart contracts
  ```bash
  cargo install --locked stellar-cli --features opt
  ```
* **Nargo (Noir Compiler)**: For compiling ZK circuits
  ```bash
  curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install.sh | bash
  noirup
  ```

---

## 📂 Project Structure & Script Index

This project includes a series of robust, production-grade scripts and contracts designed to automate development, key generation, event listening, and transaction dispatching.

```
├── .env.example                     # Environment template file
├── check_toolchain.sh               # Compiler and CLI diagnostics script
├── generate_wallets.js              # Auto-provisioner for multi-chain private keys
├── deploy_all.sh                    # Compiles and deploys all contracts to Devnets
├── deploy_and_run_all.sh            # Unified orchestration runner (fuses all scripts)
├── create_tokens.js                 # Interactive multi-chain token creator
├── live_dashboard.js                # ASCII Terminal monitoring dashboard
├── multichain_watcher.js            # Cross-chain event listening daemon
├── solver_agent.js                  # Execution agent executing target payouts
├── circuits/                        # Noir Zero-Knowledge proof circuits
│   ├── Nargo.toml                   # Noir project configurations
│   └── src/main.nr                  # BN254 Poseidon nullifier-binding circuit
└── contracts/                       # Multi-VM Smart Contracts
    ├── solidity/                    # Base Sepolia Origin Escrow
    ├── solana/                      # Solana Devnet Anchor Program
    ├── move/                        # Movement Porto Move Package
    └── soroban/                     # Stellar Soroban Rust Contract
```

---

## 🚀 Step-by-Step Deployment & Execution Guide

Follow these exact steps to clone, copy, configure, deploy, and launch the Prism clearinghouse pipeline.

### Step 1: Clone and Initialize the Repository
Copy this directory to your local development machine and install dependencies:
```bash
git clone <your-prism-repository-url>
cd prism-protocol
npm install
```

### Step 2: Provision Multi-VM Wallet Keys & .env Config
Instead of manually typing private keys, run the cryptographic provisioner script. It generates fresh, secure keypairs for all four virtual machine architectures and writes them into `.env` and Solana JSON files.

```bash
node generate_wallets.js
```

#### Faucet Funding Plan
Before proceeding to contract deployment, ensure your newly generated addresses have testnet gas tokens. Run these manual or scripted commands:
1. **Base Sepolia (EVM)**: Paste your `EVM_ADDRESS` at [Coinbase Base Faucet](https://www.coinbase.com/faucets/base-ethereum-faucet).
2. **Solana Devnet (SVM)**: Run the following in your terminal:
   ```bash
   solana airdrop 2 <YOUR_SOLANA_ADDRESS> --url devnet
   ```
3. **Stellar Testnet (Soroban)**: Stellar's "Friendbot" will automatically trigger, or fund manually at:
   ```bash
   curl "https://friendbot.stellar.org/?addr=<YOUR_STELLAR_ADDRESS>"
   ```
4. **Movement Porto (MoveVM)**: Request gas at the [Movement Porto Faucet](https://faucet.movementlabs.xyz/).

---

### Step 3: Run Compiler Diagnostics
Run the diagnostic script to check if your local compilers, CLIs, and Rust cargo features are healthy and ready to build:

```bash
bash check_toolchain.sh
```

If any dependency is missing, the script will output a customized installation guide specific to your operating system.

---

### Step 4: Compile and Deploy Smart Contracts
Launch the multi-VM deploying engine. This script compiles contract sources and deploys them live to Base Sepolia, Solana Devnet, Movement Porto, and Stellar Testnet.

```bash
chmod +x deploy_all.sh
./deploy_all.sh
```

#### What the script executes under the hood:
1. **Solidity (Base Sepolia)**: Executes `forge build` followed by `forge create` using your `EVM_PRIVATE_KEY` to deploy the `BaseEscrow.sol` contract.
2. **Anchor (Solana Devnet)**: Verifies/creates `solana_vault-keypair.json`, executes `anchor build` to generate IDLs, configures the provider cluster, and triggers `anchor deploy`.
3. **MoveVM (Movement Porto)**: Runs `movement init`, issues a faucet fund, compiles the move code, and publishes the package.
4. **Soroban (Stellar Testnet)**: Compiles the Rust code into target-WASM WebAssembly (`stellar contract build`) and deploys the optimized bytecode using the deployer identity.

---

### Step 5: Start Off-Chain Daemon Watching
Once contracts are live, boot the event listening network and solver agent.

#### Start the Multi-Chain Event Watcher:
This daemon polls Base Sepolia and Solana Devnet block states, listening for incoming locked assets and verifying state invariants.
```bash
node multichain_watcher.js
```

#### Start the Solver Execution Agent:
This agent listens for events emitted by the watcher, validates the lock nullifier, signs target transactions, and settles Base claims.
```bash
node solver_agent.js
```

*(Note: These can be run in separate terminal tabs, or combined as shown in Step 7).*

---

### Step 6: Create & Register Custom Multi-Chain Assets
You can register new tokens that flow seamlessly across the multi-VM clearinghouse. Run the interactive token generator:

```bash
node create_tokens.js
```
The script will prompt you for:
* **Token Name** (e.g., `Prism Sapphire`)
* **Token Symbol** (e.g., `PRSM`)
* **Total Supply** (e.g., `5,000,000`)
* **Target Chains** (e.g., `Base`, `Solana`, `Stellar`, `Movement`)

It then scaffolds matching Solidity ERC20, Solana SPL, and MoveVM Coin structures, saves a local JSON config, and registers the asset configuration on the clearinghouse server.

---

### Step 7: Launch Live Telemetry Terminal Dashboard
To observe zero-knowledge proofs compiling, solver balances fluctuating, and multi-chain blocks progressing in real-time, launch the immersive ASCII monitoring dashboard:

```bash
node live_dashboard.js
```

---

## ⚡ The Quick-Start Cheat Sheet (Unified Orchestrator)

For rapid local testing and complete end-to-end simulation, run the **Unified Orchestrator**. This script automates wallet provisioning, diagnostic checks, gateway deployment, off-chain daemons initialization, and boots the live terminal dashboard in a single command:

```bash
chmod +x deploy_and_run_all.sh
./deploy_and_run_all.sh
```

Once running, you can open your web cockpit, lock assets on the frontend dApp, and watch the terminal logs instantly light up as the Solver Daemon routes and settles the multi-chain transaction over the cryptographic zero-knowledge pipeline!

---

## 🔒 Cryptographic Safety & Circuit Constraints

The zero-knowledge circuit (`/circuits/src/main.nr`) guarantees three core invariants using standard BN254 curves:
1. **Identity Authority**: Derives and verifies public keys using standard ECDSA fields to prove ownership over the locked assets.
2. **Replay Prevention Invariant (Nullifier N)**: Computes $N = \text{Poseidon2}(\text{Secret Key}, \text{Nonce})$ to ensure each swap is settled exactly once.
3. **State Binding Invariant (Commitment C)**: Computes $C = \text{Poseidon2}(\text{Intents Merkle Root}, \text{Max Block Height})$ to freeze the payout wallet addresses and amounts, preventing front-running or address-spoofing by malicious relayers.

---

*Prism - Cryptographic Cross-Chain Intent Settlements. Built on React, Node, Rust, and Solidity.*
