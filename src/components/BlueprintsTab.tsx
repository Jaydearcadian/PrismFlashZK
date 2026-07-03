import React from "react";
import { Check, Copy, Code2 } from "lucide-react";
import { ContractInspector } from "./ContractInspector";

interface BlueprintsTabProps {
  contractCode: any;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  handleCopyCode: () => void;
  copied: boolean;
}

export const BlueprintsTab: React.FC<BlueprintsTabProps> = ({
  contractCode,
  activeTab,
  setActiveTab,
  handleCopyCode,
  copied,
}) => {
  return (
    <div className="flex flex-col divide-y divide-[#E5E5E5] dark:divide-[#1e1b22] bg-white dark:bg-[#17151b]">
      <div className="p-4 bg-[#FAFAFA] dark:bg-[#141217] flex items-center justify-between border-b border-[#E5E5E5] dark:border-[#1e1b22]">
        <div>
          <h2 className="font-sans font-bold text-xs text-black dark:text-white uppercase tracking-tighter">CRYPTOGRAPHIC BLUEPRINT INSPECTOR</h2>
          <p className="text-[9px] text-[#666666] dark:text-[#a09ba8] font-mono uppercase tracking-tight">Inspect Noir circuits, on-chain smart verifiers, Solidity/Anchor escrows, and TypeScript solver daemons</p>
        </div>
        <button
          onClick={handleCopyCode}
          className="px-2.5 py-1.5 bg-white dark:bg-[#1e1b22] border border-[#E5E5E5] dark:border-[#1e1b22] hover:bg-[#FAFAFA] dark:hover:bg-[#2d2833] text-[10px] font-mono flex items-center gap-1 text-black dark:text-white transition-all cursor-pointer rounded-none uppercase font-bold"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#00A86B]" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "COPIED CODE" : "COPY CODE"}</span>
        </button>
      </div>

      <div className="p-4 bg-[#f4f2f7] dark:bg-[#141217]/40 border-b dark:border-[#1e1b22]">
        <ContractInspector
          contractCode={contractCode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleCopyCode={handleCopyCode}
          copied={copied}
          isSidebar={false}
        />
      </div>

      <div className="p-4 space-y-3 font-mono text-[10px] text-[#6b6472] leading-relaxed bg-[#FAFAFA] dark:bg-[#141217]/40">
        <span className="font-sans font-bold text-[10.5px] uppercase tracking-tight text-black dark:text-white block">LOCAL TESTING AND COMPILATION GUIDE</span>
        <p>
          1. Install Noir CLI: <code className="bg-white dark:bg-[#1e1b22] border dark:border-[#2d2833] px-1 font-bold text-black dark:text-white">curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash</code>
        </p>
        <p>
          2. Compile local circuit: <code className="bg-white dark:bg-[#1e1b22] border dark:border-[#2d2833] px-1 font-bold text-black dark:text-white">nargo compile</code> inside the circuit folder.
        </p>
        <p>
          3. Run Solver Daemon Controller locally: <code className="bg-white dark:bg-[#1e1b22] border dark:border-[#2d2833] px-1 font-bold text-black dark:text-white">npm run start:solver</code> to listen to on-chain Base locks and dispatch Soroban proofs concurrently.
        </p>
      </div>
    </div>
  );
};