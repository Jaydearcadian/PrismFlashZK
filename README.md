# 🔮 PrismFlashZK: Basic Intent Layer Toward PrismZK

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Cryptography: Noir ZK](https://img.shields.io/badge/Cryptography-Noir%20ZK-magenta)](https://noir-lang.org/)
[![VM Ecosystem: Multi--VM](https://img.shields.io/badge/VM%20Ecosystem-EVM%20%7C%20SVM%20%7C%20MoveVM%20%7C%20Soroban-cyan)](#)

**PrismFlashZK** is the hackathon-ready foundation layer for the larger **PrismZK** vision: an asymmetric zero-knowledge state-attestation framework for cross-VM execution.

This repository intentionally focuses on a practical first milestone: a runnable intent-settlement cockpit, local/simulated multi-chain lifecycle, deployable contract skeletons, a Noir nullifier/commitment circuit, and solver-style event flow across **Base/EVM**, **Stellar/Soroban**, **Solana/SVM**, and **Movement/MoveVM**.

The long-term PrismZK whitepaper describes native Soroban ZK host verification, TTL-optimized nullifier storage, and hardware-shielded Spectrum Engine execution. This codebase should be read as the **basic layer toward that architecture** — not as a claim that every future PrismZK primitive is already production-complete.

---

## ✅ Latest Live Testnet Proof Route

### Prizm0 `$Z0` ZK Multi-Chain Token Registry

Create/replay the Prizm0 multichain token artifact with:

```bash
npm run token:create:multichain
```

Current Prizm0 state:

| Component | Link / ID |
|---|---|
| Token | `Prizm0` / `$Z0` |
| Canonical supply | `3000000000` base units, 6 decimals |
| Stellar token registry | https://stellar.expert/explorer/testnet/contract/CB74E7CPJVVRTVZBN4FZCQ4XMA3LAMU4M4OOH5K3XSBISKKY3BYC7PAY |
| Stellar allocation proof tx | https://stellar.expert/explorer/testnet/tx/542d30733ac13b2e728ed911282401e0c791bacd21c9f34d17cb89a2dd72a763 |
| Base ERC20 | https://sepolia.basescan.org/address/0xf034869FAa7aFCEA9230cdf4037F3aa187030c1a |
| Solana SPL mint | https://explorer.solana.com/address/J4RVaziZE6sE5HL8mUxZNvHB7SBPfn6WgKrXLZdCUJCj?cluster=devnet |
| Token artifact | `deployments/tokens/Z0.latest.json` |
| Supply artifact | `deployments/tokens/Z0.supply.json` |

ZK allocation proof:

```text
CIRCUIT=zk/omni_token_allocation
SCHEME=ultra_honk
ORACLE_HASH=keccak
PROOF_LEN=14592
PUBLIC_INPUTS_LEN=256
```

Proof-cleared commitments:

```text
TOKEN_ID_COMMITMENT=0x11dc890bb4be43ff6311802c4a5b5ff199750c8d043094f6ccf2e2dfdae685b2
ALLOCATION_COMMITMENT=0x11dc890bb4be43ff6311802c4a5b5ff199750c8d0433103d2e4001457af58954
NULLIFIER=0x0000000000000000000000000000000000000000000000084331a736a01e4b59
```

Allocation:

```text
Base Sepolia:     1000000000 minted as ERC20 Z0
Solana Devnet:    1000000000 minted as SPL Z0
Movement Porto:   1000000000 proof-allocated; Move coin module compile is blocked by pinned AptosFramework invariant/type errors in the current Movement CLI toolchain
```

---

## ✅ Latest Live Testnet Proof Route

Run the public live/dev testnet route with:

```bash
npm run zk:verified-xchain:testnet
```

This executes:

```text
Native Noir + bb UltraHonk proof
→ Stellar public testnet Soroban proof clearing
→ route-gated Base Sepolia source escrow
→ Solana devnet payout
→ Movement Porto payout
→ Base route-commitment settlement claim
→ deployments/live-testnet-latest.json
```

Current live artifacts:

| Component | Link / ID |
|---|---|
| Stellar proof verifier | `CBMOJZTKEC7IMEY65HDJT3LI65Z6JSVND22FQRDYMP6FHGVVGQVB4GX7` |
| Stellar contract explorer | https://stellar.expert/explorer/testnet/contract/CBMOJZTKEC7IMEY65HDJT3LI65Z6JSVND22FQRDYMP6FHGVVGQVB4GX7 |
| Latest Stellar proof tx | https://stellar.expert/explorer/testnet/tx/8671c2994fb52dba23fe12714149bdc98a54dc7c7ee57c22e122b470cfd308b5 |
| Route-gated Base escrow | `0xb7AE4DC12A114cCb077Db1d4899b0Da591e237BA` |
| Base escrow explorer | https://sepolia.basescan.org/address/0xb7AE4DC12A114cCb077Db1d4899b0Da591e237BA |
| Latest live artifact | `deployments/live-testnet-latest.json` |
| Unified liquidity artifact | `deployments/unified-liquidity-latest.json` |

Unified liquidity commands:

```bash
npm run liquidity:unified:test
npm run liquidity:project
```

The unified layer models each route as an async/asymmetric balance sheet:

```text
QUOTE_RESERVED
→ ROUTE_PROVED
→ SOROBAN_CLEARED
→ SOURCE_LOCKED
→ DESTINATION_PAID / DESTINATION_FAILED
→ SOURCE_CLAIMED
→ RECONCILED / FAILED_PARTIAL / RETRYABLE
```

Liquidity buckets tracked per chain:

```text
available | reserved | locked | paid | claimable | settled | failed
```

Latest unified summary:

```text
STATUS=RECONCILED
PENDING_LIABILITY=0
TOTAL_DESTINATION_PAID=426800000
BASE_SETTLED=1200000000
```

Latest route identifiers:

```text
NULLIFIER=0x000000000000000000000000000000000000000000000000021e4048a472d830
ROUTE_COMMITMENT=0x000000000000000000000000000000000000000000000000000186e6a99da129
PAYLOAD_COMMITMENT=0x000000000000000000000000000000000000000000000000000186e6a9d2cbdb
ROUTE_STATE=RECONCILED
```

---

## 🎯 Hackathon Scope: What This Build Proves

| Layer | This repository builds now | PrismZK future direction |
|---|---|---|
| Intent UX | React cockpit for creating, clearing, challenging, and finalizing intents | Full Prism SDK with proof generation UX |
| Origin lock | Solidity `BaseEscrow` optimistic lock/claim/finalize flow | Production collateral vaults and audited settlement modules |
| Clearinghouse | Soroban verifier/registry scaffold plus local attestation flow | Native Soroban ZK host verification and TTL nullifier expiry |
| ZK circuit | Noir nullifier + payload commitment invariants | Production proof system integration and verified public inputs |
| Execution | Solver daemon simulation for concurrent Solana/Movement payouts | Hardware-shielded Spectrum Engine / TEE execution matrix |
| Multi-VM contracts | Solana, Move, Soroban, and Solidity contract skeletons | Hardened deployed gateway contracts per target VM |

---

## 📖 The Prism Narrative: From Fragmented VMs to Attested Intents

In the multi-chain universe, users and agents are fragmented across isolated virtual machines. Moving value or state between an EVM chain, SVM chain, MoveVM network, and Soroban ledger usually means trusting bridge custody, wrapped assets, or slow multi-party signing systems.

**PrismFlashZK** demonstrates the first usable layer of an alternative path: represent cross-VM actions as **cryptographic intents** with replay protection and payload binding.

In the current build, a user locks capital on an origin chain model, derives a nullifier and payload commitment, clears the intent through the Prism clearinghouse layer, and triggers solver-style concurrent payouts to destination-chain modules. The app exposes both the optimistic settlement path (**PrismFlash**) and a future upgrade hook for hardware/ZK-enforced settlement (**PrismZK**).

### The Lifecycle of a PrismFlashZK Intent
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

This project includes the scripts and contract scaffolds needed to demonstrate the basic PrismFlashZK layer: local development, key generation, event listening, transaction dispatch simulation, and testnet-oriented deployment experiments.

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
