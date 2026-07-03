import React, { useState } from "react";
import { Zap, Coins, Key, Compass, Sparkles, ChevronDown } from "lucide-react";

interface IntentFormProps {
  baseAmount: number;
  setBaseAmount: (val: number) => void;
  solanaAmount: number;
  setSolanaAmount: (val: number) => void;
  solanaRecipient: string;
  setSolanaRecipient: (val: string) => void;
  movementAmount: number;
  setMovementAmount: (val: number) => void;
  movementRecipient: string;
  setMovementRecipient: (val: string) => void;
  secretKey: string;
  setSecretKey: (val: string) => void;
  nonce: string;
  setNonce: (val: string) => void;
}

interface IntentTemplate {
  name: string;
  description: string;
  baseAmount: number;
  solanaAmount: number;
  solanaRecipient: string;
  movementAmount: number;
  movementRecipient: string;
  badge: string;
  badgeColor: string;
}

const INTENT_TEMPLATES: IntentTemplate[] = [
  {
    name: "Standard Low-Fee Optimizer",
    description: "Minimizes gas and protocol overhead. Best for standard size swaps with standard clearance limits.",
    baseAmount: 50,
    solanaAmount: 2.5,
    solanaRecipient: "8sD6p3yE4pA4B8bXpW9cZ2qR4T8hY2vX7pW9qR4T8",
    movementAmount: 25,
    movementRecipient: "0x00c7a829a433fca38d2ba84a9ffce912389d42f56708b792ffc9284982a3c74b",
    badge: "Low Fee",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-300"
  },
  {
    name: "High-Priority TEE Shielded",
    description: "Fast-path execution with instant hardware signatures, priority gas pricing, and faster optimistic verification.",
    baseAmount: 250,
    solanaAmount: 12.0,
    solanaRecipient: "9qT7bX3pE4pA4B8bXpW9cZ2qR4T8hY2vX7pW9qR4T8",
    movementAmount: 120,
    movementRecipient: "0x7a829a433fca38d2ba84a9ffce912389d42f56708b792ffc9284982a3c74b2f",
    badge: "High Priority",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-300"
  },
  {
    name: "Solana Liquid-Staking Heavy",
    description: "Concentrated liquidity route targeting Solana high-yield staking vaults and decentralized liquidity providers.",
    baseAmount: 500,
    solanaAmount: 30.0,
    solanaRecipient: "3sA8xP6qR4T8hY2vX7pW9qR4T8yE4pA4B8bXpW9cZ",
    movementAmount: 5,
    movementRecipient: "0x56708b792ffc9284982a3c74b2f00c7a829a433fca38d2ba84a9ffce912389d4",
    badge: "Solana Focus",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-300"
  },
  {
    name: "Movement MoveVM Power-User",
    description: "Optimized route prioritizing Aptos MoveVM smart contract deployment execution with lower SVM allocation.",
    baseAmount: 150,
    solanaAmount: 1.0,
    solanaRecipient: "5tW9qR4T8yE4pA4B8bXpW9cZ2qR4T8hY2vX7pW9qR4T",
    movementAmount: 85,
    movementRecipient: "0x89c72c912389d42f56708b792ffce912389d42f56708b792ffc9284982a3c74b",
    badge: "MoveVM Focus",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-300"
  }
];

export const IntentForm: React.FC<IntentFormProps> = ({
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
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Dynamically compute if current values match one of our templates
  const currentTemplateIndex = INTENT_TEMPLATES.findIndex(
    (t) =>
      t.baseAmount === baseAmount &&
      t.solanaAmount === solanaAmount &&
      t.solanaRecipient === solanaRecipient &&
      t.movementAmount === movementAmount &&
      t.movementRecipient === movementRecipient
  );

  const activeTemplate = currentTemplateIndex !== -1 ? INTENT_TEMPLATES[currentTemplateIndex] : null;

  const handleSelectTemplate = (index: number) => {
    const template = INTENT_TEMPLATES[index];
    setBaseAmount(template.baseAmount);
    setSolanaAmount(template.solanaAmount);
    setSolanaRecipient(template.solanaRecipient);
    setMovementAmount(template.movementAmount);
    setMovementRecipient(template.movementRecipient);
    setDropdownOpen(false);
  };

  return (
    <div className="border border-[#E5E5E5] rounded-none bg-white flex flex-col">
      <div className="p-4 bg-[#FAFAFA] border-b border-[#E5E5E5] flex items-center justify-between">
        <h2 className="font-sans font-bold text-xs text-black uppercase tracking-tighter flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#d9a078]" /> 2.0 Assemble User Intent Routing Path
        </h2>
        <span className="text-[9px] text-[#666666] font-mono uppercase">Step 1 & 2 Initiator</span>
      </div>

      <div className="p-4 space-y-4">
        {/* Intent Templates Dropdown Selector */}
        <div className="relative">
          <label className="block text-[10px] font-sans font-bold text-black uppercase tracking-tight mb-1.5 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#d9a078]" /> Select Intent Preset Template
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-full flex items-center justify-between bg-[#FAFAFA] border border-[#E5E5E5] px-3 py-2.5 text-left text-xs font-sans text-black focus:outline-none focus:border-[#d9a078] cursor-pointer"
            >
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold">
                    {activeTemplate ? activeTemplate.name : "Custom User-Specified Intent"}
                  </span>
                  {activeTemplate ? (
                    <span className={`px-1.5 py-0.5 text-[8.5px] font-mono border uppercase tracking-wider ${activeTemplate.badgeColor}`}>
                      {activeTemplate.badge}
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 text-[8.5px] font-mono border border-[#c9c3d1] bg-[#f4f2f7] text-[#4a4451] uppercase tracking-wider">
                      Custom Route
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-[#666666] line-clamp-1">
                  {activeTemplate ? activeTemplate.description : "Values have been customized by user input."}
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 text-[#6b6472] transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute z-50 mt-1 w-full bg-white border border-[#E5E5E5] shadow-lg divide-y divide-[#F0F0F0] max-h-60 overflow-y-auto">
                {INTENT_TEMPLATES.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectTemplate(idx)}
                    className={`w-full text-left p-3 hover:bg-[#FAFAFA] flex flex-col gap-1 transition-colors ${
                      currentTemplateIndex === idx ? "bg-blue-50/40" : ""
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-black flex items-center gap-1.5">
                        {currentTemplateIndex === idx && <Sparkles className="w-3.5 h-3.5 text-[#d9a078]" />}
                        {tpl.name}
                      </span>
                      <span className={`px-1.5 py-0.5 text-[8px] font-mono border uppercase tracking-wider ${tpl.badgeColor}`}>
                        {tpl.badge}
                      </span>
                    </div>
                    <p className="text-[9.5px] text-[#666666] leading-relaxed">
                      {tpl.description}
                    </p>
                    <div className="flex items-center gap-3 text-[9px] font-mono text-[#6b6472] mt-0.5 pt-0.5 border-t border-dashed border-[#ebe8ef]">
                      <span>EVM: <strong className="text-black">{tpl.baseAmount} USDC</strong></span>
                      <span>•</span>
                      <span>Solana: <strong className="text-black">{tpl.solanaAmount} SOL</strong></span>
                      <span>•</span>
                      <span>Movement: <strong className="text-black">{tpl.movementAmount} MOVE</strong></span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-sans font-bold text-black uppercase tracking-tight mb-1">
            Origin Asset Deposit (Base Sepolia)
          </label>
          <div className="relative border border-[#E5E5E5] rounded-none focus-within:border-[#d9a078]">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#666666]">
              <Coins className="h-3.5 w-3.5 text-[#d9a078]" />
            </div>
            <input
              type="number"
              value={baseAmount}
              onChange={(e) => setBaseAmount(Number(e.target.value))}
              className="block w-full border-none bg-white py-2 pl-9 pr-24 text-xs font-mono text-black focus:outline-none focus:ring-0"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 border-l border-[#E5E5E5] bg-[#FAFAFA] px-2.5 font-mono text-[10px] text-[#666666] uppercase">
              tUSDC (Base)
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-sans font-bold text-black uppercase tracking-tight mb-1">
              Solana Target Venue
            </label>
            <div className="space-y-1.5">
              <div className="relative border border-[#E5E5E5] focus-within:border-[#d9a078]">
                <input
                  type="number"
                  value={solanaAmount}
                  onChange={(e) => setSolanaAmount(Number(e.target.value))}
                  className="block w-full border-none bg-white py-2 px-2 text-xs font-mono text-black focus:outline-none focus:ring-0"
                  placeholder="SOL Payout"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 border-l border-[#E5E5E5] bg-[#FAFAFA] px-2 font-mono text-[9px] text-[#666666] uppercase">
                  SOL
                </div>
              </div>
              <input
                type="text"
                value={solanaRecipient}
                onChange={(e) => setSolanaRecipient(e.target.value)}
                className="block w-full border border-[#E5E5E5] bg-white py-1.5 px-2 text-[10px] font-mono text-[#666666] focus:border-[#d9a078] focus:outline-none focus:text-black rounded-none"
                placeholder="Solana Wallet Recipient"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-sans font-bold text-black uppercase tracking-tight mb-1">
              Movement Target Venue
            </label>
            <div className="space-y-1.5">
              <div className="relative border border-[#E5E5E5] focus-within:border-[#d9a078]">
                <input
                  type="number"
                  value={movementAmount}
                  onChange={(e) => setMovementAmount(Number(e.target.value))}
                  className="block w-full border-none bg-white py-2 px-2 text-xs font-mono text-black focus:outline-none focus:ring-0"
                  placeholder="MOVE Payout"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 border-l border-[#E5E5E5] bg-[#FAFAFA] px-2 font-mono text-[9px] text-[#666666] uppercase">
                  MOVE
                </div>
              </div>
              <input
                type="text"
                value={movementRecipient}
                onChange={(e) => setMovementRecipient(e.target.value)}
                className="block w-full border border-[#E5E5E5] bg-white py-1.5 px-2 text-[10px] font-mono text-[#666666] focus:border-[#d9a078] focus:outline-none focus:text-black rounded-none"
                placeholder="Move Escrow Address"
              />
            </div>
          </div>
        </div>

        {/* Advanced Cryptographic Parameters */}
        <div className="border border-[#E5E5E5] p-3 bg-[#FAFAFA] space-y-2 rounded-none">
          <span className="text-[10px] font-sans font-bold text-black uppercase tracking-tight block">
            Client Cryptographic Seeds (Noir Circuit Input)
          </span>
          
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-[9px] font-sans text-[#666666] uppercase block mb-0.5">Secret Identity Seed (Private)</label>
              <div className="relative border border-[#E5E5E5] bg-white">
                <input
                  type="text"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="block w-full border-none bg-transparent py-1 px-2 text-[9px] font-mono text-[#666666] focus:outline-none focus:text-black"
                />
              </div>
            </div>
            <div>
              <label className="text-[9px] font-sans text-[#666666] uppercase block mb-0.5">Salt (Nonce)</label>
              <div className="border border-[#E5E5E5] bg-white">
                <input
                  type="text"
                  value={nonce}
                  onChange={(e) => setNonce(e.target.value)}
                  className="block w-full border-none bg-transparent py-1 px-2 text-[9px] font-mono text-center text-[#666666] focus:outline-none focus:text-black"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
