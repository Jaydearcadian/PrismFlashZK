import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import fs from "fs";

// Define strict simulated blockchain types
interface BaseDeposit {
  nullifier: string;
  depositor: string;
  amount: number;
  payloadCommitment: string;
  locked: boolean;
  txHash?: string;
}

interface BaseClaim {
  nullifier: string;
  solver: address;
  payloadCommitment: string;
  solanaTx: string;
  movementTx: string;
  submitBlock: number;
  finalized: boolean;
  challenged: boolean;
  amount: number;
}

type address = string;

interface SolverLog {
  timestamp: string;
  type: "INFO" | "SUCCESS" | "WARN" | "ERROR" | "DAEMON";
  message: string;
}

async function startServer() {
  const app = express();
  app.use(express.json());
  const PORT = 3000;

  // --- Simulated Blockchain States ---
  const state = {
    base: {
      blockHeight: 18452030,
      deposits: {} as Record<string, BaseDeposit>,
      claims: {} as Record<string, BaseClaim>,
      isHardwareEnforced: false,
      spectrumEngineAddress: "0xTEE_78af9840392cf99a19c5fe902e0b534cf5e219da",
      balances: {
        "UserWallet": 1000.0,
        "SolverWallet": 5000.0,
        "EscrowContract": 0.0,
      } as Record<string, number>,
      history: [] as any[],
    },
    stellar: {
      ledgerSequence: 5240321,
      clearedIntents: {} as Record<string, { payloadCommitment: string; timestamp: string; maxBlockHeight: number }>,
      balances: {
        "UserWallet": 500.0,
        "SolverWallet": 10000.0,
      } as Record<string, number>,
      history: [] as any[],
    },
    solana: {
      slot: 124503210,
      vaultBalance: 25000.0,
      disbursals: [] as any[],
      balances: {
        "UserWallet": 12.5,
        "SolverWallet": 1500.0,
      } as Record<string, number>,
      history: [] as any[],
    },
    movement: {
      ledgerVersion: 85210940,
      vaultBalance: 150000.0,
      disbursals: [] as any[],
      balances: {
        "UserWallet": 250.0,
        "SolverWallet": 25000.0,
      } as Record<string, number>,
      history: [] as any[],
    }
  };

  // --- Multi-Chain Token Registry ---
  const tokens = [
    { name: "Prism USD", symbol: "pUSD", supply: 10000000, chains: ["base", "solana", "movement"], timestamp: new Date().toISOString() },
    { name: "Prism ZK Shielded Token", symbol: "pZK", supply: 5000000, chains: ["base", "stellar"], timestamp: new Date().toISOString() }
  ];

  // --- Solver Daemon Logger ---
  const solverLogs: SolverLog[] = [];
  function addSolverLog(type: "INFO" | "SUCCESS" | "WARN" | "ERROR" | "DAEMON", message: string) {
    const timestamp = new Date().toISOString().substring(11, 19);
    solverLogs.unshift({ timestamp, type, message });
    if (solverLogs.length > 50) solverLogs.pop();
    console.log(`[SolverDaemon] [${type}] ${message}`);
  }

  addSolverLog("DAEMON", "PrismFlash Solver Daemon initialized. Polling Stellar Soroban Testnet RPC...");

  // --- Simulated Chain Tickers (Every 3 seconds) ---
  setInterval(() => {
    state.base.blockHeight += 1;
    state.stellar.ledgerSequence += 1;
    state.solana.slot += 3;
    state.movement.ledgerVersion += 4;

    // Background solver checks: For optimistic claims, we can scan and see if dispute windows have closed!
    Object.keys(state.base.claims).forEach((nullifier) => {
      const claim = state.base.claims[nullifier];
      if (!claim.finalized && !claim.challenged) {
        const blocksElapsed = state.base.blockHeight - claim.submitBlock;
        if (blocksElapsed >= 150) {
          // Finalize automatic release
          claim.finalized = true;
          const deposit = state.base.deposits[nullifier];
          if (deposit) {
            deposit.locked = false;
            // Move locked funds from Escrow to Solver
            state.base.balances["EscrowContract"] -= deposit.amount;
            state.base.balances["SolverWallet"] += deposit.amount;
            addSolverLog("SUCCESS", `Dispute window closed for nullifier ${nullifier.substring(0, 10)}... Released ${deposit.amount} USDC to Solver.`);
            
            state.base.history.unshift({
              txHash: "0x" + Math.random().toString(16).substring(2, 10) + "...",
              block: state.base.blockHeight,
              type: "Finalize Claim",
              details: `Released ${deposit.amount} USDC to Solver after 150 block cooldown.`
            });
            delete state.base.deposits[nullifier];
          }
        }
      }
    });
  }, 3000);

  // --- Automated Solver Daemon Listener (Event Poller simulation) ---
  function triggerSolverRelay(nullifier: string, payloadCommitment: string, maxBlockHeight: number) {
    addSolverLog("INFO", `Detected new Event Log: [prism_attestation] on Stellar. Nullifier: ${nullifier.substring(0, 10)}...`);
    addSolverLog("INFO", "Step 1: Unpacking payload metadata & checking hash invariance...");

    // Solve Daemon validation
    const expectedCommitment = payloadCommitment;
    addSolverLog("SUCCESS", `Invariance check passed! commitment ${payloadCommitment.substring(0, 10)}... verified.`);

    addSolverLog("INFO", "Step 2: Launching concurrent target-chain payment requests (Promise.all)...");

    // We simulate concurrent target payments
    const solanaPayoutPromise = new Promise<string>((resolve) => {
      setTimeout(() => {
        const txHash = "5sSol" + Math.random().toString(36).substring(2, 15).toUpperCase();
        resolve(txHash);
      }, 800 + Math.random() * 400); // 0.8s - 1.2s delay
    });

    const movementPayoutPromise = new Promise<string>((resolve) => {
      setTimeout(() => {
        const txHash = "0xMove" + Math.random().toString(16).substring(2, 15);
        resolve(txHash);
      }, 900 + Math.random() * 500); // 0.9s - 1.4s delay
    });

    Promise.all([solanaPayoutPromise, movementPayoutPromise]).then(([solTx, moveTx]) => {
      addSolverLog("SUCCESS", `Concurrent Fill Complete! Solana Tx: ${solTx.substring(0, 10)}..., Move Tx: ${moveTx.substring(0, 10)}...`);
      addSolverLog("INFO", "Step 3: Submitting claim settlement to Base Solidity contract...");

      // Submit claim to Base Escrow
      const claimBlock = state.base.blockHeight;
      const deposit = state.base.deposits[nullifier];
      
      if (!deposit) {
        addSolverLog("ERROR", `Claim rejected: Deposit with nullifier ${nullifier.substring(0, 10)} not found in Base Escrow.`);
        return;
      }

      const claim: BaseClaim = {
        nullifier,
        solver: state.base.isHardwareEnforced ? state.base.spectrumEngineAddress : "SolverWallet",
        payloadCommitment,
        solanaTx: solTx,
        movementTx: moveTx,
        submitBlock: claimBlock,
        finalized: false,
        challenged: false,
        amount: deposit.amount
      };

      state.base.claims[nullifier] = claim;

      state.base.history.unshift({
        txHash: "0x" + Math.random().toString(16).substring(2, 10) + "...",
        block: claimBlock,
        type: "Claim Settlement",
        details: `Solver submitted proofs of Solana/Movement payouts.`
      });

      if (state.base.isHardwareEnforced) {
        // Instant settlement!
        claim.finalized = true;
        deposit.locked = false;
        state.base.balances["EscrowContract"] -= deposit.amount;
        state.base.balances["SolverWallet"] += deposit.amount;
        addSolverLog("SUCCESS", "TEE Hardware Enforcement Active! Verified Enclave Signature. Dispute window bypassed. Settled instantly!");
        delete state.base.deposits[nullifier];
      } else {
        addSolverLog("WARN", `Claim locked in Optimistic Dispute Window (150 blocks remaining, ~30 mins).`);
      }
    });
  }

  // --- API Routes ---

  // Registers or updates a connected wallet address in the server state
  app.post("/api/set-wallet-address", (req, res) => {
    const { chain, address, balance } = req.body;
    if (!chain || !address) {
      return res.status(400).json({ error: "Missing chain or address parameter" });
    }

    const cleanAddress = address.trim();
    if (chain === "base") {
      // Set balance for real address, clean up old "UserWallet" key
      state.base.balances[cleanAddress] = balance !== undefined ? Number(balance) : (state.base.balances[cleanAddress] || 1000.0);
      delete state.base.balances["UserWallet"];
    } else if (chain === "stellar") {
      state.stellar.balances[cleanAddress] = balance !== undefined ? Number(balance) : (state.stellar.balances[cleanAddress] || 500.0);
      delete state.stellar.balances["UserWallet"];
    } else if (chain === "solana") {
      state.solana.balances[cleanAddress] = balance !== undefined ? Number(balance) : (state.solana.balances[cleanAddress] || 12.5);
      delete state.solana.balances["UserWallet"];
    } else if (chain === "movement") {
      state.movement.balances[cleanAddress] = balance !== undefined ? Number(balance) : (state.movement.balances[cleanAddress] || 250.0);
      delete state.movement.balances["UserWallet"];
    }

    addSolverLog("DAEMON", `Connected Wallet updated: [${chain.toUpperCase()}] ${cleanAddress.substring(0, 8)}... Balance: ${balance !== undefined ? balance : "Default"}`);
    res.json({ success: true, balances: state[chain as "base" | "stellar" | "solana" | "movement"].balances });
  });

  // Faucet Endpoint to fund wallets (supports both standard and real connected wallets)
  app.post("/api/mint", (req, res) => {
    const { chain, amount, address } = req.body;
    const targetAddress = address ? address.trim() : "UserWallet";

    if (chain === "base") {
      state.base.balances[targetAddress] = (state.base.balances[targetAddress] || 0) + amount;
    } else if (chain === "stellar") {
      state.stellar.balances[targetAddress] = (state.stellar.balances[targetAddress] || 0) + amount;
    } else if (chain === "solana") {
      state.solana.balances[targetAddress] = (state.solana.balances[targetAddress] || 0) + amount;
    } else if (chain === "movement") {
      state.movement.balances[targetAddress] = (state.movement.balances[targetAddress] || 0) + amount;
    }

    res.json({
      success: true,
      balances: {
        base: state.base.balances[targetAddress] || 0,
        stellar: state.stellar.balances[targetAddress] || 0,
        solana: state.solana.balances[targetAddress] || 0,
        movement: state.movement.balances[targetAddress] || 0,
      }
    });
  });

  // Retrieves all active simulated chain data
  app.get("/api/chains", (req, res) => {
    res.json({
      base: {
        blockHeight: state.base.blockHeight,
        deposits: Object.values(state.base.deposits),
        claims: Object.values(state.base.claims),
        isHardwareEnforced: state.base.isHardwareEnforced,
        spectrumEngineAddress: state.base.spectrumEngineAddress,
        balances: state.base.balances,
        history: state.base.history,
      },
      stellar: {
        ledgerSequence: state.stellar.ledgerSequence,
        clearedIntents: Object.values(state.stellar.clearedIntents),
        balances: state.stellar.balances,
        history: state.stellar.history,
      },
      solana: {
        slot: state.solana.slot,
        balances: state.solana.balances,
        history: state.solana.history,
      },
      movement: {
        ledgerVersion: state.movement.ledgerVersion,
        balances: state.movement.balances,
        history: state.movement.history,
      }
    });
  });

  // Simulates locking USDC on Base Solidity Escrow
  app.post("/api/swap/lock", (req, res) => {
    const { nullifier, payloadCommitment, amount, intent, address, txHash } = req.body;
    const targetAddress = address ? address.trim() : "UserWallet";
    
    const userBalance = state.base.balances[targetAddress] || 0;
    if (userBalance < amount) {
      return res.status(400).json({ error: `Insufficient Base USDC balance (Has ${userBalance} tUSDC, requires ${amount} tUSDC)` });
    }

    // Deduct user balance, deposit into EscrowContract
    state.base.balances[targetAddress] -= amount;
    state.base.balances["EscrowContract"] += amount;

    const deposit: BaseDeposit = {
      nullifier,
      depositor: targetAddress,
      amount,
      payloadCommitment,
      locked: true,
      txHash: txHash || ("0x" + Math.random().toString(16).substring(2, 10) + "...")
    };

    state.base.deposits[nullifier] = deposit;

    state.base.history.unshift({
      txHash: deposit.txHash,
      block: state.base.blockHeight,
      type: "Lock USDC",
      details: `Escrowed ${amount} USDC for address ${targetAddress.substring(0, 8)}... with commitments: ${payloadCommitment.substring(0, 10)}...`
    });

    addSolverLog("INFO", `Origin Lock Secured on Base: ${amount} USDC locked from ${targetAddress.substring(0, 8)}... Nullifier: ${nullifier.substring(0, 10)}...`);

    res.json({ success: true, deposit });
  });

  // Simulates verifying and clearing on Stellar Soroban
  app.post("/api/swap/clear", (req, res) => {
    const { nullifier, payloadCommitment, maxBlockHeight, proof } = req.body;

    const currentLedger = state.stellar.ledgerSequence;

    if (currentLedger > maxBlockHeight) {
      return res.status(400).json({ error: "Stellar Error: Transaction window has expired." });
    }

    if (state.stellar.clearedIntents[nullifier]) {
      return res.status(400).json({ error: "Stellar Error: Nullifier already spent." });
    }

    // Record intent clearing
    state.stellar.clearedIntents[nullifier] = {
      payloadCommitment,
      timestamp: new Date().toISOString(),
      maxBlockHeight
    };

    state.stellar.history.unshift({
      txHash: "0x" + Math.random().toString(16).substring(2, 10) + "...",
      block: currentLedger,
      type: "Verify Intent",
      details: `Soroban verified UltraHonk proof. Emitted IntentCleared for nullifier ${nullifier.substring(0, 10)}...`
    });

    // Fire the solver daemon hook
    triggerSolverRelay(nullifier, payloadCommitment, maxBlockHeight);

    res.json({ success: true, currentLedger });
  });

  // Triggers finalization manually if the 150 blocks have passed
  app.post("/api/swap/finalize", (req, res) => {
    const { nullifier } = req.body;
    const claim = state.base.claims[nullifier];
    const deposit = state.base.deposits[nullifier];

    if (!claim) return res.status(400).json({ error: "Claim not found" });
    if (state.base.blockHeight < claim.submitBlock + 150) {
      return res.status(400).json({ error: "Dispute window still open" });
    }

    claim.finalized = true;
    if (deposit) {
      deposit.locked = false;
      state.base.balances["EscrowContract"] -= deposit.amount;
      state.base.balances["SolverWallet"] += deposit.amount;
      delete state.base.deposits[nullifier];
    }

    res.json({ success: true });
  });

  // Triggers fraud challenge within 150 blocks
  app.post("/api/swap/challenge", (req, res) => {
    const { nullifier, reason } = req.body;
    const claim = state.base.claims[nullifier];
    
    if (!claim) return res.status(400).json({ error: "Claim not found" });
    if (claim.finalized) return res.status(400).json({ error: "Claim already finalized" });

    claim.challenged = true;
    addSolverLog("ERROR", `!!! FRAUD DISPUTE FILED on Base for nullifier ${nullifier.substring(0, 10)}... Reason: ${reason}`);

    state.base.history.unshift({
      txHash: "0x" + Math.random().toString(16).substring(2, 10) + "...",
      block: state.base.blockHeight,
      type: "Fraud Challenge",
      details: `Watchdog challenged claim: ${reason}`
    });

    res.json({ success: true, claim });
  });

  // Toggles hardware enforcement
  app.post("/api/upgrade-hook", (req, res) => {
    const { isHardwareEnforced } = req.body;
    state.base.isHardwareEnforced = isHardwareEnforced;
    addSolverLog("DAEMON", `Governance Upgrade Toggled: isHardwareEnforced set to ${isHardwareEnforced}.`);
    res.json({ success: true, isHardwareEnforced });
  });

  // Retrieve token registry
  app.get("/api/tokens", (req, res) => {
    res.json(tokens);
  });

  // Create a new token across chains using clearinghouse concept
  app.post("/api/tokens", (req, res) => {
    const { name, symbol, supply, chains } = req.body;
    if (!name || !symbol || !supply || !chains || !Array.isArray(chains)) {
      return res.status(400).json({ error: "Missing required token parameters: name, symbol, supply, chains" });
    }

    const newToken = {
      name: name.trim(),
      symbol: symbol.trim().toUpperCase(),
      supply: Number(supply),
      chains: chains.map(c => c.toLowerCase()),
      timestamp: new Date().toISOString()
    };

    tokens.push(newToken);
    addSolverLog("SUCCESS", `Multi-Chain Clearinghouse Token ${newToken.symbol} Deployed! Supply: ${newToken.supply.toLocaleString()} across: ${newToken.chains.join(", ")}`);
    res.json({ success: true, tokens });
  });

  // Retrieve daemon logs
  app.get("/api/solver-logs", (req, res) => {
    res.json(solverLogs);
  });

  // Submit logs from off-chain daemon controller
  app.post("/api/solver-logs/submit", (req, res) => {
    const { type, message } = req.body;
    if (type && message) {
      addSolverLog(type, message);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Missing type or message" });
    }
  });

  // Serves contract codes for direct cockpit inspection
  app.get("/api/contract-code", (req, res) => {
    const { type } = req.query;
    let filePath = "";

    if (type === "noir") filePath = "circuits/src/main.nr";
    else if (type === "soroban") filePath = "contracts/soroban/src/lib.rs";
    else if (type === "solidity") filePath = "contracts/solidity/BaseEscrow.sol";
    else if (type === "solana") filePath = "contracts/solana/programs/solana_vault/src/lib.rs";
    else if (type === "movement") filePath = "contracts/move/sources/movement_escrow.move";
    else if (type === "daemon") filePath = "solver_daemon_controller.ts";

    const fullPath = path.join(process.cwd(), filePath);
    if (filePath && fs.existsSync(fullPath)) {
      const code = fs.readFileSync(fullPath, "utf-8");
      res.json({ code });
    } else {
      res.json({ code: `// Code not found at relative path: ${filePath}\n// Ensure the contract file exists in your workspace directory.` });
    }
  });

  // Vite development integration or static serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null,
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`PrismFlash running on http://localhost:${PORT}`);
  });
}

startServer();
