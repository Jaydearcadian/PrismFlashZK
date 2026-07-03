import React from "react";
import { TelemetryMatrix } from "./TelemetryMatrix";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { Activity } from "lucide-react";

interface OverviewTabProps {
  chains: any;
  swapStep: string;
  walletAddresses: any;
  bn254PairingSuccess: boolean;
  validatedByteLength: number;
  selectedGlossaryState: "locked" | "cleared" | "filled" | null;
  setSelectedGlossaryState: (state: "locked" | "cleared" | "filled" | null) => void;
  baseAmount: string;
  solanaAmount: string;
  movementAmount: string;
  congestion: "low" | "standard" | "elevated";
  estimatedBaseGasEth: string;
  estimatedGasUsd: string;
  estimatedStellarGasXlm: string;
  estimatedStellarGasUsd: string;
  estimatedSolanaGasSol: string;
  estimatedSolanaGasUsd: string;
  estimatedMovementGasMove: string;
  estimatedMovementGasUsd: string;
  proofTimeSec: number;
  expectedTotalDuration: number;
  baseLockTimeSec: number;
  sorobanVerifyTimeSec: number;
  solanaSettleTimeSec: number;
  movementTimeSec: number;
  handleMint: (chain: string, amount: number) => void;
  darkMode: boolean;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
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
  congestion,
  estimatedBaseGasEth,
  estimatedGasUsd,
  estimatedStellarGasXlm,
  estimatedStellarGasUsd,
  estimatedSolanaGasSol,
  estimatedSolanaGasUsd,
  estimatedMovementGasMove,
  estimatedMovementGasUsd,
  proofTimeSec,
  expectedTotalDuration,
  baseLockTimeSec,
  sorobanVerifyTimeSec,
  solanaSettleTimeSec,
  movementTimeSec,
  handleMint,
  darkMode,
}) => {
  return (
    <div className="flex flex-col divide-y divide-[#E5E5E5] dark:divide-[#1e1b22]">
      {/* Telemetry Matrix Section */}
      <div className="p-4 bg-[#FAFAFA] dark:bg-[#141217] flex items-center justify-between border-b border-[#E5E5E5] dark:border-[#1e1b22]">
        <div>
          <h2 className="font-sans font-bold text-xs text-black dark:text-white uppercase tracking-tighter">CROSS-CHAIN TELEMETRY MATRIX</h2>
          <p className="text-[9px] text-[#666666] dark:text-[#a09ba8] font-mono uppercase tracking-tight">Real-time status tracking of multi-VM pipeline execution</p>
        </div>
        <span className="text-[10px] text-[#d9a078] dark:text-[#d9a078] font-mono font-bold uppercase">[ ACTIVE PIPELINE ]</span>
      </div>
      <div className="bg-white dark:bg-[#17151b] p-4">
        <TelemetryMatrix
          chains={chains}
          swapStep={swapStep}
          walletAddresses={walletAddresses}
          bn254PairingSuccess={bn254PairingSuccess}
          validatedByteLength={validatedByteLength}
          selectedGlossaryState={selectedGlossaryState}
          setSelectedGlossaryState={setSelectedGlossaryState}
          baseAmount={baseAmount}
          solanaAmount={solanaAmount}
          movementAmount={movementAmount}
        />
      </div>

      {/* Real-time fee latency engine */}
      <div className="p-4 bg-[#FAFAFA] dark:bg-[#141217] flex items-center justify-between border-t border-b border-[#E5E5E5] dark:border-[#1e1b22]">
        <div>
          <h2 className="font-sans font-bold text-xs text-black dark:text-white uppercase tracking-tighter">NETWORK CONGESTION & FEE ESTIMATOR</h2>
          <p className="text-[9px] text-[#666666] dark:text-[#a09ba8] font-mono uppercase tracking-tight">Gas and settlement latency parameters relative to standard VM congestion</p>
        </div>
        <div className="flex items-center gap-1.5 font-mono text-[9px]">
          <span className="text-[#666666] dark:text-[#a09ba8] uppercase">CONGESTION LEVEL:</span>
          <span className={`px-1.5 py-0.5 font-bold uppercase border rounded-none ${
            congestion === "low" 
              ? "bg-[#00A86B]/15 text-[#00A86B] border-[#00A86B]/30" 
              : congestion === "standard"
              ? "bg-amber-600/15 text-amber-600 border-amber-600/30"
              : "bg-red-600/15 text-red-600 border-red-600/30"
          }`}>
            {congestion}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-white dark:bg-[#17151b] transition-colors">
        <div className="border border-[#E5E5E5] dark:border-[#1e1b22] p-3 space-y-1 bg-[#FAFAFA] dark:bg-[#141217]/40">
          <div className="text-[9px] font-sans font-bold text-[#666666] dark:text-[#a09ba8] uppercase">Base Sepolia</div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-mono font-bold text-black dark:text-white">{estimatedBaseGasEth} ETH</span>
            <span className="text-[9px] font-mono text-[#666666] dark:text-[#a09ba8]">~${estimatedGasUsd}</span>
          </div>
          <div className="text-[9px] font-mono text-[#6b6472]">SETTLE: <span className="text-black dark:text-[#c9c3d1] font-semibold">{baseLockTimeSec}s</span></div>
        </div>

        <div className="border border-[#E5E5E5] dark:border-[#1e1b22] p-3 space-y-1 bg-[#FAFAFA] dark:bg-[#141217]/40">
          <div className="text-[9px] font-sans font-bold text-[#666666] dark:text-[#a09ba8] uppercase">Stellar Testnet</div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-mono font-bold text-black dark:text-white">{estimatedStellarGasXlm} XLM</span>
            <span className="text-[9px] font-mono text-[#666666] dark:text-[#a09ba8]">~${estimatedStellarGasUsd}</span>
          </div>
          <div className="text-[9px] font-mono text-[#6b6472]">SETTLE: <span className="text-black dark:text-[#c9c3d1] font-semibold">{sorobanVerifyTimeSec}s</span></div>
        </div>

        <div className="border border-[#E5E5E5] dark:border-[#1e1b22] p-3 space-y-1 bg-[#FAFAFA] dark:bg-[#141217]/40">
          <div className="text-[9px] font-sans font-bold text-[#666666] dark:text-[#a09ba8] uppercase">Solana Devnet</div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-mono font-bold text-black dark:text-white">{estimatedSolanaGasSol} SOL</span>
            <span className="text-[9px] font-mono text-[#666666] dark:text-[#a09ba8]">~${estimatedSolanaGasUsd}</span>
          </div>
          <div className="text-[9px] font-mono text-[#6b6472]">SETTLE: <span className="text-black dark:text-[#c9c3d1] font-semibold">{solanaSettleTimeSec}s</span></div>
        </div>

        <div className="border border-[#E5E5E5] dark:border-[#1e1b22] p-3 space-y-1 bg-[#FAFAFA] dark:bg-[#141217]/40">
          <div className="text-[9px] font-sans font-bold text-[#666666] dark:text-[#a09ba8] uppercase">Movement Porto</div>
          <div className="flex justify-between items-baseline">
            <span className="text-sm font-mono font-bold text-black dark:text-white">{estimatedMovementGasMove} MOVE</span>
            <span className="text-[9px] font-mono text-[#666666] dark:text-[#a09ba8]">~${estimatedMovementGasUsd}</span>
          </div>
          <div className="text-[9px] font-mono text-[#6b6472]">SETTLE: <span className="text-black dark:text-[#c9c3d1] font-semibold">{movementTimeSec}s</span></div>
        </div>
      </div>

      <div className="p-4 bg-[#FAFAFA] dark:bg-[#141217] flex flex-col sm:flex-row justify-between gap-3 text-[10px] font-mono border-t border-b border-[#E5E5E5] dark:border-[#1e1b22]">
        <div className="flex-1 flex justify-between items-center bg-white dark:bg-[#17151b] border border-[#E5E5E5] dark:border-[#1e1b22] p-2">
          <span className="uppercase text-[9px] font-bold text-[#666666] dark:text-[#a09ba8]">Noir Prover Compilation:</span>
          <span className="text-[#d9a078] dark:text-[#d9a078] font-bold">{proofTimeSec}s</span>
        </div>
        <div className="flex-1 flex justify-between items-center bg-white dark:bg-[#17151b] border border-[#E5E5E5] dark:border-[#1e1b22] p-2">
          <span className="uppercase text-[9px] font-bold text-[#666666] dark:text-[#a09ba8]">E2E TARGET DURATION:</span>
          <span className="text-[#00A86B] font-extrabold">{expectedTotalDuration}s</span>
        </div>
      </div>

      {/* Collateral Faucet Panel */}
      <div className="p-4 bg-[#FAFAFA] dark:bg-[#141217] border-b border-[#E5E5E5] dark:border-[#1e1b22] flex items-center justify-between">
        <div>
          <h2 className="font-sans font-bold text-xs text-black dark:text-white uppercase tracking-tighter">MULTI-CHAIN TESTNET COLLATERAL FAUCET</h2>
          <p className="text-[9px] text-[#666666] dark:text-[#a09ba8] font-mono uppercase tracking-tight">Mint mock collateral on testnets to verify solver rebalancing limits</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 p-4 bg-white dark:bg-[#17151b]">
        <button
          onClick={() => handleMint("base", 250)}
          className="border border-[#E5E5E5] dark:border-[#1e1b22] bg-white dark:bg-[#1e1b22] hover:bg-[#FAFAFA] dark:hover:bg-[#2d2833] py-2.5 px-3.5 text-[10px] font-mono flex items-center justify-between text-black dark:text-white transition-all cursor-pointer rounded-none uppercase font-bold"
        >
          <span className="text-[#666666] dark:text-[#a09ba8]">Base Sepolia</span>
          <span className="font-bold text-[#d9a078] dark:text-[#d9a078]">+250 USDC</span>
        </button>
        <button
          onClick={() => handleMint("stellar", 1000)}
          className="border border-[#E5E5E5] dark:border-[#1e1b22] bg-white dark:bg-[#1e1b22] hover:bg-[#FAFAFA] dark:hover:bg-[#2d2833] py-2.5 px-3.5 text-[10px] font-mono flex items-center justify-between text-black dark:text-white transition-all cursor-pointer rounded-none uppercase font-bold"
        >
          <span className="text-[#666666] dark:text-[#a09ba8]">Stellar Test</span>
          <span className="font-bold text-[#d9a078] dark:text-[#d9a078]">+1K XLM</span>
        </button>
        <button
          onClick={() => handleMint("solana", 10)}
          className="border border-[#E5E5E5] dark:border-[#1e1b22] bg-white dark:bg-[#1e1b22] hover:bg-[#FAFAFA] dark:hover:bg-[#2d2833] py-2.5 px-3.5 text-[10px] font-mono flex items-center justify-between text-black dark:text-white transition-all cursor-pointer rounded-none uppercase font-bold"
        >
          <span className="text-[#666666] dark:text-[#a09ba8]">Solana Dev</span>
          <span className="font-bold text-[#d9a078] dark:text-[#d9a078]">+10 SOL</span>
        </button>
        <button
          onClick={() => handleMint("movement", 500)}
          className="border border-[#E5E5E5] dark:border-[#1e1b22] bg-white dark:bg-[#1e1b22] hover:bg-[#FAFAFA] dark:hover:bg-[#2d2833] py-2.5 px-3.5 text-[10px] font-mono flex items-center justify-between text-black dark:text-white transition-all cursor-pointer rounded-none uppercase font-bold"
        >
          <span className="text-[#666666] dark:text-[#a09ba8]">Move Porto</span>
          <span className="font-bold text-[#d9a078] dark:text-[#d9a078]">+500 MOVE</span>
        </button>
      </div>

      {/* Analytics Dashboard Section */}
      <div className="p-4 bg-[#FAFAFA] dark:bg-[#141217] flex items-center justify-between border-t border-b border-[#E5E5E5] dark:border-[#1e1b22]">
        <div>
          <h2 className="font-sans font-bold text-xs text-black dark:text-white uppercase tracking-tighter">STATISTICAL PROTOCOL PERFORMANCE</h2>
          <p className="text-[9px] text-[#666666] dark:text-[#a09ba8] font-mono uppercase tracking-tight">Ledger transaction speeds, rebalance metrics, and liquidity volume slopes</p>
        </div>
      </div>
      <div className="bg-white dark:bg-[#17151b] p-4">
        <AnalyticsDashboard darkMode={darkMode} />
      </div>
    </div>
  );
};