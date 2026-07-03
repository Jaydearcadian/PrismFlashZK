import React from "react";
import { Code2, Copy, Check } from "lucide-react";

interface ContractInspectorProps {
  contractCode: string;
  activeTab: "noir" | "soroban" | "solidity" | "solana" | "movement" | "daemon";
  setActiveTab: (tab: "noir" | "soroban" | "solidity" | "solana" | "movement" | "daemon") => void;
  handleCopyCode: () => void;
  copied: boolean;
  isSidebar?: boolean;
}

export const ContractInspector: React.FC<ContractInspectorProps> = ({
  contractCode,
  activeTab,
  setActiveTab,
  handleCopyCode,
  copied,
  isSidebar = false,
}) => {
  const tabs = [
    { id: "noir", label: "1. Noir (main.nr)" },
    { id: "soroban", label: "2. Soroban (lib.rs)" },
    { id: "solidity", label: "3. EVM (BaseEscrow.sol)" },
    { id: "solana", label: "4. Solana (lib.rs)" },
    { id: "movement", label: "5. Movement (escrow.move)" },
    { id: "daemon", label: "6. TS Solver Daemon" }
  ] as const;

  if (isSidebar) {
    return (
      <div className="flex flex-col gap-3 p-4 bg-white dark:bg-[#17151b] transition-colors">
        <div className="flex items-center justify-between gap-2 border-b border-[#E5E5E5] dark:border-[#1e1b22] pb-2">
          <div>
            <h3 className="font-sans font-bold text-[10px] text-black dark:text-white uppercase tracking-tighter flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-[#d9a078] dark:text-[#d9a078]" /> Blueprint Inspector
            </h3>
            <p className="text-[8px] text-[#666666] dark:text-[#a09ba8] font-mono uppercase tracking-tight">Inspect cryptographic source rules.</p>
          </div>
          
          <button
            onClick={handleCopyCode}
            className="px-2 py-1 bg-white dark:bg-[#1e1b22] border border-[#E5E5E5] dark:border-[#1e1b22] hover:bg-[#FAFAFA] dark:hover:bg-[#2d2833] text-[8.5px] font-mono flex items-center gap-1 text-black dark:text-white transition-all cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-[#00A86B]" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? "COPIED" : "COPY"}</span>
          </button>
        </div>

        {/* Tab navigation for Sidebar */}
        <div className="grid grid-cols-2 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-2 py-1 font-mono text-[9px] uppercase border transition-all cursor-pointer truncate ${
                activeTab === tab.id
                  ? "bg-[#FAFAFA] dark:bg-[#1e1b22] border-black dark:border-[#d9a078] text-black dark:text-[#d9a078] font-bold border-b-2"
                  : "bg-white dark:bg-[#17151b] border-[#E5E5E5] dark:border-[#1e1b22] text-[#666666] dark:text-[#a09ba8] hover:text-black dark:hover:text-white"
              }`}
              title={tab.label}
            >
              {tab.label.split(". ")[1] || tab.label}
            </button>
          ))}
        </div>

        {/* Compact code block */}
        <div className="bg-white dark:bg-[#141217] border border-[#E5E5E5] dark:border-[#1e1b22] p-3 font-mono text-[9.5px] max-h-[380px] overflow-y-auto leading-relaxed text-black dark:text-[#c9c3d1] scrollbar-thin">
          <pre className="whitespace-pre overflow-x-auto">{contractCode}</pre>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-white border-t border-[#E5E5E5] p-6">
      <div className="max-w-7xl mx-auto flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E5E5E5] pb-3">
          <div>
            <h2 className="font-sans font-bold text-xs text-black uppercase tracking-tighter flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#d9a078]" /> 8.0 Direct Smart Contract Blueprint Inspector
            </h2>
            <p className="text-[10px] text-[#666666] font-mono mt-0.5 uppercase tracking-tight">Inspect the exact Rust, Solidity, Move, and Noir source-of-truth cryptographic rules.</p>
          </div>
          
          <button
            onClick={handleCopyCode}
            className="px-3.5 py-1.5 bg-white border border-[#E5E5E5] hover:bg-[#FAFAFA] rounded-none text-xs font-mono flex items-center gap-2 text-black transition-all cursor-pointer self-start md:self-auto"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#00A86B]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? "COPIED" : "COPY SOURCE"}</span>
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex flex-wrap gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-none font-mono text-[10px] uppercase border transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "bg-[#FAFAFA] border-black text-black font-bold border-b-2"
                  : "bg-white border-[#E5E5E5] text-[#666666] hover:text-black hover:border-black"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stark code block */}
        <div className="bg-white border border-[#E5E5E5] rounded-none p-4 font-mono text-[11px] max-h-96 overflow-y-auto leading-relaxed text-black scrollbar-thin">
          <pre className="whitespace-pre">{contractCode}</pre>
        </div>
      </div>
    </section>
  );
};
