import React from "react";
import { Sliders, Zap, Globe, AlertTriangle } from "lucide-react";
import { IntentForm } from "./IntentForm";
import { SettlementRegistry } from "./SettlementRegistry";

interface IntentTabProps {
  baseAmount: string;
  setBaseAmount: (v: string) => void;
  solanaAmount: string;
  setSolanaAmount: (v: string) => void;
  solanaRecipient: string;
  setSolanaRecipient: (v: string) => void;
  movementAmount: string;
  setMovementAmount: (v: string) => void;
  movementRecipient: string;
  setMovementRecipient: (v: string) => void;
  secretKey: string;
  setSecretKey: (v: string) => void;
  nonce: string;
  setNonce: (v: string) => void;
  errorMessage: string | null;
  isLiveMode: boolean;
  liveStep: string;
  handleExecuteSwapLive: () => void;
  liveError: { title: string; message: string; instruction: string } | null;
  setLiveError: (v: any) => void;
  setLiveStep: (v: string) => void;
  handleLiveStepWalletCheck: () => void;
  handleLiveStepSignLock: () => void;
  handleLiveStepNoirProve: () => void;
  handleLiveStepSignClear: () => void;
  liveLogs: string[];
  liveContracts: any;
  estimatedBaseGasEth: string;
  estimatedGasUsd: string;
  swapStep: string;
  handleExecuteSwap: () => void;
  chains: any;
  isHardwareEnforced: boolean;
  handleChallenge: (id: string) => void;
  handleFinalize: (id: string) => void;
}

export const IntentTab: React.FC<IntentTabProps> = ({
  baseAmount,
  setBaseAmount,
  solanaAmount,
  setSolanaAmount,
  solanaRecipient,
  setSolanaRecipient,
  movementAmount,
  setMovementAmount,
  movementRecipient,
  setMovementRecipient,
  secretKey,
  setSecretKey,
  nonce,
  setNonce,
  errorMessage,
  isLiveMode,
  liveStep,
  handleExecuteSwapLive,
  liveError,
  setLiveError,
  setLiveStep,
  handleLiveStepWalletCheck,
  handleLiveStepSignLock,
  handleLiveStepNoirProve,
  handleLiveStepSignClear,
  liveLogs,
  liveContracts,
  estimatedBaseGasEth,
  estimatedGasUsd,
  swapStep,
  handleExecuteSwap,
  chains,
  isHardwareEnforced,
  handleChallenge,
  handleFinalize,
}) => {
  return (
    <div className="flex flex-col divide-y divide-[#E5E5E5] dark:divide-zinc-800 bg-white dark:bg-zinc-900">
      {/* Intent Header */}
      <div className="p-4 bg-[#FAFAFA] dark:bg-zinc-950 flex items-center justify-between border-b border-[#E5E5E5] dark:border-zinc-800">
        <div>
          <h2 className="font-sans font-bold text-xs text-black dark:text-white uppercase tracking-tighter">CROSS-CHAIN INTENT SETTLEMENT GATEWAY</h2>
          <p className="text-[9px] text-[#666666] dark:text-zinc-400 font-mono uppercase tracking-tight">Formulate, prove, and dispatch multi-VM settlement transactions</p>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white dark:bg-zinc-900 transition-colors">
        {/* Form Inputs */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-[10px] font-bold font-sans uppercase text-black dark:text-white border-b pb-1 dark:border-zinc-800 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-[#002FA7] dark:text-cyan-400" /> Specify Asset Quantities & Recipients
          </h3>
          <IntentForm
            baseAmount={baseAmount}
            setBaseAmount={setBaseAmount}
            solanaAmount={solanaAmount}
            setSolanaAmount={setSolanaAmount}
            solanaRecipient={solanaRecipient}
            setSolanaRecipient={setSolanaRecipient}
            movementAmount={movementAmount}
            setMovementAmount={setMovementAmount}
            movementRecipient={movementRecipient}
            setMovementRecipient={setMovementRecipient}
            secretKey={secretKey}
            setSecretKey={setSecretKey}
            nonce={nonce}
            setNonce={setNonce}
          />
        </div>

        {/* Pipeline Controls */}
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-[10px] font-bold font-sans uppercase text-black dark:text-white border-b pb-1 dark:border-zinc-800 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#002FA7] dark:text-cyan-400" /> Dispatch Execution Pipeline
          </h3>
          
          <div className="space-y-4 bg-[#FAFAFA] dark:bg-zinc-950/40 border border-[#E5E5E5] dark:border-zinc-800 p-4">
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 p-2.5 text-[10px] font-mono flex items-center gap-2 rounded-none">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 animate-bounce" />
                <span>{errorMessage}</span>
              </div>
            )}

            {isLiveMode ? (
              /* LIVE ON-CHAIN GATEWAY */
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-[#E5E5E5] dark:border-zinc-800 pb-2">
                  <span className="font-mono text-[9px] font-bold text-amber-700 dark:text-amber-500 flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" /> LIVE ON-CHAIN PIPELINE
                  </span>
                  <span className="px-1.5 py-0.5 bg-amber-600/10 text-amber-600 border border-amber-600/20 font-bold uppercase text-[8px]">
                    Step: {liveStep === "idle" ? "READY" : liveStep.toUpperCase()}
                  </span>
                </div>

                {liveStep === "idle" ? (
                  <div className="space-y-2.5">
                    <p className="text-[9.5px] text-[#666666] dark:text-zinc-400 uppercase leading-relaxed font-mono">
                      Operating in <span className="text-amber-700 dark:text-amber-400 font-bold">Live Testnet Mode</span>. This will request real wallet approvals (Metamask/Freighter), compile local witness parameters, and submit verified transactions.
                    </p>
                    <button
                      onClick={handleExecuteSwapLive}
                      className="w-full py-2.5 px-3.5 bg-amber-600 hover:bg-amber-700 text-white font-sans text-xs font-bold uppercase tracking-wide flex items-center justify-center gap-2 border border-amber-600 cursor-pointer transition-colors"
                    >
                      <Zap className="w-4 h-4 text-white animate-pulse" />
                      Initialize Live Cross-Chain Swap
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Step progress tracker bar */}
                    <div className="grid grid-cols-5 gap-1 text-center text-[7.5px] font-bold font-mono">
                      <div className={`p-1 border ${liveStep === "wallet_check" ? "bg-amber-600 text-white border-amber-600" : "bg-[#FAFAFA] dark:bg-zinc-800 text-zinc-400 border-[#E5E5E5] dark:border-zinc-700"}`}>
                        1. WALLETS
                      </div>
                      <div className={`p-1 border ${liveStep === "sign_lock" ? "bg-amber-600 text-white border-amber-600" : "bg-[#FAFAFA] dark:bg-zinc-800 text-zinc-400 border-[#E5E5E5] dark:border-zinc-700"}`}>
                        2. LOCK
                      </div>
                      <div className={`p-1 border ${liveStep === "noir_prove" ? "bg-amber-600 text-white border-amber-600" : "bg-[#FAFAFA] dark:bg-zinc-800 text-zinc-400 border-[#E5E5E5] dark:border-zinc-700"}`}>
                        3. PROVE
                      </div>
                      <div className={`p-1 border ${liveStep === "sign_clear" ? "bg-amber-600 text-white border-amber-600" : "bg-[#FAFAFA] dark:bg-zinc-800 text-zinc-400 border-[#E5E5E5] dark:border-zinc-700"}`}>
                        4. CLEAR
                      </div>
                      <div className={`p-1 border ${liveStep === "finalized" ? "bg-emerald-600 text-white border-emerald-600" : "bg-[#FAFAFA] dark:bg-zinc-800 text-zinc-400 border-[#E5E5E5] dark:border-zinc-700"}`}>
                        5. COMPLETED
                      </div>
                    </div>

                    {liveError ? (
                      <div className="border border-red-500/40 bg-red-500/5 p-3 space-y-2 text-[9.5px] font-mono">
                        <div className="flex items-center gap-1.5 font-bold text-red-600 uppercase">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 animate-bounce" />
                          <span>{liveError.title}</span>
                        </div>
                        <p className="text-[9px] text-[#555555] dark:text-zinc-300 leading-relaxed font-sans">{liveError.message}</p>
                        <div className="bg-red-50 dark:bg-red-950/20 border-l-2 border-red-500 p-2 text-red-900 dark:text-red-300 space-y-0.5 font-sans">
                          <strong className="block text-[8px] uppercase tracking-wider text-red-800 dark:text-red-400 font-bold">REQUIRED ACTION:</strong>
                          <p className="text-[9px] leading-relaxed">{liveError.instruction}</p>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button
                            onClick={() => {
                              setLiveError(null);
                              if (liveStep === "wallet_check") handleLiveStepWalletCheck();
                              else if (liveStep === "sign_lock") handleLiveStepSignLock();
                              else if (liveStep === "sign_clear") handleLiveStepSignClear();
                            }}
                            className="flex-1 py-1.5 bg-red-600 hover:bg-red-700 text-white font-sans text-[9px] font-bold uppercase rounded-none cursor-pointer border border-red-600"
                          >
                            Retry Operation
                          </button>
                          <button
                            onClick={() => {
                              setLiveError(null);
                              setLiveStep("idle");
                            }}
                            className="py-1.5 px-3 border border-[#E5E5E5] dark:border-zinc-800 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-black dark:text-white font-sans text-[9px] font-bold uppercase rounded-none cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-[#E5E5E5] dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 space-y-2.5 font-mono text-[9.5px]">
                        {liveStep === "wallet_check" && (
                          <div className="space-y-1.5">
                            <span className="font-bold text-black dark:text-white uppercase text-[9px] block">Step 1: Check Wallet Connectors</span>
                            <p className="text-[9px] text-zinc-500 leading-relaxed">
                              Checking web browser extensions (EVM MetaMask/Coinbase, Stellar Freighter, Solana Phantom, Movement Sui-based).
                            </p>
                            <button
                              onClick={handleLiveStepWalletCheck}
                              className="w-full py-1.5 bg-black dark:bg-cyan-500 hover:bg-zinc-900 dark:hover:bg-cyan-400 text-white dark:text-black font-bold uppercase text-[9px] cursor-pointer"
                            >
                              Scan Extensions & Proceed
                            </button>
                          </div>
                        )}

                        {liveStep === "sign_lock" && (
                          <div className="space-y-1.5">
                            <span className="font-bold text-black dark:text-white uppercase text-[9px] block">Step 2: Sign Base Escrow lock</span>
                            <div className="text-[8.5px] space-y-0.5 text-zinc-500 bg-zinc-50 dark:bg-zinc-900 p-2 border dark:border-zinc-800">
                              <div><strong className="text-black dark:text-zinc-300">Contract:</strong> {liveContracts.baseEscrow}</div>
                              <div><strong className="text-black dark:text-zinc-300">Locking:</strong> {baseAmount} USDC</div>
                              <div><strong className="text-black dark:text-zinc-300">Est. Fee:</strong> {estimatedBaseGasEth} ETH</div>
                            </div>
                            <button
                              onClick={handleLiveStepSignLock}
                              className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase text-[9px] cursor-pointer"
                            >
                              Sign & Broadcast Lock
                            </button>
                          </div>
                        )}

                        {liveStep === "noir_prove" && (
                          <div className="space-y-1.5">
                            <span className="font-bold text-black dark:text-white uppercase text-[9px] block">Step 3: ZK Witness Compilation</span>
                            <p className="text-[9px] text-zinc-500 leading-relaxed">
                              Compiling UltraHonk zero-knowledge proof. Translating private parameters securely.
                            </p>
                            <button
                              onClick={handleLiveStepNoirProve}
                              className="w-full py-1.5 bg-black dark:bg-zinc-800 hover:bg-zinc-900 text-white font-bold uppercase text-[9px] cursor-pointer"
                            >
                              Run client-side prover (1,024 bytes)
                            </button>
                          </div>
                        )}

                        {liveStep === "sign_clear" && (
                          <div className="space-y-1.5">
                            <span className="font-bold text-black dark:text-white uppercase text-[9px] block">Step 4: Prove Clearance on Soroban</span>
                            <div className="text-[8.5px] space-y-0.5 text-zinc-500 bg-zinc-50 dark:bg-zinc-900 p-2 border dark:border-zinc-800">
                              <div><strong className="text-black dark:text-zinc-300">Clearinghouse:</strong> {liveContracts.stellarClearinghouse}</div>
                              <div><strong className="text-black dark:text-zinc-300">ZK Cryptography:</strong> UltraHonk Proof (BN254 curve)</div>
                            </div>
                            <button
                              onClick={handleLiveStepSignClear}
                              className="w-full py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold uppercase text-[9px] cursor-pointer"
                            >
                              Submit ZK Proof to Stellar Soroban
                            </button>
                          </div>
                        )}

                        {liveStep === "finalized" && (
                          <div className="py-1 text-center space-y-1">
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 uppercase text-[10px] block animate-pulse">✓ CROSS-CHAIN ROUTING FINALIZED</span>
                            <p className="text-[9px] text-[#666666] dark:text-zinc-400">Assets cleared and disbursed dynamically.</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Live step logs */}
                    <div className="bg-black text-emerald-400 p-2 font-mono text-[8px] h-[75px] overflow-y-auto border border-zinc-800 select-all rounded-none leading-normal">
                      {liveLogs.map((log, i) => (
                        <div key={i} className="truncate">{log}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* DEMO SANDBOX SWAP SEQUENCE */
              <div className="space-y-3 font-mono text-[9.5px]">
                <p className="text-zinc-500 leading-relaxed uppercase">
                  Executing routing swap on the lightning-fast Simulated Sandbox.
                </p>
                <button
                  onClick={handleExecuteSwap}
                  disabled={swapStep !== "idle"}
                  className={`w-full py-2.5 px-4 rounded-none font-sans text-xs font-bold uppercase tracking-tight flex items-center justify-center gap-2 border ${
                    swapStep !== "idle"
                      ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 border-zinc-200 dark:border-zinc-700 cursor-not-allowed"
                      : "bg-[#002FA7] hover:bg-[#001D6E] text-white border-[#002FA7] cursor-pointer"
                  }`}
                >
                  <Zap className="w-4 h-4 text-white" />
                  {swapStep === "idle" ? "Compile ZK Proof & Dispatch" : `PROVING STATE: [${swapStep.toUpperCase()}]`}
                </button>

                {swapStep !== "idle" && (
                  <div className="border border-[#E5E5E5] dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 space-y-2 text-[9.5px]">
                    <div className="flex justify-between border-b dark:border-zinc-800 pb-1 font-bold">
                      <span className="text-[#666666] dark:text-zinc-400">PIPELINE OPERATIONS</span>
                      <span className="text-[#002FA7] dark:text-cyan-400 animate-pulse">{swapStep.toUpperCase()} ACTIVE</span>
                    </div>
                    <div className="space-y-1 text-[8.5px]">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 ${swapStep !== "sdk" ? "bg-[#00A86B]" : "bg-[#002FA7] animate-ping"}`} />
                        <span className={swapStep === "sdk" ? "text-black dark:text-zinc-100 font-bold" : "text-zinc-400"}>1. Noir SDK: Compile witness parameter proof</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 ${swapStep === "clear" || swapStep === "success" ? "bg-[#00A86B]" : swapStep === "lock" ? "bg-[#002FA7] animate-ping" : "bg-[#E5E5E5] dark:bg-zinc-800"}`} />
                        <span className={swapStep === "lock" ? "text-black dark:text-zinc-100 font-bold" : "text-zinc-400"}>2. Base Escrow: Lock origin {baseAmount} USDC, write commitment</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 ${swapStep === "success" ? "bg-[#00A86B]" : swapStep === "clear" ? "bg-[#002FA7] animate-ping" : "bg-[#E5E5E5] dark:bg-zinc-800"}`} />
                        <span className={swapStep === "clear" ? "text-black dark:text-zinc-100 font-bold" : "text-zinc-400"}>3. Soroban Verifier: Validate Proof, claim clearance</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settlement Registry List */}
      <div className="p-4 bg-[#FAFAFA] dark:bg-zinc-950 flex items-center justify-between border-t border-b border-[#E5E5E5] dark:border-zinc-800">
        <div>
          <h2 className="font-sans font-bold text-xs text-black dark:text-white uppercase tracking-tighter">SETTLEMENT INTEGRITY LEDGER</h2>
          <p className="text-[9px] text-[#666666] dark:text-zinc-400 font-mono uppercase tracking-tight">Active cross-chain settlement intents, commitments, solver matching, and challenger windows</p>
        </div>
      </div>
      <div className="p-4">
        <SettlementRegistry
          chains={chains}
          isHardwareEnforced={isHardwareEnforced}
          handleChallenge={handleChallenge}
          handleFinalize={handleFinalize}
        />
      </div>
    </div>
  );
};