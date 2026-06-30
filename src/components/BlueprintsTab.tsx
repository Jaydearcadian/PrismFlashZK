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
    <div className="flex flex-col divide-y divide-[#E5E5E5] dark:divide-zinc-800 bg-white dark:bg-zinc-900">
      <div className="p-4 bg-[#FAFAFA] dark:bg-zinc-950 flex items-center justify-between border-b border-[#E5E5E5] dark:border-zinc-800">
        <div>
          <h2 className="font-sans font-bold text-xs text-black dark:text-white uppercase tracking-tighter">CRYPTOGRAPHIC BLUEPRINT INSPECTOR</h2>
          <p className="text-[9px] text-[#666666] dark:text-zinc-400 font-mono uppercase tracking-tight">Inspect Noir circuits, on-chain smart verifiers, Solidity/Anchor escrows, and TypeScript solver daemons</p>
        </div>
        <button
          onClick={handleCopyCode}
          className="px-2.5 py-1.5 bg-white dark:bg-zinc-800 border border-[#E5E5E5] dark:border-zinc-800 hover:bg-[#FAFAFA] dark:hover:bg-zinc-700 text-[10px] font-mono flex items-center gap-1 text-black dark:text-white transition-all cursor-pointer rounded-none uppercase font-bold"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#00A86B]" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? "COPIED CODE" : "COPY CODE"}</span>
        </button>
      </div>

      <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border-b dark:border-zinc-800">
        <ContractInspector
          contractCode={contractCode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          handleCopyCode={handleCopyCode}
          copied={copied}
          isSidebar={false}
        />
      </div>

      <div className="p-4 space-y-3 font-mono text-[10px] text-zinc-500 leading-relaxed bg-[#FAFAFA] dark:bg-zinc-950/40">
        <span className="font-sans font-bold text-[10.5px] uppercase tracking-tight text-black dark:text-white block">LOCAL TESTING AND COMPILATION GUIDE</span>
        <p>
          1. Install Noir CLI: <code className="bg-white dark:bg-zinc-800 border dark:border-zinc-700 px-1 font-bold text-black dark:text-white">curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | bash</code>
        </p>
        <p>
          2. Compile local circuit: <code className="bg-white dark:bg-zinc-800 border dark:border-zinc-700 px-1 font-bold text-black dark:text-white">nargo compile</code> inside the circuit folder.
        </p>
        <p>
          3. Run Solver Daemon Controller locally: <code className="bg-white dark:bg-zinc-800 border dark:border-zinc-700 px-1 font-bold text-black dark:text-white">npm run start:solver</code> to listen to on-chain Base locks and dispatch Soroban proofs concurrently.
        </p>
      </div>
    </div>
  );
};