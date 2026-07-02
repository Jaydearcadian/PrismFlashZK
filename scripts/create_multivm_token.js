#!/usr/bin/env node
/**
 * Real multi-VM token creation — issues one token on all four chains for real
 * (Base ERC20, Solana SPL mint, Movement/Aptos managed coin, Stellar classic asset),
 * then instantiates a fresh master_state_registry Soroban contract instance to act as
 * this token's canonical "One State Registry" balance sheet.
 *
 * This is NOT the simulated create_tokens.js (kept as-is for the dashboard demo mode).
 * This script makes real signed transactions against real testnets and requires:
 *   - .env populated by generate_wallets.js (real funded EVM/Solana/Stellar/Movement keys)
 *   - contracts/soroban's prism_verifier deployed and master_state_registry WASM uploaded
 *     (see DEPLOYMENT_GUIDE.md section 4) — pass the WASM hash via --registry-wasm-hash
 *   - contracts/move published on-chain already (deploy_all.sh step 4), since this only
 *     *calls* managed_coin::initialize/register/mint, it doesn't publish the module itself
 *
 * Usage:
 *   node scripts/create_multivm_token.js --name "Prism USD" --symbol pUSD --supply 1000000 \
 *     --registry-wasm-hash <hash from `stellar contract upload` in DEPLOYMENT_GUIDE.md step 4D>
 *
 * Nothing here has been executed against a live network from this environment — it was
 * written and reasoned about against verified real SDK shapes (checked in this session
 * via `node -e` against the actually-installed package versions), but the deploy path
 * itself needs funded testnet keys to actually run, which this sandbox doesn't have.
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";
import { fileURLToPath } from "url";
import { Wallet, ContractFactory, JsonRpcProvider } from "ethers";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import { Keypair as StellarKeypair, Horizon, Asset, Operation, TransactionBuilder, Networks, BASE_FEE } from "@stellar/stellar-sdk";
import { Account as MovementAccount, Ed25519PrivateKey, Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");

const BASE_RPC = process.env.BASE_RPC_URL || "https://sepolia.base.org";
const SOLANA_RPC = process.env.SOLANA_RPC_URL || "https://api.devnet.solana.com";
const MOVEMENT_RPC = process.env.MOVEMENT_RPC_URL || "https://aptos.testnet.porto.movementlabs.xyz/v1";
const STELLAR_HORIZON = process.env.STELLAR_HORIZON_URL || "https://horizon-testnet.stellar.org";
const STELLAR_FRIENDBOT = "https://friendbot.stellar.org";

function parseArgs(argv) {
  const args = { supply: "1000000" };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--name") args.name = argv[++i];
    else if (a === "--symbol") args.symbol = argv[++i];
    else if (a === "--supply") args.supply = argv[++i];
    else if (a === "--registry-wasm-hash") args.registryWasmHash = argv[++i];
  }
  if (!args.name || !args.symbol || !args.registryWasmHash) {
    console.error(
      'Usage: node scripts/create_multivm_token.js --name "Prism USD" --symbol pUSD --supply 1000000 --registry-wasm-hash <hash>'
    );
    process.exit(1);
  }
  return args;
}

function requireEnv(key) {
  const value = process.env[key];
  if (!value) throw new Error(`Missing ${key} in .env — run generate_wallets.js first`);
  return value;
}

async function fundStellarIfNeeded(publicKey) {
  try {
    await fetch(`${STELLAR_FRIENDBOT}/?addr=${publicKey}`);
  } catch {
    // account may already be funded; friendbot failures here are non-fatal
  }
}

// --- 1. Base (Solidity ERC20) ---
async function deployBaseToken(name, symbol, supplyWei, recipient) {
  console.log("\n[1/4] Deploying PrismToken.sol to Base Sepolia...");
  const solidityDir = path.join(REPO_ROOT, "contracts", "solidity");
  execFileSync("forge", ["build"], { cwd: solidityDir, stdio: "inherit" });

  const buildArtifact = JSON.parse(
    fs.readFileSync(path.join(solidityDir, "out", "PrismToken.sol", "PrismToken.json"), "utf8")
  );
  const provider = new JsonRpcProvider(BASE_RPC);
  const wallet = new Wallet(requireEnv("EVM_PRIVATE_KEY"), provider);
  const factory = new ContractFactory(buildArtifact.abi, buildArtifact.bytecode.object, wallet);
  const contract = await factory.deploy(name, symbol, supplyWei, recipient);
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log(`  └─ Base token deployed: ${address}`);
  return address;
}

// --- 2. Solana (SPL mint) ---
async function deploySolanaToken(supplyBaseUnits, decimals) {
  console.log("\n[2/4] Minting SPL token on Solana Devnet...");
  const connection = new Connection(SOLANA_RPC, "confirmed");
  const secretKeyArray = JSON.parse(requireEnv("SOLANA_PRIVATE_KEY"));
  const payer = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));

  const mint = await createMint(connection, payer, payer.publicKey, null, decimals);
  const tokenAccount = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);
  await mintTo(connection, payer, mint, tokenAccount.address, payer, supplyBaseUnits);

  console.log(`  └─ Solana mint: ${mint.toBase58()}, vault token account: ${tokenAccount.address.toBase58()}`);
  return { mint: mint.toBase58(), vaultTokenAccount: tokenAccount.address.toBase58() };
}

// --- 3. Movement (Aptos-Move managed coin over the prism_pusd marker module) ---
async function deployMovementToken(symbol, decimals, supplyBaseUnits) {
  console.log("\n[3/4] Initializing + minting managed coin on Movement Porto...");
  const account = MovementAccount.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(requireEnv("MOVEMENT_PRIVATE_KEY")),
  });
  const aptosConfig = new AptosConfig({ network: Network.CUSTOM, fullnode: MOVEMENT_RPC });
  const aptos = new Aptos(aptosConfig);
  const prismAddr = account.accountAddress.toString();
  const coinType = `${prismAddr}::prism_pusd::PrismPUSD`;

  async function runEntry(fn, typeArguments, functionArguments) {
    const transaction = await aptos.transaction.build.simple({
      sender: account.accountAddress,
      data: { function: fn, typeArguments, functionArguments },
    });
    const pending = await aptos.signAndSubmitTransaction({ signer: account, transaction });
    await aptos.waitForTransaction({ transactionHash: pending.hash });
    return pending.hash;
  }

  // Standard Aptos framework coin-issuance sequence (0x1::managed_coin, 0x1::coin) —
  // requires contracts/move (including prism_pusd.move) to already be published under
  // this same account, so PrismPUSD is a resolvable type.
  await runEntry("0x1::managed_coin::initialize", [coinType], [Array.from(Buffer.from(symbol)), Array.from(Buffer.from(symbol)), decimals, true]);
  await runEntry("0x1::coin::register", [coinType], []);
  const mintTx = await runEntry("0x1::managed_coin::mint", [coinType], [prismAddr, supplyBaseUnits.toString()]);

  console.log(`  └─ Movement coin type: ${coinType}, mint tx: ${mintTx}`);
  return { coinModule: coinType, mintTx };
}

// --- 4. Stellar (classic asset issuance) ---
async function issueStellarAsset(symbol, supply) {
  console.log("\n[4/4] Issuing Stellar classic asset...");
  const server = new Horizon.Server(STELLAR_HORIZON);
  const issuer = StellarKeypair.fromSecret(requireEnv("STELLAR_PRIVATE_KEY"));
  const distributor = StellarKeypair.random();

  await fundStellarIfNeeded(distributor.publicKey());
  const asset = new Asset(symbol, issuer.publicKey());

  const distAccount = await server.loadAccount(distributor.publicKey());
  const trustTx = new TransactionBuilder(distAccount, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.changeTrust({ asset, limit: supply.toString() }))
    .setTimeout(30)
    .build();
  trustTx.sign(distributor);
  await server.submitTransaction(trustTx);

  const issuerAccount = await server.loadAccount(issuer.publicKey());
  const paymentTx = new TransactionBuilder(issuerAccount, { fee: BASE_FEE, networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.payment({ destination: distributor.publicKey(), asset, amount: supply.toString() }))
    .setTimeout(30)
    .build();
  paymentTx.sign(issuer);
  await server.submitTransaction(paymentTx);

  console.log(`  └─ Stellar asset ${symbol}:${issuer.publicKey()}, distributor: ${distributor.publicKey()}`);
  return { issuer: issuer.publicKey(), distributor: distributor.publicKey() };
}

// --- 5. MasterStateRegistry instance (the "One State Registry" for this token) ---
function deployRegistryInstance(registryWasmHash, chains, weights, initialBalances) {
  console.log("\n[5/5] Instantiating a fresh master_state_registry for this token...");
  const sorobanDir = path.join(REPO_ROOT, "contracts", "soroban");

  let validatorSecret = process.env.LIQUIDITY_VALIDATOR_PRIVATE_KEY;
  let validatorKeypair;
  if (validatorSecret) {
    validatorKeypair = StellarKeypair.fromSecret(validatorSecret);
  } else {
    // Separate from prism_verifier's attestor key by design — see Stage D of the plan:
    // this key only ever certifies "an on-chain balance changed", never proof validity.
    validatorKeypair = StellarKeypair.random();
    console.log(`  Generated new LIQUIDITY_VALIDATOR_PRIVATE_KEY — save this to .env: ${validatorKeypair.secret()}`);
  }
  // Soroban ed25519 keys are raw 32-byte public keys, not StrKey — decode via rawPublicKey()
  const validatorPublicKeyHex = validatorKeypair.rawPublicKey().toString("hex");

  const deployOut = execFileSync(
    "stellar",
    ["contract", "deploy", "--wasm-hash", registryWasmHash, "--source", "deployer", "--network", "testnet"],
    { cwd: sorobanDir, encoding: "utf8" }
  ).trim();
  const registryContractId = deployOut.split("\n").pop().trim();

  execFileSync(
    "stellar",
    [
      "contract", "invoke", "--id", registryContractId, "--source", "deployer", "--network", "testnet",
      "--", "initialize",
      "--validator_key", validatorPublicKeyHex,
      "--initial_price", "1000000",
      "--slope", "1",
      "--chains", JSON.stringify(chains),
      "--weights", JSON.stringify(weights),
      "--initial_balances", JSON.stringify(initialBalances.map(String)),
    ],
    { cwd: sorobanDir, stdio: "inherit" }
  );

  console.log(`  └─ master_state_registry instance: ${registryContractId}`);
  return registryContractId;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const supply = Number(args.supply);
  const decimals = 6; // matches the on-chain balances used across the schema in deployments/
  const perChainSupply = Math.floor(supply / 4);

  console.log(`Creating multi-VM token "${args.name}" (${args.symbol}), supply ${supply} split across 4 chains...`);

  const evmWallet = new Wallet(requireEnv("EVM_PRIVATE_KEY"));
  const baseToken = await deployBaseToken(args.name, args.symbol, BigInt(perChainSupply) * 10n ** BigInt(decimals), evmWallet.address);
  const solana = await deploySolanaToken(perChainSupply * 10 ** decimals, decimals);
  const movement = await deployMovementToken(args.symbol, decimals, perChainSupply * 10 ** decimals);
  const stellar = await issueStellarAsset(args.symbol, perChainSupply);

  const registryContractId = deployRegistryInstance(
    args.registryWasmHash,
    ["base", "solana", "movement", "stellar"],
    [2500, 2500, 2500, 2500],
    [perChainSupply, perChainSupply, perChainSupply, perChainSupply]
  );

  const assetsPath = path.join(REPO_ROOT, "deployments", "prism-assets.local.json");
  const examplePath = path.join(REPO_ROOT, "deployments", "prism-assets.example.json");
  const assets = JSON.parse(fs.readFileSync(fs.existsSync(assetsPath) ? assetsPath : examplePath, "utf8"));
  delete assets._comment;
  assets.stellarRegistry = registryContractId;
  assets.chains["base-sepolia"].contracts.token = baseToken;
  assets.chains["solana-devnet"].contracts.mint = solana.mint;
  assets.chains["solana-devnet"].contracts.vaultTokenAccount = solana.vaultTokenAccount;
  assets.chains["movement-porto"].contracts.coinModule = movement.coinModule;
  assets.chains.stellar.contracts.clearinghouse = registryContractId;
  assets.chains.stellar.contracts.issuer = stellar.issuer;
  assets.chains.stellar.contracts.distributor = stellar.distributor;
  fs.mkdirSync(path.dirname(assetsPath), { recursive: true });
  fs.writeFileSync(assetsPath, JSON.stringify(assets, null, 2));

  const liquidityPath = path.join(REPO_ROOT, "deployments", "liquidity-state.local.json");
  const liquidityExamplePath = path.join(REPO_ROOT, "deployments", "liquidity-state.example.json");
  const liquidity = JSON.parse(fs.readFileSync(fs.existsSync(liquidityPath) ? liquidityPath : liquidityExamplePath, "utf8"));
  delete liquidity._comment;
  liquidity.vaults["solana-vault-pda"].available = perChainSupply;
  liquidity.vaults["movement-vault"].available = perChainSupply;
  liquidity.updatedAt = new Date().toISOString();
  fs.writeFileSync(liquidityPath, JSON.stringify(liquidity, null, 2));

  console.log("\nDone. Wrote deployments/prism-assets.local.json and deployments/liquidity-state.local.json.");
}

main().catch((err) => {
  console.error("FATAL:", err.message || err);
  process.exit(1);
});
