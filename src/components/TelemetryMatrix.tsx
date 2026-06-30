import React from "react";
import { Globe, Shield, RefreshCw, CheckCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface TelemetryMatrixProps {
  chains: any;
  swapStep: string;
  walletAddresses: Record<string, string | null>;
  bn254PairingSuccess: boolean;
  validatedByteLength: number;
  selectedGlossaryState: "locked" | "cleared" | "filled" | null;
  setSelectedGlossaryState: (val: "locked" | "cleared" | "filled" | null) => void;
  baseAmount: number;
  solanaAmount: number;
  movementAmount: number;
}

export const TelemetryMatrix: React.FC<TelemetryMatrixProps> = ({
  chains,
  swapStep,
  walletAddresses,
  bn254PairingSuccess,
  validatedByteLength,
  selectedGlossaryState,
  setSelectedGlossaryState,
  baseAmount,
  solanaAmount,
  movementAmount,
}) => {
  return (
    <div className="border border-[#E5E5E5] rounded-none bg-white flex flex-col">
      <div className="p-4 bg-[#FAFAFA] border-b border-[#E5E5E5] flex items-center justify-between">
        <h2 className="font-sans font-bold text-xs text-black uppercase tracking-tighter flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#002FA7]" /> 5.0 SYSTEM TELEMETRY MATRIX & MULTI-VM FLOWS
        </h2>
        <div className="flex items-center gap-1.5 font-mono text-[9px] bg-white border border-[#E5E5E5] px-2 py-0.5">
          <span className="w-1.5 h-1.5 bg-[#00A86B] animate-pulse" />
          <span className="text-[#666666]">POLLED SEQUENCER TIMELINE LIVE</span>
        </div>
      </div>

      {/* 2x2 network grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border-b border-[#E5E5E5] bg-white">
        {/* BASE EVM */}
        <div className="p-4 border-b md:border-b-0 border-[#E5E5E5] md:border-r border-[#E5E5E5] font-mono text-[11px]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-black uppercase">BASE L2 (EVM ESCROW)</span>
            <AnimatePresence mode="wait">
              {swapStep === "lock" ? (
                <motion.span
                  key="locking"
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 2 }}
                  transition={{ duration: 0.15 }}
                  className="text-[#002FA7] font-bold animate-pulse flex items-center gap-1"
                >
                  ● LOCKING
                </motion.span>
              ) : swapStep === "clear" || swapStep === "success" || (chains?.base?.deposits && Object.keys(chains.base.deposits).length > 0) ? (
                <motion.span
                  key="locked"
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 2 }}
                  transition={{ duration: 0.15 }}
                  className="text-[#00A86B] font-bold flex items-center gap-1"
                >
                  ● LOCKED
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 2 }}
                  transition={{ duration: 0.15 }}
                  className="text-[#999999] flex items-center gap-1"
                >
                  ● IDLE
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          
          <div className="space-y-1.5 text-[10px]">
            <div className="flex justify-between border-b border-[#FAFAFA] pb-0.5">
              <span className="text-[#666666]">State Code:</span>
              <span className={swapStep === "clear" || swapStep === "success" || (chains?.base?.deposits && Object.keys(chains.base.deposits).length > 0) ? "text-[#002FA7] font-bold" : "text-[#999999]"}>
                {swapStep === "clear" || swapStep === "success" || (chains?.base?.deposits && Object.keys(chains.base.deposits).length > 0) ? "0x_STATE_ESCROW_LOCKED" : "0x_STATE_IDLE"}
              </span>
            </div>
            <div className="flex justify-between border-b border-[#FAFAFA] pb-0.5">
              <span className="text-[#666666]">Block Height:</span>
              <span className="text-black font-bold">#{chains?.base?.blockHeight || "5192839"}</span>
            </div>
            <div className="flex justify-between border-b border-[#FAFAFA] pb-0.5">
              <span className="text-[#666666]">User Balance:</span>
              <span className="text-black">
                {chains?.base?.balances[walletAddresses.base || "UserWallet"] !== undefined 
                  ? Number(chains.base.balances[walletAddresses.base || "UserWallet"]).toFixed(2) 
                  : "0.00"} USDC
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666666]">Vault Held:</span>
              <span className="text-black font-bold">{chains?.base?.balances["EscrowContract"] || "0"} USDC</span>
            </div>
          </div>
        </div>

        {/* STELLAR SOROBAN */}
        <div className="p-4 border-b md:border-b-0 border-[#E5E5E5] font-mono text-[11px]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-black uppercase">STELLAR SOROBAN (CLEARING)</span>
            <AnimatePresence mode="wait">
              {swapStep === "clear" ? (
                <motion.span
                  key="clearing"
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 2 }}
                  transition={{ duration: 0.15 }}
                  className="text-[#002FA7] font-bold animate-pulse flex items-center gap-1"
                >
                  ● CLEARING
                </motion.span>
              ) : swapStep === "success" || (chains?.stellar?.clearedIntents && Object.keys(chains.stellar.clearedIntents).length > 0) ? (
                <motion.span
                  key="cleared"
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 2 }}
                  transition={{ duration: 0.15 }}
                  className="text-[#00A86B] font-bold flex items-center gap-1"
                >
                  ● CLEARED
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 2 }}
                  transition={{ duration: 0.15 }}
                  className="text-[#999999] flex items-center gap-1"
                >
                  ● IDLE
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-1.5 text-[10px]">
            <div className="flex justify-between border-b border-[#FAFAFA] pb-0.5">
              <span className="text-[#666666]">Ledger Sequence:</span>
              <span className="text-black font-bold">#{chains?.stellar?.ledgerSequence || "490123"}</span>
            </div>
            <div className="flex justify-between border-b border-[#FAFAFA] pb-0.5">
              <span className="text-[#666666]">Host Pairing Engine:</span>
              <span className="text-black font-semibold">bn254_multi_pairing_check()</span>
            </div>
            
            {/* Proof Validation Indicator Component with Tooltip */}
            <div className="flex justify-between items-center relative group cursor-help border-b border-[#FAFAFA] pb-0.5">
              <span className="text-[#666666]">Proof Validation:</span>
              <span className={`font-mono font-bold flex items-center gap-1 ${
                bn254PairingSuccess ? "text-[#00A86B]" : "text-amber-600 animate-pulse"
              }`}>
                {bn254PairingSuccess ? "BN254 SUCCESS (320 Bytes)" : "AWAITING PROOF"}
              </span>
              <div className="absolute bottom-full right-0 mb-1 w-64 hidden group-hover:block bg-white border border-[#E5E5E5] text-black p-3 rounded-none shadow-xl z-50 text-left pointer-events-none">
                <div className="text-black font-bold mb-1 border-b border-[#E5E5E5] pb-1 uppercase text-[9px]">Soroban Host Cryptography</div>
                <div className="space-y-1 text-[9px] text-[#666666]">
                  <div><span className="font-bold">Call:</span> <span className="font-mono text-[#002FA7]">bn254_multi_pairing_check()</span></div>
                  <div><span className="font-bold">Status:</span> {bn254PairingSuccess ? "Verified (True)" : "Pending"}</div>
                  <div><span className="font-bold">Validated Size:</span> <span className="text-black font-mono font-bold">{validatedByteLength} Bytes</span></div>
                  <div><span className="font-bold">Gas Footprint:</span> Near-Zero (Host Native Optimization)</div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <span className="text-[#666666]">Reimbursement Cleared:</span>
              <span className={swapStep === "success" || (chains?.stellar?.clearedIntents && Object.keys(chains.stellar.clearedIntents).length > 0) ? "text-[#002FA7] font-bold" : "text-[#999999]"}>
                {swapStep === "success" || (chains?.stellar?.clearedIntents && Object.keys(chains.stellar.clearedIntents).length > 0) ? "TRUE" : "FALSE"}
              </span>
            </div>
          </div>
        </div>

        {/* SOLANA */}
        <div className="p-4 md:border-r border-[#E5E5E5] font-mono text-[11px]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-black uppercase">SOLANA DEVNET (SVM PAYOUT)</span>
            <AnimatePresence mode="wait">
              {swapStep === "clear" ? (
                <motion.span
                  key="filling"
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 2 }}
                  transition={{ duration: 0.15 }}
                  className="text-amber-600 font-bold animate-pulse flex items-center gap-1"
                >
                  ● FILLING
                </motion.span>
              ) : swapStep === "success" ? (
                <motion.span
                  key="filled"
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 2 }}
                  transition={{ duration: 0.15 }}
                  className="text-[#00A86B] font-bold flex items-center gap-1"
                >
                  ● FILLED
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0, y: -2 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 2 }}
                  transition={{ duration: 0.15 }}
                  className="text-[#999999] flex items-center gap-1"
                >
                  ● IDLE
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-1.5 text-[10px]">
            <div className="flex justify-between border-b border-[#FAFAFA] pb-0.5">
              <span className="text-[#666666]">Slot Height:</span>
              <span className="text-black font-bold">#{chains?.solana?.slot || "28912389"}</span>
            </div>
            <div className="flex justify-between border-b border-[#FAFAFA] pb-0.5">
              <span className="text-[#666666]">Connected Wallet Balance:</span>
              <span className="text-black">
                {chains?.solana?.balances[walletAddresses.solana || "UserWallet"] !== undefined 
                  ? Number(chains.solana.balances[walletAddresses.solana || "UserWallet"]).toFixed(3) 
                  : "0.000"} SOL
              </span>
            </div>
            <div className="flex justify-between border-b border-[#FAFAFA] pb-0.5">
              <span className="text-[#666666]">Settlement State:</span>
              <span className={swapStep === "success" ? "text-[#002FA7] font-bold" : "text-[#999999]"}>
                {swapStep === "success" ? "0x_STATE_FILLED" : "0x_STATE_IDLE"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666666]">Vault Reserve:</span>
              <span className="text-black">25,000 SOL</span>
            </div>
          </div>
        </div>

        {/* MOVEMENT */}
        <div className="p-4 font-mono text-[11px]">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-black uppercase">MOVEMENT TESTNET (MOVE Payout)</span>
            <AnimatePresence mode="wait">
               {swapStep === "clear" ? (
                 <motion.span
                   key="filling"
                   initial={{ opacity: 0, y: -2 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 2 }}
                   transition={{ duration: 0.15 }}
                   className="text-amber-600 font-bold animate-pulse flex items-center gap-1"
                 >
                   ● FILLING
                 </motion.span>
               ) : swapStep === "success" ? (
                 <motion.span
                   key="filled"
                   initial={{ opacity: 0, y: -2 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 2 }}
                   transition={{ duration: 0.15 }}
                   className="text-[#00A86B] font-bold flex items-center gap-1"
                 >
                   ● FILLED
                 </motion.span>
               ) : (
                 <motion.span
                   key="idle"
                   initial={{ opacity: 0, y: -2 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 2 }}
                   transition={{ duration: 0.15 }}
                   className="text-[#999999] flex items-center gap-1"
                 >
                   ● IDLE
                 </motion.span>
               )}
             </AnimatePresence>
          </div>

          <div className="space-y-1.5 text-[10px]">
            <div className="flex justify-between border-b border-[#FAFAFA] pb-0.5">
              <span className="text-[#666666]">Ledger Version:</span>
              <span className="text-black font-bold">#{chains?.movement?.ledgerVersion || "3012948"}</span>
            </div>
            <div className="flex justify-between border-b border-[#FAFAFA] pb-0.5">
              <span className="text-[#666666]">Connected Wallet Balance:</span>
              <span className="text-black">
                {chains?.movement?.balances[walletAddresses.movement || "UserWallet"] !== undefined 
                  ? Number(chains.movement.balances[walletAddresses.movement || "UserWallet"]).toFixed(2) 
                  : "0.00"} MOVE
              </span>
            </div>
            <div className="flex justify-between border-b border-[#FAFAFA] pb-0.5">
              <span className="text-[#666666]">Settlement State:</span>
              <span className={swapStep === "success" ? "text-[#002FA7] font-bold" : "text-[#999999]"}>
                {swapStep === "success" ? "0x_STATE_FILLED" : "0x_STATE_IDLE"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#666666]">Vault Reserve:</span>
              <span className="text-black">150,000 MOVE</span>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding Legend */}
      <div className="p-4 bg-[#FAFAFA] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-sans font-bold text-black uppercase tracking-tight">ZK-Intent Pipeline Onboarding Legend</span>
          <span className="text-[9px] font-mono text-[#002FA7] bg-[#002FA7]/10 px-1.5 py-0.5 border border-[#002FA7]/30 uppercase font-bold">Interactive Specs</span>
        </div>
        
        <p className="text-[10px] text-[#666666] font-mono leading-relaxed uppercase tracking-tight">
          Select an operations phase below to inspect the cryptographic details of the asymmetric clearing process.
        </p>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setSelectedGlossaryState(selectedGlossaryState === "locked" ? null : "locked")}
            className={`py-2 px-2 border transition-all cursor-pointer rounded-none text-left ${
              selectedGlossaryState === "locked" 
                ? "bg-[#002FA7]/10 border-[#002FA7] text-[#002FA7] font-bold" 
                : "bg-white border-[#E5E5E5] hover:border-black text-[#666666] hover:text-black"
            }`}
          >
            <span className="block text-[10px] font-bold font-sans">1. LOCKED</span>
            <span className="text-[8px] font-mono block mt-0.5 uppercase">Origin Escrow</span>
          </button>

          <button
            onClick={() => setSelectedGlossaryState(selectedGlossaryState === "cleared" ? null : "cleared")}
            className={`py-2 px-2 border transition-all cursor-pointer rounded-none text-left ${
              selectedGlossaryState === "cleared" 
                ? "bg-[#002FA7]/10 border-[#002FA7] text-[#002FA7] font-bold" 
                : "bg-white border-[#E5E5E5] hover:border-black text-[#666666] hover:text-black"
            }`}
          >
            <span className="block text-[10px] font-bold font-sans">2. CLEARED</span>
            <span className="text-[8px] font-mono block mt-0.5 uppercase">Stellar ZK-Clear</span>
          </button>

          <button
            onClick={() => setSelectedGlossaryState(selectedGlossaryState === "filled" ? null : "filled")}
            className={`py-2 px-2 border transition-all cursor-pointer rounded-none text-left ${
              selectedGlossaryState === "filled" 
                ? "bg-[#002FA7]/10 border-[#002FA7] text-[#002FA7] font-bold" 
                : "bg-white border-[#E5E5E5] hover:border-black text-[#666666] hover:text-black"
            }`}
          >
            <span className="block text-[10px] font-bold font-sans">3. FILLED</span>
            <span className="text-[8px] font-mono block mt-0.5 uppercase">Payout Settlement</span>
          </button>
        </div>

        {selectedGlossaryState && (
          <div className="bg-white border border-[#E5E5E5] p-3 text-[10px] font-mono text-black space-y-1.5 rounded-none">
            {selectedGlossaryState === "locked" && (
              <>
                <div className="text-[#002FA7] font-bold border-b border-[#E5E5E5] pb-1 flex items-center gap-1.5">
                  ● STAGE 1: ESCROW STATE LOCKED (BASE EVM)
                </div>
                <p className="text-[#666666] leading-relaxed">
                  The client locks <span className="font-bold text-black">{baseAmount} tUSDC</span> inside the Solidity contract. Commitments and a unique Nullifier are generated locally. Funds are frozen until cryptographic clearance is proven.
                </p>
              </>
            )}
            {selectedGlossaryState === "cleared" && (
              <>
                <div className="text-[#002FA7] font-bold border-b border-[#E5E5E5] pb-1 flex items-center gap-1.5">
                  ● STAGE 2: VERIFICATION STATE CLEARED (STELLAR SOROBAN)
                </div>
                <p className="text-[#666666] leading-relaxed">
                  An UltraHonk Zero-Knowledge proof is compiled via Noir and submitted to Stellar. The Soroban verifier checks the proof natively using host-level cryptography to guarantee ownership, registering the intent as <span className="font-bold text-black">Cleared</span>.
                </p>
              </>
            )}
            {selectedGlossaryState === "filled" && (
              <>
                <div className="text-[#002FA7] font-bold border-b border-[#E5E5E5] pb-1 flex items-center gap-1.5">
                  ● STAGE 3: SETTLEMENT STATE FILLED (SOLANA & MOVEMENT)
                </div>
                <p className="text-[#666666] leading-relaxed">
                  Solvers monitor the cleared events on Stellar and execute fast payout sequences on Solana ({solanaAmount} SOL) and Movement ({movementAmount} MOVE) to the user's destination. Solver retrieves locked Base USDC upon proof receipt.
                </p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
