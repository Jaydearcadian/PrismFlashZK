import React from "react";
import { Shield, Zap, RefreshCw } from "lucide-react";

interface WalletPortalProps {
  walletAddresses: Record<string, string | null>;
  walletBalances: Record<string, string>;
  walletIsConnecting: Record<string, boolean>;
  editingChainId: string | null;
  setEditingChainId: (id: string | null) => void;
  manualAddressValue: string;
  setManualAddressValue: (val: string) => void;
  handleConnectWallet: (chain: string) => void;
  handleDisconnectWallet: (chain: string) => void;
  handleManualAddressInput: (chain: string, address: string) => void;
  refreshBalance: (chain: string, address: string) => void;
}

const isValidAddress = (chainId: string, addr: string): boolean => {
  if (!addr) return false;
  const clean = addr.trim();
  if (chainId === "base") {
    return /^0x[a-fA-F0-9]{40}$/.test(clean);
  }
  if (chainId === "stellar") {
    return /^G[A-Z2-7]{55}$/.test(clean);
  }
  if (chainId === "solana") {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(clean);
  }
  if (chainId === "movement") {
    return /^0x[a-fA-F0-9]{50,66}$/.test(clean);
  }
  return true;
};

export const WalletPortal: React.FC<WalletPortalProps> = ({
  walletAddresses,
  walletBalances,
  walletIsConnecting,
  editingChainId,
  setEditingChainId,
  manualAddressValue,
  setManualAddressValue,
  handleConnectWallet,
  handleDisconnectWallet,
  handleManualAddressInput,
  refreshBalance,
}) => {
  const chains = [
    { id: "base", name: "Base Sepolia (EVM)", placeholder: "0x...", color: "text-[#002FA7]", unit: "ETH" },
    { id: "stellar", name: "Stellar Testnet", placeholder: "G...", color: "text-black", unit: "XLM" },
    { id: "solana", name: "Solana Devnet", placeholder: "SolWallet...", color: "text-[#002FA7]", unit: "SOL" },
    { id: "movement", name: "Movement Testnet", placeholder: "0xMove...", color: "text-[#00A86B]", unit: "MOVE" },
  ];

  return (
    <div className="border border-[#E5E5E5] rounded-none bg-white flex flex-col">
      <div className="p-4 bg-[#FAFAFA] border-b border-[#E5E5E5] flex items-center justify-between">
        <div>
          <h2 className="font-sans font-bold text-xs text-black uppercase tracking-tighter flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#002FA7]" /> 1.0 Active Wallet Connection Portal
          </h2>
          <p className="text-[10px] text-[#666666] font-mono mt-0.5 uppercase tracking-tight">Multi-Chain Provider & Stellar Wallet SDK</p>
        </div>
        <span className="text-[9px] bg-[#00A86B]/10 text-[#00A86B] font-mono px-2 py-0.5 border border-[#00A86B]/30 uppercase font-bold">LIVE_RPC</span>
      </div>

      <div className="p-4 space-y-3 bg-white">
        {chains.map((chain) => {
          const address = walletAddresses[chain.id];
          const balance = walletBalances[chain.id];
          const isConnecting = walletIsConnecting[chain.id];
          const isEditing = editingChainId === chain.id;

          return (
            <div key={chain.id} className="border border-[#E5E5E5] p-3 space-y-2 rounded-none bg-[#FAFAFA]/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 ${address ? "bg-[#00A86B]" : "bg-[#CCCCCC]"}`} />
                  <span className={`text-[10px] font-bold font-mono ${chain.color} uppercase`}>{chain.name}</span>
                </div>
                
                {address && (
                  <div className="flex items-center gap-1.5 bg-white border border-[#E5E5E5] px-1.5 py-0.5 text-[9px] font-mono text-black">
                    <span className="text-[#666666]">BALANCE:</span>
                    <span className="font-bold">{balance} {chain.unit}</span>
                    <button 
                      onClick={() => refreshBalance(chain.id, address)}
                      className="p-0.5 text-black hover:text-[#002FA7] cursor-pointer"
                      title="Refresh Balance"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                    </button>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      id={`manual-input-${chain.id}`}
                      placeholder={chain.placeholder}
                      value={manualAddressValue}
                      onChange={(e) => setManualAddressValue(e.target.value)}
                      className={`flex-1 bg-white border text-[10px] font-mono text-black rounded-none px-2 py-1 focus:outline-none ${
                        manualAddressValue && !isValidAddress(chain.id, manualAddressValue)
                          ? "border-red-500 focus:border-red-500"
                          : "border-[#E5E5E5] focus:border-[#002FA7]"
                      }`}
                    />
                    <button
                      onClick={() => {
                        if (manualAddressValue && isValidAddress(chain.id, manualAddressValue)) {
                          handleManualAddressInput(chain.id, manualAddressValue);
                          setEditingChainId(null);
                        }
                      }}
                      disabled={!manualAddressValue || !isValidAddress(chain.id, manualAddressValue)}
                      className={`px-2.5 py-1 text-white rounded-none text-[9px] font-mono uppercase font-bold cursor-pointer ${
                        manualAddressValue && isValidAddress(chain.id, manualAddressValue)
                          ? "bg-black hover:bg-[#002FA7]"
                          : "bg-[#CCCCCC] cursor-not-allowed text-zinc-500"
                      }`}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingChainId(null)}
                      className="px-2 py-1 bg-white border border-[#E5E5E5] text-[#666666] hover:text-black rounded-none text-[9px] font-mono uppercase cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  {manualAddressValue && !isValidAddress(chain.id, manualAddressValue) && (
                    <p className="text-[8px] text-red-600 font-mono uppercase tracking-tight">
                      * Invalid {chain.name} address structure
                    </p>
                  )}
                </div>
              ) : address ? (
                <div className="flex items-center justify-between gap-3 bg-white border border-[#E5E5E5] px-2.5 py-1.5 rounded-none text-[10px]">
                  <div className="font-mono text-[9px] text-black truncate overflow-hidden text-ellipsis whitespace-nowrap">
                    {address}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-[8px] font-mono">
                    <button
                      onClick={() => {
                        setManualAddressValue(address);
                        setEditingChainId(chain.id);
                      }}
                      className="text-black hover:text-[#002FA7] uppercase cursor-pointer"
                    >
                      Edit
                    </button>
                    <span className="text-[#CCCCCC]">|</span>
                    <button
                      onClick={() => handleDisconnectWallet(chain.id)}
                      className="text-red-600 hover:text-red-800 uppercase cursor-pointer font-bold"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleConnectWallet(chain.id)}
                    disabled={isConnecting}
                    className="flex-1 py-1 bg-white border border-[#E5E5E5] hover:border-black text-black rounded-none text-[9px] font-mono font-bold uppercase tracking-tight flex items-center justify-center gap-1.5 cursor-pointer transition-all duration-100"
                  >
                    <Zap className="w-2.5 h-2.5 text-[#002FA7]" />
                    {isConnecting ? "Detecting..." : `Connect Extension`}
                  </button>
                  <button
                    onClick={() => {
                      setManualAddressValue("");
                      setEditingChainId(chain.id);
                    }}
                    className="px-2 py-1 bg-white border border-[#E5E5E5] hover:border-black text-[#666666] hover:text-black rounded-none text-[9px] font-mono uppercase cursor-pointer transition-all duration-100"
                  >
                    Paste Address
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
