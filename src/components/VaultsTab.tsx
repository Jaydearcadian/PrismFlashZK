import React from "react";
import { LiquidityOverview } from "./LiquidityOverview";

interface VaultsTabProps {
  chains: any;
  darkMode: boolean;
}

export const VaultsTab: React.FC<VaultsTabProps> = ({ chains, darkMode }) => {
  return (
    <div className="flex flex-col divide-y divide-[#E5E5E5] dark:divide-[#1e1b22] bg-white dark:bg-[#17151b]">
      <div className="p-4 bg-[#FAFAFA] dark:bg-[#141217] flex items-center justify-between border-b border-[#E5E5E5] dark:border-[#1e1b22]">
        <div>
          <h2 className="font-sans font-bold text-xs text-black dark:text-white uppercase tracking-tighter">SPOKE VAULTS & DECENTRALIZED COLLATERAL</h2>
          <p className="text-[9px] text-[#666666] dark:text-[#a09ba8] font-mono uppercase tracking-tight">Manage target chain collateral weights, track divergence indicators (Delta_i), and trigger arbitrage rebalancing</p>
        </div>
      </div>
      
      <div className="p-4">
        <LiquidityOverview chains={chains} darkMode={darkMode} />
      </div>
    </div>
  );
};