import React from "react";
import { Shield, Zap, RefreshCw } from "lucide-react";
import { WalletProvider } from "../lib/wallet_provider";

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
  if (chainId === "base") return /^0x[a-fA-F0-9]{40}$/.test(clean);
  if (chainId === "stellar") return /^G[A-Z2-7]{55}$/.test(clean);
  if (chainId === "solana") return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(clean);
  if (chainId === "movement") return /^0x[a-fA-F0-9]{50,66}$/.test(clean);
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
  const providerInventory = WalletProvider.getProviderInventory();
  const chains = [
    { id: "base", name: "Base Sepolia (EVM)", placeholder: "0x...", accent: "#d9a078" as const, unit: "ETH" },
    { id: "stellar", name: "Stellar Testnet", placeholder: "G...", accent: "#f3e0d3" as const, unit: "XLM" },
    { id: "solana", name: "Solana Devnet", placeholder: "SolWallet...", accent: "#d9a078" as const, unit: "SOL" },
    { id: "movement", name: "Movement Testnet", placeholder: "0xMove...", accent: "#e8d5cc" as const, unit: "MOVE" },
  ];

  const accentButton =
    "bg-white text-black hover:bg-black hover:text-white border-black dark:border-[#1e1b22] dark:bg-black dark:text-white dark:hover:bg-[#17151b]";

  return (
    <div
      className="border border-white/10 bg-[#141217] text-white flex flex-col"
      style={{
        background: "radial-gradient(circle at 50% 0%, rgba(217,160,120,0.08), #141217 56%)",
      }}
    >
      <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/30">
        <div>
          <h2 className="font-sans font-bold text-xs uppercase tracking-tighter flex items-center gap-2 text-white">
            <Shield className="w-4 h-4 text-[#d9a078]" />
            1.0 Active Wallet Connection Portal
          </h2>
          <p className="text-[10px] text-[#a09ba8] font-mono mt-1 uppercase tracking-tight">
            Multi-Chain Provider & Stellar Wallet SDK
          </p>
        </div>
        <span className="text-[9px] bg-[#d9a078]/10 text-[#d9a078] font-mono px-2 py-0.5 border border-[#d9a078]/30 uppercase font-bold">
          LIVE_RPC
        </span>
      </div>

      <div className="p-5 space-y-3">
        {chains.map((chain) => {
          const address = walletAddresses[chain.id];
          const balance = walletBalances[chain.id];
          const isConnecting = walletIsConnecting[chain.id];
          const isEditing = editingChainId === chain.id;

          return (
            <div
              key={chain.id}
              className="border border-white/10 p-4 space-y-2 bg-black/25"
              style={{ backdropFilter: "blur(4px)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 ${address ? "bg-[#d9a078]" : "bg-white/15"}`} />
                  <span
                    className="text-[10px] font-bold font-mono uppercase"
                    style={{ color: chain.accent }}
                  >
                    {chain.name}
                  </span>
                </div>

                <span className="text-[7.5px] font-mono uppercase tracking-[0.18em] text-[#a09ba8] border border-white/10 px-1.5 py-0.5 bg-black/20">
                  {(providerInventory[chain.id]?.length ? providerInventory[chain.id].join(" / ") : "manual fallback")}
                </span>

                {address && (
                  <div className="flex items-center gap-1.5 border border-white/10 px-2 py-1 text-[9px] font-mono text-white bg-black/30">
                    <span className="text-[#a09ba8]">BALANCE:</span>
                    <span className="font-bold">{balance} {chain.unit}</span>
                    <button
                      onClick={() => refreshBalance(chain.id, address)}
                      className="p-0.5 text-white hover:text-[#d9a078] cursor-pointer transition-colors"
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
                      className={`flex-1 bg-black/40 border text-[10px] font-mono text-white placeholder-white/25 rounded-none px-2 py-1 focus:outline-none transition-colors ${
                        manualAddressValue && !isValidAddress(chain.id, manualAddressValue)
                          ? "border-red-500/70 focus:border-red-500"
                          : "border-white/10 focus:border-[#d9a078]"
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
                      className={`px-2.5 py-1 text-white rounded-none text-[9px] font-mono uppercase font-bold cursor-pointer border transition-colors ${
                        manualAddressValue && isValidAddress(chain.id, manualAddressValue)
                          ? "border-[#d9a078] bg-[#d9a078]/15 hover:bg-[#d9a078] hover:text-black"
                          : "border-white/10 text-white/60 cursor-not-allowed"
                      }`}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingChainId(null)}
                      className="px-2 py-1 bg-transparent border border-white/15 text-white hover:text-black hover:bg-white rounded-none text-[9px] font-mono uppercase cursor-pointer transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                  {manualAddressValue && !isValidAddress(chain.id, manualAddressValue) && (
                    <p className="text-[#ff9a9a] text-[8px] font-mono uppercase tracking-tight">
                      * Invalid {chain.name} address structure
                    </p>
                  )}
                </div>
              ) : address ? (
                <div className="flex items-center justify-between gap-3 border border-white/10 px-2.5 py-1.5 rounded-none text-[10px] bg-black/25">
                  <div className="font-mono text-[9px] text-[#f3e0d3] truncate overflow-hidden text-ellipsis whitespace-nowrap">
                    {address}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0 text-[8px] font-mono">
                    <button
                      onClick={() => {
                        setManualAddressValue(address);
                        setEditingChainId(chain.id);
                      }}
                      className="text-white hover:text-[#d9a078] uppercase cursor-pointer transition-colors"
                    >
                      Edit
                    </button>
                    <span className="text-white/15">|</span>
                    <button
                      onClick={() => handleDisconnectWallet(chain.id)}
                      className="text-red-400 hover:text-red-200 uppercase cursor-pointer font-bold transition-colors"
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
                    className="flex-1 py-1.5 border border-[#d9a078]/60 text-white tracking-[0.24em] uppercase text-[9px] font-mono font-bold transition-all duration-300 bg-black/40 backdrop-blur-sm cursor-pointer flex items-center justify-center gap-1.5 hover:border-white hover:bg-white hover:text-black disabled:opacity-60"
                  >
                    {isConnecting ? "Connecting..." : "Connect Wallet"}
                  </button>
                  <button
                    onClick={() => {
                      setManualAddressValue("");
                      setEditingChainId(chain.id);
                    }}
                    className="px-2.5 py-1.5 border border-[#d9a078]/70 text-[#d9a078] hover:bg-[#d9a078]/10 hover:text-white rounded-none text-[9px] font-mono uppercase cursor-pointer transition-all duration-300"
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
