# 🔮 PrismFlashZK — A Zero-Knowledge Intent Layer for Multi-VM Settlement

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Cryptography: Noir ZK](https://img.shields.io/badge/Cryptography-Noir%20ZK-magenta)](https://noir-lang.org/)
[![VM Ecosystem: Multi--VM](https://img.shields.io/badge/VM%20Ecosystem-EVM%20%7C%20SVM%20%7C%20MoveVM%20%7C%20Soroban-cyan)](#)

**PrismFlashZK** is the hackathon-ready foundation layer for the larger **PrismZK** vision:
turn a cross-chain swap into a single *cryptographic intent* that is proven in zero-knowledge
on the client and cleared on Stellar Soroban before any value moves on the destination chains.

The chain you're on should be invisible. You hold **one chainless identity**, your liquidity is
tracked in **one state registry**, and a **reflector network** of solvers fills your intent across
**Base/EVM**, **Solana/SVM**, **Movement/MoveVM**, and **Stellar/Soroban**.

This repository is the **basic, runnable layer** toward that architecture — a real Noir circuit,
a real client-side prover, an on-chain ed25519-attested clearance path, deployable multi-VM
contracts, and an interactive cockpit. It is explicitly *not* a claim that every future PrismZK
primitive (native Soroban ZK host verification, TTL nullifier expiry, hardware-shielded execution)
is production-complete.

---

## ✅ What is real, and what is simulated

Being precise about this is the point — it's what separates a working ZK layer from a mockup.

| Component | Status |
|---|---|
| **Noir circuit** (`circuits/src/main.nr`) | **Real.** Compiles to ACIR; computes the nullifier + payload-commitment invariants and returns them as public outputs. |
| **Client-side proving** (`src/lib/prism_prover.ts`) | **Real.** UltraHonk proof generated in the browser via `bb.js` WASM — the `secret_key` never leaves the client. |
| **Attestor** (`src/lib/attestor.ts`) | **Real.** Verifies the proof against the verification key and ed25519-signs the exact 68-byte clearance message. |
| **Soroban clearance** (`contracts/soroban/prism_verifier`) | **Real.** Checks the attestation with the shipped `ed25519_verify` host call; enforces the expiry window and rejects spent nullifiers. |
| **Unified liquidity registry** (`contracts/soroban/master_state_registry`) | **Real contract.** Tracks cross-VM balances; seeded with illustrative figures in the demo. |
| **Multi-VM contracts** (Base / Solana / Movement) | **Real, deployable skeletons** — standard escrow / vault / coin mechanisms per VM. |
| **Cockpit + server** (`server.ts`, React app) | **Real UI; simulation-first backend.** The lock → clear → payout *value movement* is simulated so the whole flow demos without funded keys. |
| **On-chain value settlement** (real locks + real payouts end-to-end) | **Not yet.** The clearance path is real ZK; a live value round-trip is the next milestone. |

**Trust model:** optimistic + trusted-attestor (no TEE). Soroban cannot yet verify a BN254/UltraHonk
proof on-chain — the host functions (CAP-0074 / CAP-0075) are *proposed, not shipped* — so a proof is
verified off-chain and relayed on-chain as a signed attestation the contract re-checks. When those host
functions land, the attestor drops out and the path becomes fully trustless.

---

## 🧬 How the zero-knowledge works

The circuit (`circuits/src/main.nr`, BN254 scalar field) enforces **two invariants** and returns both
values as *public outputs*, so what the proof attests is, by construction, exactly what gets signed and
checked on-chain:

1. **Replay prevention + identity authority — Nullifier**
   `N = Poseidon2(secret_key, nonce)`
   Only the holder of `secret_key` can reproduce it, so it doubles as proof of identity — there is **no
   separate public-key derivation step**. Soroban stores each nullifier once, so an intent settles exactly once.

2. **State binding — Payload Commitment**
   `C = Poseidon2(intents_root, max_block_height)`
   `intents_root` is a Poseidon2 commitment over the destination wallets and amounts. If a solver alters a
   payout address or amount, `intents_root` changes, `C` changes, and the proof no longer matches the
   on-chain-checked value — front-running and address-spoofing are cryptographically rejected.

### Lifecycle of a PrismFlashZK intent
```
  [Base Sepolia] ──(1. lock assets)──▶ [BaseEscrow.sol]
        │
        │  client generates a real Noir/UltraHonk proof
        │  (secret_key never leaves the browser)
        ▼
  [Attestor] ──verifies proof vs VK, ed25519-signs (nullifier ‖ commitment ‖ max_block_height)
        │
        ▼
  [Stellar Soroban: prism_verifier] ──ed25519_verify(attestation)──▶ clears intent
        │   · rejects expired windows   · rejects spent nullifiers   · emits prism_att
        ▼
  [Reflector solvers] ──(3. concurrent payout)──▶ [Solana Devnet] + [Movement]
```

---

## 🗺️ Multi-VM contract map

| VM | Contract | Role |
|---|---|---|
| Base / EVM | `contracts/solidity/BaseEscrow.sol` | Origin optimistic lock / claim / finalize (150-block dispute window) |
| Base / EVM | `contracts/solidity/PrismToken.sol` | Self-contained ERC-20 for issued OmniTokens |
| Stellar / Soroban | `contracts/soroban/prism_verifier` | Clears intents via `ed25519_verify` of the attestation |
| Stellar / Soroban | `contracts/soroban/master_state_registry` | Unified cross-VM liquidity balance sheet |
| Solana / SVM | `contracts/solana/programs/solana_vault` | Anchor vault PDA holding SPL payout liquidity |
| Movement / MoveVM | `contracts/move/sources/movement_escrow.move` | Generic `Coin<T>` escrow + payout |

---

## ▶️ Run the cockpit locally (no keys needed)

The interactive cockpit runs entirely on the simulation-first backend, so you can demo the full
landing → prove → clear → payout flow with zero funded wallets:

```bash
npm install
npm run dev            # boots on http://localhost:3011 (the dev script logs the actual port)
```

Open `http://localhost:3011` for the landing page, then click **Enter ZK Forge** for the cockpit.
In **Intent Swap Hub**, click **Compile ZK Proof & Dispatch** to watch the pipeline animate
Initiated → Proof Verified → Finalized with a live solver log.

**Hosting:** the app is a Node/Express server, so it belongs on a Node host (Render / Railway / Fly),
not on a static-only platform. Build with `npm run build`, serve with `npm start`.

---

## 🌐 Real testnet deployment

Everything below drives live public testnets and needs your own funded keys + the per-VM CLIs
(`forge`, `anchor`/`solana`, `stellar`, `movement`, `nargo`/`bb`). Prerequisites are listed at the
bottom of this README.

```bash
# 1. Provision fresh multi-VM keys into .env (idempotent)
npm run preflight

# 2. Fund the four generated addresses on each network's public testnet faucet
#    (Base Sepolia · Solana Devnet · Stellar Testnet · Movement Porto)

# 3. Compile the circuit + verification key (needs the Aztec CRS host reachable)
npm run compile-circuit

# 4. Deploy contracts to all reachable chains; add --with-token to also issue pUSD
#    and seed destination vaults / LPs
npm run deploy-testnet -- --with-token

# 5. (optional) Issue a multi-VM OmniToken on its own
npm run create-multivm-token
```

Deployed addresses are written to `deployments/prism-assets.local.json`; live liquidity to
`deployments/liquidity-state.local.json`. The cockpit reads these automatically and prefers them
over the committed `*.example.json` seeds.

---

## 🔗 Live testnet deployments (reference runs)

> These are addresses/transactions from our own funded testnet runs — evidence the flow deploys and
> initializes on real networks. Confirm against the explorers; they are not reproducible without our keys.

### Stellar Testnet — Verifier + Registry
- **`prism_verifier`:** `CBW34A4AOO4KODJZRZUMUAFQVESO4W4F5MTM7DRKH7HOUBS2UBII6WL7`
  · [stellar.expert](https://stellar.expert/explorer/testnet/contract/CBW34A4AOO4KODJZRZUMUAFQVESO4W4F5MTM7DRKH7HOUBS2UBII6WL7)
  · [lab](https://lab.stellar.org/r/testnet/contract/CBW34A4AOO4KODJZRZUMUAFQVESO4W4F5MTM7DRKH7HOUBS2UBII6WL7)
  Initialized with attestor ed25519 pubkey `ac2aa0121e9dd116a6629bcc4aaaa2a00ef1e1577f3726ce7eb3daab91673eef`.
- **`master_state_registry` WASM hash:** `f9ef42d1989a1a15b0e52d900f93db9546f39c2981e1a6cbd3dc4df750df3fd0`

### Base Sepolia — Escrow
- **`BaseEscrow`:** `0x15FD3EC58BB4a69FCfe3940357996C745Ad69dAC`
  · [basescan](https://sepolia.basescan.org/address/0x15FD3EC58BB4a69FCfe3940357996C745Ad69dAC)

### Solana Devnet — Vault
- **`solana_vault` program id:** `9p4RB3gHqVFpRHFfmi5rqJX9XFAoVfbsHu1Bb7TAenEB`
  · [explorer](https://explorer.solana.com/address/9p4RB3gHqVFpRHFfmi5rqJX9XFAoVfbsHu1Bb7TAenEB?cluster=devnet)
  Declared in `contracts/solana/programs/solana_vault/src/lib.rs` via `declare_id!`.

### Movement Porto
- **Not deployed this cycle.** The `aptos-framework` pinned at `mainnet` uses Move 2.2 syntax
  (ability constraints on function types) and a non-ASCII character in `sigma_protocol_withdraw.move`
  that the local `movement` CLI cannot compile. Tracked as a follow-up; 3/4 chains ship this cycle.

<details><summary>Earlier iterations (also live on the explorers)</summary>

- **Base escrow:** `0xf3E7184934562e5faA70da285801Aff541dEB010`, `0x86551A877f0536d2fC2eeA89CB52EB905d55d306`, `0xEeBF23668889b13C12775be16A23321300B8b74E`, `0x945A0AcaD69629275Ff6B9681DcC56f146835d3a`, `0x88cf9e43a484Ddd5c4De738741190a98eBF50f4A`, `0xAd9Fadc22dd5C44D1e2C3aFeA80221E9978Eaebf`, `0xe19aDDD082f045038Fe66543aA2cC4DF5F7AE5A7`, `0x82e52D5b7255b26f975be4429bBc5D03FAaA6Af3`
- **Stellar verifier:** `CB4WBGF4KDX3LP74ZOKLVDB6X34ZXJZUD6OMNEJZUV6PY2XLUKBJTRQZ`, `CB2A5IF4GGUTFJ5MJVGUDK7ASYL5ZAN37U73P5FOR7F75CJYTQK742YY`, `CBPMFTRCKH6ZITTFT4MQDVLHESLR5U5MO6B2GL4DAC6YJLAUJMCUAATD`
- **Solana program:** `2FFbpHRM8QSdJREBknoaDNSmhRZZQsysrFGNZyGLwcJP`

</details>

---

## 🔒 Circuit invariants at a glance

`circuits/src/main.nr` proves, over standard BN254:

1. **Nullifier `N = Poseidon2(secret_key, nonce)`** — replay prevention + identity authority.
2. **Payload Commitment `C = Poseidon2(intents_root, max_block_height)`** — freezes destination
   wallets, amounts, and the validity window; prevents relayer front-running / address-spoofing.

Both are returned as public outputs; the attestor signs exactly these, and Soroban re-checks them.

---

## 📂 Project structure & script index

```
├── circuits/                         # Noir ZK proof circuit
│   ├── Nargo.toml
│   ├── lib/poseidon                  # vendored Poseidon2 (left Noir std in beta.x)
│   └── src/main.nr                   # nullifier + payload-commitment circuit
├── contracts/
│   ├── solidity/                     # BaseEscrow.sol · PrismToken.sol (Base Sepolia)
│   ├── solana/                       # Anchor solana_vault program
│   ├── move/                         # movement_escrow.move · prism_pusd.move
│   └── soroban/                      # prism_verifier + master_state_registry (workspace)
├── src/lib/
│   ├── prism_prover.ts               # client-side UltraHonk prover
│   └── attestor.ts                   # off-chain proof verify + ed25519 attestation
├── scripts/
│   ├── compile_circuit.mjs           # circuit → ACIR + VK
│   ├── preflight.js                  # wallet provisioning + balance checks
│   ├── deploy_testnet.js             # multi-VM deploy orchestrator
│   └── create_multivm_token.js       # real OmniToken issuance across VMs
├── server.ts                         # Express API + serves landing + cockpit
├── multichain_watcher.js             # cross-chain event listener / liquidity reconciler
└── deployments/                      # asset + liquidity registry (example + local)
```

### npm scripts
`dev` · `build` · `start` · `preflight` · `deploy-testnet` · `create-multivm-token` ·
`compile-circuit` · `provision-wallets` · `dashboard` · `create-tokens` · `solver-daemon` ·
`orchestrate` · `diagnose` · `lint`

---

## 🎯 Hackathon scope

| Layer | Built now | PrismZK direction |
|---|---|---|
| Intent UX | React cockpit: create, prove, clear, challenge, finalize | Full Prism SDK with proof-gen UX |
| Origin lock | Solidity `BaseEscrow` optimistic lock/claim/finalize | Audited collateral vaults |
| Clearinghouse | Soroban `prism_verifier` (ed25519-attested) + `master_state_registry` | Native Soroban ZK host verification, TTL nullifier expiry |
| ZK circuit | Noir nullifier + payload-commitment, real client proving | On-chain UltraHonk verification |
| Execution | Solver daemon simulation for concurrent Solana/Movement payouts | Hardware-shielded execution matrix |
| Multi-VM contracts | Solana / Move / Soroban / Solidity skeletons | Hardened per-VM gateways |

---

## 🛠️ Prerequisites (for real deployment)

- **Node.js** v18+ & **npm**; **Rust** & **Cargo**
- **Foundry** (`forge`) — Base Sepolia Solidity
- **Solana Tool Suite** + **Anchor CLI** (`v0.30.1`) — Solana Devnet
- **Stellar CLI** — Soroban testnet WASM
- **Movement CLI** — Movement Porto (see the Movement note above)
- **Nargo** + **bb** — Noir circuit compilation and proving (needs the Aztec CRS host reachable)

---

*PrismFlashZK — cryptographic cross-chain intent settlement. Built on Noir, Rust, Solidity, React & Node.*
