# PrismFlashZK — Hackathon Submission

## Thesis
**The chain you're on should be invisible.** You hold one identity, one balance, and one intent —
you say *what* you want, and the system proves it in zero-knowledge and settles it across chains.
Concretely: **contracts decide the cross-chain route, not the solver.** A Noir proof binds the
origin lock *and* the exact destinations; Stellar Soroban records the route only after checking that
proof's attestation; and the spokes release value only against the on-chain-verified commitment.

This delivers contract-first enforcement across **Base → Soroban clearinghouse → Solana + Movement**.

---

## What we built (real vs. simulated)

**Real:**
- **Noir circuit** (`circuits/src/main.nr`): computes the nullifier and payload-commitment invariants
  and returns them as public outputs, so the proof attests exactly the values that get checked.
- **Client-side prover** (`src/lib/prism_prover.ts`): real UltraHonk proof in the browser via `bb.js`
  — the `secret_key` never leaves the client.
- **Attestor** (`src/lib/attestor.ts`): verifies the proof against the verification key and ed25519-signs
  the 68-byte clearance message `nullifier ‖ payload_commitment ‖ max_block_height` (big-endian u32).
- **Soroban `prism_verifier`**: checks that attestation with the shipped `ed25519_verify` host call,
  rejects expired windows and spent nullifiers, records the nullifier, emits `prism_att`.
- **Soroban `master_state_registry`**: unified cross-VM liquidity balance sheet.
- **Deployable contracts** on Base (escrow + ERC-20), Solana (Anchor vault), Movement (generic-coin escrow).

**Simulated (by design, so it demos without funded keys):**
- The cockpit's lock → clear → payout *value movement* runs on a simulation-first backend.
- A full on-chain value round-trip (real locks + real payouts end-to-end) is the next milestone.

**Trust model:** optimistic + trusted-attestor. Soroban cannot yet verify a BN254/UltraHonk proof
on-chain (CAP-0074 / CAP-0075 are proposed, not shipped), so the proof is verified off-chain and
relayed on-chain as an ed25519 attestation. When those host functions ship, the attestor drops out
and the clearance becomes fully trustless.

---

## Why this is different
- **Before:** the solver told Soroban the route (trust-based).
- **Now:** proof + contract gate. Soroban clears an intent only if the attestation over the proof's
  public outputs verifies; the spokes read the verified commitment. Change a destination wallet or
  amount and the commitment changes — the proof no longer matches, and the route is rejected.

---

## Live testnet deployments (reference runs)

> Addresses/transactions from our own funded testnet runs — evidence the flow deploys and initializes
> on real networks. They are not reproducible without our keys; verify on the explorers.

### Stellar Testnet — Verifier + Registry
- **`prism_verifier`:** `CBW34A4AOO4KODJZRZUMUAFQVESO4W4F5MTM7DRKH7HOUBS2UBII6WL7`
  · [stellar.expert](https://stellar.expert/explorer/testnet/contract/CBW34A4AOO4KODJZRZUMUAFQVESO4W4F5MTM7DRKH7HOUBS2UBII6WL7)
  - Initialized with attestor ed25519 pubkey `ac2aa0121e9dd116a6629bcc4aaaa2a00ef1e1577f3726ce7eb3daab91673eef`.
  - Init tx: [`865f7ad2…a111`](https://stellar.expert/explorer/testnet/tx/865f7ad24f0c6e3547c53f7d67e6a6d90f5c411b9f48dc0ba8ba022a1ee8a111)
- **`master_state_registry` WASM hash:** `f9ef42d1989a1a15b0e52d900f93db9546f39c2981e1a6cbd3dc4df750df3fd0`

### Base Sepolia — Escrow
- **`BaseEscrow`:** `0x15FD3EC58BB4a69FCfe3940357996C745Ad69dAC`
  · [basescan](https://sepolia.basescan.org/address/0x15FD3EC58BB4a69FCfe3940357996C745Ad69dAC)

### Solana Devnet — Vault
- **`solana_vault` program id:** `9p4RB3gHqVFpRHFfmi5rqJX9XFAoVfbsHu1Bb7TAenEB`
  · [explorer](https://explorer.solana.com/address/9p4RB3gHqVFpRHFfmi5rqJX9XFAoVfbsHu1Bb7TAenEB?cluster=devnet)
  - Declared via `declare_id!` in `contracts/solana/programs/solana_vault/src/lib.rs`.
  - Deploy tx: [`2nE1LZaN…NSr6`](https://explorer.solana.com/tx/2nE1LZaNwGAtpZhfRfv6yvPmzKy4F8KMLcXiTuTsrd5QMztYxLaSRcivKubdCUThuwj4LDyHEAwdRqYVG4qXNSr6?cluster=devnet)

### Multi-VM OmniToken issuance (reference)
- **Base ERC-20:** [`0xf034869F…30c1a`](https://sepolia.basescan.org/address/0xf034869FAa7aFCEA9230cdf4037F3aa187030c1a)
- **Solana SPL mint:** [`J4RVaziZ…CUJCj`](https://explorer.solana.com/address/J4RVaziZE6sE5HL8mUxZNvHB7SBPfn6WgKrXLZdCUJCj?cluster=devnet)
- **Stellar token registry:** [`CB74E7CP…7PAY`](https://stellar.expert/explorer/testnet/contract/CB74E7CPJVVRTVZBN4FZCQ4XMA3LAMU4M4OOH5K3XSBISKKY3BYC7PAY)

### Movement Porto
- **Not deployed this cycle.** `aptos-framework@mainnet` uses Move 2.2 syntax (ability constraints on
  function types) and a non-ASCII character in `sigma_protocol_withdraw.move` that the local `movement`
  CLI rejects. Pinning to `aptos-release-v1.5.0` and stripping the ASCII issue still tripped the newer
  invariants. Decision: ship 3/4 chains this cycle, track Movement as a follow-up.

<details><summary>Earlier iterations (also live on the explorers)</summary>

- **Base escrow:** `0xf3E7184934562e5faA70da285801Aff541dEB010`, `0x86551A877f0536d2fC2eeA89CB52EB905d55d306`, `0xEeBF23668889b13C12775be16A23321300B8b74E`, `0x945A0AcaD69629275Ff6B9681DcC56f146835d3a`, `0x88cf9e43a484Ddd5c4De738741190a98eBF50f4A`, `0xAd9Fadc22dd5C44D1e2C3aFeA80221E9978Eaebf`, `0xe19aDDD082f045038Fe66543aA2cC4DF5F7AE5A7`, `0x82e52D5b7255b26f975be4429bBc5D03FAaA6Af3`
- **Stellar verifier:** `CB4WBGF4KDX3LP74ZOKLVDB6X34ZXJZUD6OMNEJZUV6PY2XLUKBJTRQZ`, `CB2A5IF4GGUTFJ5MJVGUDK7ASYL5ZAN37U73P5FOR7F75CJYTQK742YY`, `CBPMFTRCKH6ZITTFT4MQDVLHESLR5U5MO6B2GL4DAC6YJLAUJMCUAATD`
- **Solana program:** `2FFbpHRM8QSdJREBknoaDNSmhRZZQsysrFGNZyGLwcJP`

</details>

---

## Reproducibility

```bash
npm install
npm run compile-circuit                 # circuit → ACIR + verification key
npm run preflight                       # provision keys into .env; then fund the 4 addresses
npm run deploy-testnet -- --with-token  # deploy contracts + issue pUSD + seed vaults/LPs
npm run dev                             # cockpit at http://localhost:3011
```

Deployed addresses land in `deployments/prism-assets.local.json`; live liquidity in
`deployments/liquidity-state.local.json`. Both are gitignored and preferred by the server over the
committed `*.example.json` seeds.

**Secrets hygiene:** `.env` and Solana keypair JSON files stay local and gitignored. The Stellar
deployer secret is generated at deploy time and written to `.env`; publish only public keys / program
ids, never secret keys or keypair files.

---

## Next (post-hackathon)
- Real on-chain value round-trip (live locks + live payouts) end-to-end.
- On-chain UltraHonk verification on Soroban once CAP-0074 / CAP-0075 ship — retiring the attestor.
- Direct spoke consumption of the route commitment via events.
- Movement deployment once the framework/toolchain mismatch is resolved.

## Provenance
- GitHub: `Jaydearcadian/PrismFlashZK`
- Branch: `claude/repo-codebase-review-yf54uz`
