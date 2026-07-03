import React from "react";

interface SettlementRegistryProps {
  chains: any;
  isHardwareEnforced: boolean;
  handleChallenge: (nullifier: string) => void;
  handleFinalize: (nullifier: string) => void;
}

export const SettlementRegistry: React.FC<SettlementRegistryProps> = ({
  chains,
  isHardwareEnforced,
  handleChallenge,
  handleFinalize,
}) => {
  // Calculate total settled (finalized claims)
  const settledClaims = chains?.base?.claims?.filter((c: any) => c.finalized) || [];
  const totalSettledCount = settledClaims.length;
  const totalSettledAmount = settledClaims.reduce((sum: number, claim: any) => {
    if (claim.amount !== undefined && claim.amount !== null) {
      return sum + parseFloat(claim.amount);
    }
    const matchingDep = chains?.base?.deposits?.find((d: any) => d.nullifier === claim.nullifier);
    return sum + parseFloat(matchingDep?.amount || 100);
  }, 0);

  // Calculate Average Settlement Time
  let avgTimeStr = "--";
  if (totalSettledCount > 0) {
    const totalBlocks = settledClaims.reduce((sum: number, claim: any) => {
      const isTEE = claim.solver?.toLowerCase().includes("tee") || claim.solver?.includes("0xTEE") || claim.solver === "SpectrumEngine";
      return sum + (isTEE ? 0 : 150);
    }, 0);
    const avgBlocks = totalBlocks / totalSettledCount;
    if (avgBlocks === 0) {
      avgTimeStr = "INSTANT (~0.5s TEE)";
    } else if (avgBlocks === 150) {
      avgTimeStr = "150 BLOCKS (~300s)";
    } else {
      avgTimeStr = `${avgBlocks.toFixed(1)} BLOCKS (~${(avgBlocks * 2).toFixed(0)}s)`;
    }
  } else {
    avgTimeStr = isHardwareEnforced ? "INSTANT (~0.5s TEE)" : "150 BLOCKS (~300s)";
  }

  return (
    <div className="p-4 bg-[#FAFAFA] border-b border-[#E5E5E5] space-y-3 flex-shrink-0">
      <span className="text-[10px] font-sans font-bold text-black uppercase tracking-tight block">
        6.0 Active Settlement Registry & Dispute Watcher
      </span>

      {/* Dynamic Summary Dashboard Header */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 border border-[#E5E5E5] bg-white p-2.5">
        <div className="flex flex-col space-y-0.5">
          <span className="text-[#666666] text-[8px] font-bold uppercase tracking-wider">TOTAL SETTLED VOLUME</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-black font-sans font-bold text-base tracking-tight">
              {totalSettledAmount.toFixed(2)} USDC
            </span>
            <span className="text-[#6b6472] font-mono text-[9px]">
              ({totalSettledCount} {totalSettledCount === 1 ? "intent" : "intents"})
            </span>
          </div>
        </div>

        <div className="flex flex-col space-y-0.5 border-t md:border-t-0 md:border-l border-[#E5E5E5] pt-1.5 md:pt-0 md:pl-3">
          <span className="text-[#666666] text-[8px] font-bold uppercase tracking-wider">AVERAGE SETTLEMENT TIME</span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-[#d9a078] font-sans font-bold text-base tracking-tight uppercase">
              {avgTimeStr}
            </span>
            <span className="text-[#6b6472] font-mono text-[9px]">
              {isHardwareEnforced ? "TEE Mode" : "Optimistic Mode"}
            </span>
          </div>
        </div>
      </div>

      {(!chains?.base?.deposits?.length && !chains?.base?.claims?.length) ? (
        <div className="border border-dashed border-[#E5E5E5] bg-white py-6 text-center text-[#999999] text-[10px] font-mono uppercase">
          No active intents registered in local ledger state. Launch a swap above.
        </div>
      ) : (
        <div className="space-y-3">
          {(() => {
            // Union deposits and claims to ensure records persist after finalization delete
            const allNullifiers = Array.from(new Set([
              ...(chains?.base?.deposits || []).map((d: any) => d.nullifier),
              ...(chains?.base?.claims || []).map((c: any) => c.nullifier)
            ]));

            return allNullifiers.map((nullifier) => {
              const dep = chains?.base?.deposits?.find((d: any) => d.nullifier === nullifier);
              const claim = chains?.base?.claims?.find((c: any) => c.nullifier === nullifier);

              const amount = dep?.amount ?? claim?.amount ?? 100;
              const payloadCommitment = dep?.payloadCommitment ?? claim?.payloadCommitment ?? "0xUnknown";
              const depositor = dep?.depositor ?? claim?.solver ?? "UserWallet";

              // Generate deterministic but real-looking unique transaction hashes for simulated networks
              const baseTx = dep?.txHash || claim?.solanaTx ? ("0x" + nullifier.substring(2, 10) + "ba5e" + nullifier.substring(nullifier.length - 8)) : "Pending";
              const stellarTx = "0x" + nullifier.substring(3, 11) + "57e1" + nullifier.substring(nullifier.length - 7);

              const isInitiated = true;
              const isVerified = !!claim;
              const isFinalized = claim?.finalized === true;
              const isDisputed = claim?.challenged === true;
              const isVerifying = !claim && !!dep; // currently locked on Base, solver is working on fills

              return (
                <div key={nullifier} className="bg-white border border-[#E5E5E5] p-3 space-y-3.5 font-mono text-[10px] text-black">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-1 border-b border-[#E5E5E5] pb-2">
                    <div className="space-y-0.5">
                      <span className="text-[#666666] text-[8px] block uppercase font-bold">NULLIFIER</span>
                      <span className="text-black font-bold font-mono text-[9px]">{nullifier.substring(0, 32)}...</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-1.5 py-0.5 text-[9px] font-bold border ${isFinalized ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-[#d9a078]/10 text-[#d9a078] border-[#d9a078]/20"}`}>
                        {amount} USDC {isFinalized ? "SETTLED" : "LOCKED"}
                      </span>
                      <span className="px-1.5 py-0.5 bg-[#FAFAFA] text-[#666666] border border-[#E5E5E5] text-[9px]">
                        Commitment: {payloadCommitment.substring(0, 8)}...
                      </span>
                    </div>
                  </div>

                  {/* VISUAL TIMELINE PROGRESS INDICATOR */}
                  <div className="border border-[#E5E5E5] p-3 bg-[#FAFAFA] space-y-3">
                    <span className="text-[8px] font-bold text-[#666666] uppercase tracking-wider block">
                      Settlement Progress Pipeline
                    </span>
                    
                    <div className="relative flex items-center justify-between px-4">
                      {/* Background connecting bar */}
                      <div className="absolute left-6 right-6 top-2.5 h-0.5 bg-[#E5E5E5] -translate-y-1/2 z-0" />
                      
                      {/* Connecting bar progress */}
                      <div 
                        className="absolute left-6 top-2.5 h-0.5 bg-emerald-600 -translate-y-1/2 transition-all duration-500 z-0" 
                        style={{
                          width: isFinalized ? "100%" : isVerified ? "50%" : "0%"
                        }}
                      />

                      {/* Step 1: Initiated */}
                      <div className="flex flex-col items-center relative z-10 w-1/3">
                        <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold border border-emerald-600">
                          ✓
                        </div>
                        <span className="text-[9px] font-bold text-black mt-1.5 uppercase text-center">1. Initiated</span>
                        <span className="text-[7.5px] text-[#666666] text-center uppercase tracking-tight">Base Escrow Locked</span>
                      </div>

                      {/* Step 2: Proof Verified */}
                      <div className="flex flex-col items-center relative z-10 w-1/3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
                          isVerified 
                            ? "bg-emerald-600 text-white border-emerald-600" 
                            : isVerifying
                            ? "bg-amber-500 text-white border-amber-500 animate-pulse"
                            : "bg-white text-[#999999] border-[#c9c3d1]"
                        }`}>
                          {isVerified ? "✓" : "2"}
                        </div>
                        <span className={`text-[9px] font-bold mt-1.5 uppercase text-center ${isVerified ? "text-black" : "text-[#999999]"}`}>
                          2. Proof Verified
                        </span>
                        <span className="text-[7.5px] text-[#666666] text-center uppercase tracking-tight">Stellar Soroban Clear</span>
                      </div>

                      {/* Step 3: Finalized */}
                      <div className="flex flex-col items-center relative z-10 w-1/3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
                          isFinalized 
                            ? "bg-emerald-600 text-white border-emerald-600" 
                            : isDisputed
                            ? "bg-red-600 text-white border-red-600"
                            : isVerified
                            ? "bg-amber-500 text-white border-amber-500 animate-pulse"
                            : "bg-white text-[#999999] border-[#c9c3d1]"
                        }`}>
                          {isFinalized ? "✓" : isDisputed ? "✗" : "3"}
                        </div>
                        <span className={`text-[9px] font-bold mt-1.5 uppercase text-center ${isFinalized ? "text-emerald-700 font-extrabold" : isDisputed ? "text-red-600" : "text-[#999999]"}`}>
                          {isDisputed ? "Disputed" : "3. Finalized"}
                        </span>
                        <span className="text-[7.5px] text-[#666666] text-center uppercase tracking-tight">
                          {isFinalized ? "Reimbursement Paid" : isDisputed ? "Challenged Claim" : isVerified ? "Optimistic Cooldown" : "Awaiting Fill"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Route status summary tags */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-1.5 text-center text-[9px]">
                    <div className="border border-[#E5E5E5] bg-[#FAFAFA] p-1 text-[#d9a078] font-bold uppercase">
                      Base Lock: LOCKED
                    </div>
                    <div className="border border-[#E5E5E5] bg-[#FAFAFA] p-1 text-[#d9a078] font-bold uppercase">
                      Soroban Verify: OK
                    </div>
                    <div className={`border p-1 font-bold uppercase ${claim ? "border-[#E5E5E5] bg-[#FAFAFA] text-[#d9a078]" : "border-[#E5E5E5] bg-white text-[#999999]"}`}>
                       Solana Fill: {claim ? "FILLED" : "FILLING"}
                     </div>
                     <div className={`border p-1 font-bold uppercase ${claim ? "border-[#E5E5E5] bg-[#FAFAFA] text-[#d9a078]" : "border-[#E5E5E5] bg-white text-[#999999]"}`}>
                       Movement Fill: {claim ? "FILLED" : "FILLING"}
                     </div>
                  </div>

                  {/* Explorer Links Panel */}
                  <div className="border border-[#E5E5E5] p-2 bg-[#FAFAFA]/40 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[8px] font-bold text-[#666666] uppercase tracking-wider">
                      <span className="w-1.5 h-1.5 bg-[#d9a078] inline-block animate-pulse" />
                      On-Chain Explorer Telemetry Index
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 text-[9px]">
                      <div className="flex items-center justify-between p-1 bg-white border border-[#E5E5E5]">
                        <span className="text-[#666666] uppercase font-bold text-[8px]">Base Lock</span>
                        <a
                          href={`https://sepolia.basescan.org/tx/${baseTx}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#d9a078] hover:underline flex items-center gap-0.5 font-bold font-mono text-[8px]"
                          title="View Lock Transaction on Basescan"
                        >
                          {baseTx.substring(0, 10)}... ↗
                        </a>
                      </div>
                      <div className="flex items-center justify-between p-1 bg-white border border-[#E5E5E5]">
                        <span className="text-[#666666] uppercase font-bold text-[8px]">Soroban Clear</span>
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${stellarTx}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#d9a078] hover:underline flex items-center gap-0.5 font-bold font-mono text-[8px]"
                          title="View Clearinghouse Verification on Stellar.expert"
                        >
                          {stellarTx.substring(0, 10)}... ↗
                        </a>
                      </div>
                      <div className="flex items-center justify-between p-1 bg-white border border-[#E5E5E5]">
                        <span className="text-[#666666] uppercase font-bold text-[8px]">Solana Fill</span>
                        {claim ? (
                          <a
                            href={`https://explorer.solana.com/tx/${claim.solanaTx}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#d9a078] hover:underline flex items-center gap-0.5 font-bold font-mono text-[8px]"
                            title="View Payout Disbursal on Solana Explorer"
                          >
                            {claim.solanaTx.substring(0, 10)}... ↗
                          </a>
                        ) : (
                          <span className="text-[#a09ba8] font-bold uppercase text-[7.5px] italic flex items-center gap-1">
                            <span className="w-1 h-1 bg-amber-500 rounded-none animate-ping" />
                            PENDING
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between p-1 bg-white border border-[#E5E5E5]">
                        <span className="text-[#666666] uppercase font-bold text-[8px]">Movement Fill</span>
                        {claim ? (
                          <a
                            href={`https://explorer.movementlabs.xyz/txn/${claim.movementTx}?network=testnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#d9a078] hover:underline flex items-center gap-0.5 font-bold font-mono text-[8px]"
                            title="View Payout Disbursal on Movement Explorer"
                          >
                            {claim.movementTx.substring(0, 10)}... ↗
                          </a>
                        ) : (
                          <span className="text-[#a09ba8] font-bold uppercase text-[7.5px] italic flex items-center gap-1">
                            <span className="w-1 h-1 bg-amber-500 rounded-none animate-ping" />
                            PENDING
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {claim && (
                    <div className="border border-[#E5E5E5] p-2.5 bg-[#FAFAFA] space-y-1.5">
                      <div className="flex items-center justify-between text-[9px] font-bold border-b border-[#E5E5E5] pb-1">
                        <span className="text-[#666666] uppercase">REIMBURSEMENT STATE LOGS</span>
                        {claim.finalized ? (
                          <span className="text-[#00A86B] uppercase font-extrabold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            SETTLEMENT FINALIZED
                          </span>
                        ) : claim.challenged ? (
                          <span className="text-red-600 uppercase font-extrabold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full" />
                            CLAIM DISPUTED
                          </span>
                        ) : isHardwareEnforced ? (
                          <span className="text-[#d9a078] uppercase font-bold">TEE IMMEDIATE FINALIZATION</span>
                        ) : (
                          <span className="text-black uppercase">FROZEN COUNTDOWN: {Math.max(0, (claim.submitBlock + 150) - (chains?.base?.blockHeight || 0))} blocks</span>
                        )}
                      </div>

                      <div className="space-y-1 text-[9px] text-[#666666]">
                        <div className="flex justify-between items-center">
                          <span>Claim Block Height:</span>
                          <span className="text-black font-bold">#{claim.submitBlock}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Solana Settlement TX:</span>
                          <a
                            href={`https://explorer.solana.com/tx/${claim.solanaTx}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#d9a078] hover:underline font-mono text-[9px] font-bold flex items-center gap-0.5 truncate max-w-[200px]"
                            title="View on Solana Explorer (Devnet)"
                          >
                            {claim.solanaTx} ↗
                          </a>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Movement Settlement TX:</span>
                          <a
                            href={`https://explorer.movementlabs.xyz/txn/${claim.movementTx}?network=testnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#d9a078] hover:underline font-mono text-[9px] font-bold flex items-center gap-0.5 truncate max-w-[200px]"
                            title="View on Movement Explorer (Testnet)"
                          >
                            {claim.movementTx} ↗
                          </a>
                        </div>
                      </div>

                      {!claim.finalized && !claim.challenged && (
                        <div className="flex gap-2 pt-1.5 border-t border-[#E5E5E5]">
                          {!isHardwareEnforced && (
                            <button
                              onClick={() => handleChallenge(nullifier)}
                              className="flex-1 py-1 px-2 border border-red-200 bg-white hover:bg-red-50 text-red-600 text-[9px] font-bold uppercase rounded-none cursor-pointer"
                            >
                              Challenge Claim (Optimistic Dispute)
                            </button>
                          )}
                          <button
                            onClick={() => handleFinalize(nullifier)}
                            disabled={(chains?.base?.blockHeight || 0) < (claim.submitBlock + 150) && !isHardwareEnforced}
                            className={`flex-1 py-1 px-2 border text-[9px] font-bold uppercase rounded-none transition-all ${
                              ((chains?.base?.blockHeight || 0) >= (claim.submitBlock + 150) || isHardwareEnforced)
                                ? "bg-[#d9a078] text-white border-[#d9a078] hover:bg-[#b8825f] cursor-pointer"
                                : "bg-[#E5E5E5] text-[#999999] border-[#CCCCCC] cursor-not-allowed"
                            }`}
                          >
                            Finalize Release
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
};
