# 🌐 Prism Cross-Chain Intent Settlement Protocol: Production & Testnet Deployment Guide

This guide provides a comprehensive, step-by-step blueprint to transition the **Prism Cross-Chain Intent Settlement Protocol** from the simulated local staging environment to public testnets and devnets:
- **Origin Chain**: Base Sepolia Testnet (EVM / Solidity)
- **Clearinghouse Chain**: Stellar Testnet (Soroban / Rust)
- **Destination Chain 1**: Solana Devnet (SVM / Anchor Rust)
- **Destination Chain 2**: Movement Porto Testnet (MoveVM / Aptos Move)

---

## 🛠️ Environment Prerequisites

Make sure you have the following CLI utilities installed on your local development machine:
1. **Node.js v18+ & NPM**
2. **Solidity Development Kit**: [Foundry](https://book.getfoundry.sh/) or [Hardhat](https://hardhat.org/)
3. **Rust Toolchain**: `rustup default stable`
4. **Solana CLI & Anchor Framework**: [Solana Tool Suite](https://docs.solanapay.com/sdk/core/installation) & [Anchor CLI](https://www.anchor-lang.com/docs/installation)
5. **Aptos/Movement CLI**: [Movement CLI Tool](https://docs.movementlabs.xyz/)
6. **Stellar CLI**: [Stellar Soroban CLI Tool](https://developers.stellar.org/docs/smart-contracts/getting-started/setup)

---

## 1. Deploying the Solidity Origin Escrow (`BaseEscrow.sol`)
### Network: **Base Sepolia Testnet**

The Solidity contract `BaseEscrow.sol` stores client deposits (like `tUSDC`) and handles dispute windows or immediate TEE clearance.

#### Step A: Setup Hardhat or Foundry Project
1. Navigate to your local Solidity contracts folder or create a new Foundry folder:
   ```bash
   mkdir -p contracts/solidity-deploy && cd contracts/solidity-deploy
   forge init
   ```
2. Copy `/contracts/solidity/BaseEscrow.sol` into the `src/` directory.

#### Step B: Compile Contract
```bash
forge build
```

#### Step C: Deploy to Base Sepolia Testnet
Run the deployment script using your wallet private key and a Base Sepolia RPC endpoint:
```bash
forge create --rpc-url https://sepolia.base.org \
  --private-key <YOUR_PRIVATE_KEY> \
  src/BaseEscrow.sol:BaseEscrow \
  --verify
```
*Note the returned **Deployed Address** (e.g., `0x89C7...A9FFC`).*

---

## 2. Deploying the Solana Vault Program (`solana_vault`)
### Network: **Solana Devnet**

The Anchor Rust program handles Solvers' target payout distributions and locks on Solana Devnet.

#### Step A: Configure Anchor for Devnet
Open `/contracts/solana/Anchor.toml` and verify the network configuration:
```toml
[provider]
cluster = "Devnet"
wallet = "~/.config/solana/id.json"
```

#### Step B: Build the Program
Generate program IDs and compile the Rust source:
```bash
cd contracts/solana
solana address -k target/deploy/solana_vault-keypair.json
```
1. Paste the generated program ID into `/contracts/solana/programs/solana_vault/src/lib.rs` inside `declare_id!("...")`.
2. Update the `solana_vault` program ID in `Anchor.toml` under `[programs.devnet]`.
3. Compile using Anchor:
   ```bash
   anchor build
   ```

#### Step C: Deploy to Solana Devnet
Ensure your Solana CLI is set to devnet and you have a positive SOL balance:
```bash
solana config set --url devnet
solana airdrop 2
anchor deploy
```
*Note the resulting **Solana Program Address**.*

---

## 3. Deploying the Movement Escrow Contract (`escrow.move`)
### Network: **Movement Porto Testnet**

The Aptos-compatible Move module manages instant payouts on the high-throughput Movement L2 testnet.

#### Step A: Initialize Move Wallet & Profile
Initialize a Movement CLI profile:
```bash
cd contracts/move
movement init --profile default --network testnet
```
*Choose the custom network option and paste the Porto RPC url:* `https://aptos.testnet.porto.movementlabs.xyz/v1`

#### Step B: Fund Your Move Account
Request testnet MOVE tokens from the official faucet:
```bash
movement account fund-with-faucet --profile default
```

#### Step C: Compile and Publish Module
Configure `Move.toml` with your default profile address, then publish:
```bash
movement move compile
movement move publish --profile default
```
*Note the returned **Movement Module Address**.*

---

## 4. Deploying the Soroban Contracts
### Network: **Stellar Testnet**

`contracts/soroban` is a two-crate Cargo workspace, not a single contract — Soroban requires
one `#[contract]` struct per WASM binary, so the ZK-attestation clearance logic and the
liquidity/bonding-curve registry are separate crates:
- **`prism_verifier`**: verifies zero-knowledge/optimistic claims and records clearance events.
- **`master_state_registry`**: the "One State Registry" — a canonical multi-chain token balance
  sheet + bonding-curve price. It's a *singleton per instance*: deploy it once per token (see
  Step D), not once total.

#### Step A: Create and Fund Stellar Account
Use Stellar CLI to configure a testnet identity:
```bash
cd contracts/soroban
stellar keys generate --global deployer --network testnet
```

#### Step B: Build Both Contracts
Compile the Rust workspace into WebAssembly bytecode optimized for Soroban (produces both
`prism_verifier.wasm` and `master_state_registry.wasm`):
```bash
stellar contract build
```

#### Step C: Deploy `prism_verifier`
```bash
stellar contract deploy \
  --wasm target/wasm32v1-none/release/prism_verifier.wasm \
  --source deployer \
  --network testnet
```
*Note the returned **Soroban Contract Address**, then call its `initialize(attestor_key)` once
before it can clear any intents — see `contracts/soroban/prism_verifier/src/lib.rs`.*

#### Step D: Upload (not deploy) `master_state_registry`
Upload the code without instantiating an instance yet — a fresh instance gets created per token
later, reusing this same uploaded WASM hash:
```bash
stellar contract upload \
  --wasm target/wasm32v1-none/release/master_state_registry.wasm \
  --source deployer \
  --network testnet
```
*Note the returned **WASM hash** — `scripts/create_multivm_token.js` needs it to instantiate a
registry per token via `stellar contract deploy --wasm-hash <hash>`.*

---

## 🔗 Linking Deployed Contracts to the Frontend

Once your live smart contracts are deployed to their respective public testnets and devnets, you can link the dApp interface directly to them!

1. Open `src/lib/wallet_provider.ts` to inspect how live chain connection is handled.
2. Update the contract address configurations in your frontend source:
   - Paste the **Base Sepolia Escrow** address into `src/lib/prism_sdk.ts`.
   - Update your **Solana Devnet Program ID** and **Movement Porto Module** paths.
3. You can now use **MetaMask**, **Phantom**, **Freighter**, and **Petra/Martian** to execute genuine cryptographic locks, verify Soroban claims, and clear multi-VM intents live!
