import React from "react";

interface SettingsTabProps {
  isHardwareEnforced: boolean;
  setIsHardwareEnforced: (v: boolean) => void;
  liveContracts: { baseEscrow: string; stellarClearinghouse: string; solanaProgram: string; movementModule: string };
  setLiveContracts: (v: any) => void;
  setWalletBalances: (v: any) => void;
  addLocalLog: (v: string) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  isHardwareEnforced,
  setIsHardwareEnforced,
  liveContracts,
  setLiveContracts,
  setWalletBalances,
  addLocalLog,
}) => {
  return (
    <div className="flex flex-col divide-y divide-[#E5E5E5] dark:divide-zinc-800 bg-white dark:bg-zinc-900">
      <div className="p-4 bg-[#FAFAFA] dark:bg-zinc-950 flex items-center justify-between border-b border-[#E5E5E5] dark:border-zinc-800">
        <div>
          <h2 className="font-sans font-bold text-xs text-black dark:text-white uppercase tracking-tighter">COCKPIT ENGINE SETTINGS</h2>
          <p className="text-[9px] text-[#666666] dark:text-zinc-400 font-mono uppercase tracking-tight">Configure TEE hardware enclaves, live testnet RPC addresses, and customize simulation models</p>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* TEE Panel */}
        <div className="space-y-3">
          <span className="text-[10px] font-sans font-bold text-black dark:text-white uppercase tracking-tight block">Secure Enclave Hardware Signatures</span>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center bg-[#FAFAFA] dark:bg-zinc-950 p-4 border dark:border-zinc-800">
            <div className="flex-1 space-y-1">
              <span className="text-[11px] font-bold text-black dark:text-white block">TEE HARDWARE ENFORCEMENT</span>
              <p className="text-[10px] text-zinc-500 leading-relaxed font-mono">
                Enforces that solvers must route witness parameters through Intel SGX/AMD SEV secure hardware enclaves, creating absolute security against routing front-runs.
              </p>
            </div>
            <div className="flex items-center gap-3 bg-white dark:bg-zinc-900 border border-[#E5E5E5] dark:border-zinc-800 p-2">
              <span className="text-[9px] font-mono text-[#666666] dark:text-zinc-400 uppercase">STATUS:</span>
              <button 
                onClick={() => {
                  setIsHardwareEnforced(!isHardwareEnforced);
                  addLocalLog(`TEE Hardware Enforcement toggled to ${!isHardwareEnforced ? "ENABLED" : "DISABLED"}.`);
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer border border-[#E5E5E5] dark:border-zinc-700 rounded-none transition-colors duration-200 ease-in-out focus:outline-none ${isHardwareEnforced ? 'bg-[#002FA7] dark:bg-cyan-500' : 'bg-[#E5E5E5] dark:bg-zinc-800'}`}
              >
                <span className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-none bg-white border border-[#CCCCCC] transition duration-200 ease-in-out ${isHardwareEnforced ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
              <span className={`text-[9px] font-mono uppercase px-1 py-0.5 border ${isHardwareEnforced ? 'bg-[#002FA7]/10 text-[#002FA7] dark:text-cyan-400 border-[#002FA7]/30' : 'bg-[#FAFAFA] dark:bg-zinc-800 text-[#999999] border-[#E5E5E5] dark:border-zinc-800'}`}>
                {isHardwareEnforced ? "TEE KEY VALIDATED" : "OPTIMISTIC"}
              </span>
            </div>
          </div>
          {isHardwareEnforced && (
            <div className="p-3 bg-cyan-400/5 border border-cyan-400/20 text-cyan-800 dark:text-cyan-400 font-mono text-[9px] space-y-1">
              <div>ENCLAVE_KEY_ID: AMD-SEV-PAIRING-BN254-0x78af7d9e112cb</div>
              <div>SIGNED_MEASUREMENT_HASH: 0x6e7890f9a7cb1129b00e6c28f9a21d6e7f8e3a241e5e2f730c497</div>
              <div>ATTESTATION_VERIFIER: Soroban attestation_registry_v12.wasm</div>
            </div>
          )}
        </div>

        {/* Target Contract Configuration */}
        <div className="space-y-3">
          <span className="text-[10px] font-sans font-bold text-black dark:text-white uppercase tracking-tight block">Target Smart Contract Configurations</span>
          <div className="space-y-3 p-4 bg-zinc-50 dark:bg-zinc-950/40 border dark:border-zinc-800">
            {/* EVM */}
            <div className="space-y-1 font-mono text-[10px]">
              <span className="font-bold text-zinc-500 uppercase">Base Sepolia Escrow Contract Address:</span>
              <input
                type="text"
                value={liveContracts.baseEscrow}
                onChange={(e) => setLiveContracts({ ...liveContracts, baseEscrow: e.target.value })}
                className="w-full bg-white dark:bg-zinc-900 border border-[#E5E5E5] dark:border-zinc-800 px-3 py-1.5 text-[10.5px] text-black dark:text-white font-mono focus:outline-none focus:border-[#002FA7] dark:focus:border-cyan-400 transition-colors"
              />
            </div>
            {/* Stellar */}
            <div className="space-y-1 font-mono text-[10px]">
              <span className="font-bold text-zinc-500 uppercase">Stellar Soroban Clearinghouse Address:</span>
              <input
                type="text"
                value={liveContracts.stellarClearinghouse}
                onChange={(e) => setLiveContracts({ ...liveContracts, stellarClearinghouse: e.target.value })}
                className="w-full bg-white dark:bg-zinc-900 border border-[#E5E5E5] dark:border-zinc-800 px-3 py-1.5 text-[10.5px] text-black dark:text-white font-mono focus:outline-none focus:border-[#002FA7] dark:focus:border-cyan-400 transition-colors"
              />
            </div>
            {/* Solana */}
            <div className="space-y-1 font-mono text-[10px]">
              <span className="font-bold text-zinc-500 uppercase">Solana Devnet Vault Program ID:</span>
              <input
                type="text"
                value={liveContracts.solanaProgram}
                onChange={(e) => setLiveContracts({ ...liveContracts, solanaProgram: e.target.value })}
                className="w-full bg-white dark:bg-zinc-900 border border-[#E5E5E5] dark:border-zinc-800 px-3 py-1.5 text-[10.5px] text-black dark:text-white font-mono focus:outline-none focus:border-[#002FA7] dark:focus:border-cyan-400 transition-colors"
              />
            </div>
            {/* Movement */}
            <div className="space-y-1 font-mono text-[10px]">
              <span className="font-bold text-zinc-500 uppercase">Movement Porto Module Path:</span>
              <input
                type="text"
                value={liveContracts.movementModule}
                onChange={(e) => setLiveContracts({ ...liveContracts, movementModule: e.target.value })}
                className="w-full bg-white dark:bg-zinc-900 border border-[#E5E5E5] dark:border-zinc-800 px-3 py-1.5 text-[10.5px] text-black dark:text-white font-mono focus:outline-none focus:border-[#002FA7] dark:focus:border-cyan-400 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Manual wallet overrides */}
        <div className="space-y-3">
          <span className="text-[10px] font-sans font-bold text-black dark:text-white uppercase tracking-tight block">Developer Faucet & Overrides</span>
          <div className="p-4 bg-[#FAFAFA] dark:bg-zinc-950 border dark:border-zinc-800 space-y-3 font-mono text-[10px] text-zinc-500">
            <p>
              Need to reset the sandbox or live balances? Use the collateral faucets on the <span className="font-bold text-black dark:text-white">Overview</span> page to mint and replenish tokens.
            </p>
            <button
              onClick={() => {
                setWalletBalances({
                  base: "1250.0000",
                  stellar: "8500.00",
                  solana: "45.0000",
                  movement: "2500.0000"
                });
                addLocalLog("Reset mock wallet balances to default values.");
              }}
              className="py-2 px-4 bg-black dark:bg-cyan-500 hover:bg-zinc-900 dark:hover:bg-cyan-400 text-white dark:text-black font-sans text-[10px] font-bold uppercase cursor-pointer"
            >
              Reset Wallet Balances to Defaults
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};