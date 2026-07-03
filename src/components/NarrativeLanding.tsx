import React from "react";
import { motion } from "motion/react";
import { 
  Cpu, 
  Shield, 
  Zap, 
  ArrowRight, 
  Layers, 
  Terminal, 
  Code2, 
  Coins, 
  Globe,
  Database,
  Lock,
  Workflow
} from "lucide-react";

interface NarrativeLandingProps {
  onEnterCockpit: () => void;
  darkMode: boolean;
}

export const NarrativeLanding: React.FC<NarrativeLandingProps> = ({ onEnterCockpit, darkMode }) => {
  return (
    <div className={`min-h-screen font-sans ${darkMode ? "bg-[#141217] text-white" : "bg-[#F9F9F9] text-[#000000]"} flex flex-col transition-colors duration-300`}>
      {/* Dynamic Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 dark:opacity-10 pointer-events-none" />

      {/* Landing Navbar */}
      <header className={`border-b border-[#E5E5E5] dark:border-[#1e1b22] ${darkMode ? "bg-[#17151b]/80" : "bg-white/80"} backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50`}>
        <div className="flex items-center gap-3">
          <div className="border border-black dark:border-white p-2 bg-white dark:bg-[#1e1b22]">
            <Cpu className="w-5 h-5 text-[#d9a078] dark:text-[#d9a078]" />
          </div>
          <div>
            <h1 className="font-sans text-sm font-bold tracking-widest text-black dark:text-white uppercase">PRISMFLASH</h1>
            <p className="text-[9px] text-[#666666] dark:text-[#a09ba8] font-mono uppercase tracking-tight">Multi-VM Settlement Protocol</p>
          </div>
        </div>

        <button
          onClick={onEnterCockpit}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-black dark:border-[#d9a078] bg-[#d9a078] dark:bg-[#c88f68] hover:bg-[#b8825f] dark:hover:bg-[#d9a078] text-white dark:text-black font-mono text-[10px] uppercase font-bold transition-all cursor-pointer"
        >
          <span>Launch Cockpit</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 lg:py-20 flex flex-col justify-center relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Hero Text Column */}
          <div className="lg:col-span-7 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1 border border-[#d9a078]/30 dark:border-[#d9a078]/30 bg-[#d9a078]/5 dark:bg-[#d9a078]/5 font-mono text-[10px] font-bold text-[#d9a078] dark:text-[#d9a078] uppercase tracking-widest"
            >
              <Zap className="w-3 h-3 animate-pulse" />
              Cryptographic Multi-VM Settlement Infrastructure
            </motion.div>

            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tighter text-black dark:text-white leading-[1.05] uppercase"
            >
              Asymmetric <br />
              <span className="text-[#d9a078] dark:text-[#d9a078] font-mono font-medium lowercase">intent</span> control layer
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm sm:text-base text-[#4a4451] dark:text-[#c9c3d1] leading-relaxed font-sans max-w-xl"
            >
              PrismFlash bridges the execution divide between Ethereum, Stellar, Solana, and Movement. Lock origin assets on EVM, verify zero-knowledge clearance on Soroban via BN254 pairings, and disburse target assets concurrently. Secured by off-chain Solver Daemons maintaining global equilibrium.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 pt-4"
            >
              <button
                onClick={onEnterCockpit}
                className="px-6 py-4 bg-black dark:bg-[#d9a078] hover:bg-[#d9a078] dark:hover:bg-[#e8d5cc] text-white dark:text-black font-sans text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all cursor-pointer border border-black dark:border-[#d9a078] shadow-md"
              >
                <span>ENTER THE SOLVER COCKPIT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <a
                href="#how-it-works"
                className="px-6 py-4 bg-white dark:bg-[#17151b] hover:bg-[#FAFAFA] dark:hover:bg-[#1e1b22] text-black dark:text-white border border-[#E5E5E5] dark:border-[#1e1b22] font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
              >
                <span>EXPLORE ARCHITECTURE</span>
              </a>
            </motion.div>
          </div>

          {/* Core Pipeline Interactive Graphic Column */}
          <div className="lg:col-span-5 relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8 }}
              className={`border border-[#E5E5E5] dark:border-[#1e1b22] ${darkMode ? "bg-[#17151b]/90" : "bg-white/90"} p-6 relative`}
            >
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-black dark:border-[#d9a078]" />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-black dark:border-[#d9a078]" />
              <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-black dark:border-[#d9a078]" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-black dark:border-[#d9a078]" />

              <div className="flex items-center justify-between border-b border-[#E5E5E5] dark:border-[#1e1b22] pb-3 mb-4">
                <span className="text-[10px] font-mono text-[#666666] dark:text-[#a09ba8] uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#d9a078] dark:text-[#d9a078]" />
                  REAL-TIME PIPELINE DIAGNOSTIC
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>

              {/* Steps Visualizer */}
              <div className="space-y-4">
                <div className="p-3 bg-[#f4f2f7] dark:bg-[#141217] border border-[#E5E5E5] dark:border-[#1e1b22] flex items-center gap-3">
                  <div className="w-6 h-6 rounded-none bg-[#d9a078]/10 dark:bg-[#d9a078]/10 flex items-center justify-center text-[10px] font-mono font-bold text-[#d9a078] dark:text-[#d9a078] border border-[#d9a078]/20">
                    EVM
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[11px] font-bold text-black dark:text-white uppercase font-sans">1. LOCK INTENT</h4>
                    <p className="text-[9px] text-[#6b6472] dark:text-[#a09ba8] font-mono uppercase">Deposit committed to Base Sepolia Escrow</p>
                  </div>
                  <Lock className="w-4 h-4 text-[#a09ba8]" />
                </div>

                <div className="p-3 bg-[#f4f2f7] dark:bg-[#141217] border border-[#E5E5E5] dark:border-[#1e1b22] flex items-center gap-3">
                  <div className="w-6 h-6 rounded-none bg-[#d9a078]/10 dark:bg-[#d9a078]/10 flex items-center justify-center text-[10px] font-mono font-bold text-[#d9a078] dark:text-[#d9a078] border border-[#d9a078]/20">
                    ZK
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[11px] font-bold text-black dark:text-white uppercase font-sans">2. NOIR COMPILER</h4>
                    <p className="text-[9px] text-[#6b6472] dark:text-[#a09ba8] font-mono uppercase">UltraHonk zero-knowledge proof generated</p>
                  </div>
                  <Shield className="w-4 h-4 text-[#a09ba8]" />
                </div>

                <div className="p-3 bg-[#f4f2f7] dark:bg-[#141217] border border-[#E5E5E5] dark:border-[#1e1b22] flex items-center gap-3">
                  <div className="w-6 h-6 rounded-none bg-[#d9a078]/10 dark:bg-[#d9a078]/10 flex items-center justify-center text-[10px] font-mono font-bold text-[#d9a078] dark:text-[#d9a078] border border-[#d9a078]/20">
                    STE
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[11px] font-bold text-black dark:text-white uppercase font-sans">3. SOROBAN VERIFIER</h4>
                    <p className="text-[9px] text-[#6b6472] dark:text-[#a09ba8] font-mono uppercase">BN254 curve pairing clearance verified</p>
                  </div>
                  <Globe className="w-4 h-4 text-[#d9a078] dark:text-[#d9a078] animate-spin" style={{ animationDuration: '6s' }} />
                </div>

                <div className="p-3 bg-[#f4f2f7] dark:bg-[#141217] border border-[#E5E5E5] dark:border-[#1e1b22] flex items-center gap-3">
                  <div className="w-6 h-6 rounded-none bg-[#d9a078]/10 dark:bg-[#d9a078]/10 flex items-center justify-center text-[10px] font-mono font-bold text-[#d9a078] dark:text-[#d9a078] border border-[#d9a078]/20">
                    SOL
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[11px] font-bold text-black dark:text-white uppercase font-sans">4. TARGET DISBURSAL</h4>
                    <p className="text-[9px] text-[#6b6472] dark:text-[#a09ba8] font-mono uppercase">Solana & Movement parallel spoke vault payout</p>
                  </div>
                  <Coins className="w-4 h-4 text-[#00A86B]" />
                </div>
              </div>

              {/* State Status Log Box */}
              <div className="mt-4 p-2.5 bg-black text-emerald-400 font-mono text-[8px] border border-[#1e1b22] leading-tight">
                <div>[SYSTEM] SOLVER_DAEMON_LISTENER: PORT 3000 ONLINE</div>
                <div>[SOROBAN] SUBSCRIBED TO LEDGER STATE SYNCS</div>
                <div>[STATUS] Δ_i EQUILIBRIUM ACTIVE (SOLVER STABILIZED)</div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Narrative Section */}
      <section id="how-it-works" className={`border-t border-[#E5E5E5] dark:border-[#1e1b22] ${darkMode ? "bg-[#17151b]" : "bg-[#FAFAFA]"} py-16`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 mb-12">
            <h3 className="font-sans text-xs font-bold text-[#d9a078] dark:text-[#d9a078] uppercase tracking-widest font-mono">CORE SYSTEM CAPABILITIES</h3>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black dark:text-white uppercase">How PrismFlash Synchronizes multi-chain state</h2>
            <div className="h-0.5 w-16 bg-[#d9a078] dark:bg-[#d9a078] mx-auto mt-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className={`p-6 border border-[#E5E5E5] dark:border-[#1e1b22] ${darkMode ? "bg-[#141217]" : "bg-white"} space-y-4 rounded-none`}>
              <div className="p-3 bg-[#d9a078]/5 dark:bg-[#d9a078]/5 border border-[#d9a078]/10 dark:border-[#d9a078]/10 w-fit">
                <Workflow className="w-5 h-5 text-[#d9a078] dark:text-[#d9a078]" />
              </div>
              <h4 className="font-sans font-bold text-sm text-black dark:text-white uppercase tracking-tight">Multi-VM Intent Routing</h4>
              <p className="text-xs text-[#4a4451] dark:text-[#a09ba8] leading-relaxed font-sans">
                PrismFlash registers user swaps as cryptographic intents. Rather than chaining multiple risky bridges, users broadcast a single intent verified across four distinct virtual machines in a single pipeline.
              </p>
            </div>

            {/* Feature 2 */}
            <div className={`p-6 border border-[#E5E5E5] dark:border-[#1e1b22] ${darkMode ? "bg-[#141217]" : "bg-white"} space-y-4 rounded-none`}>
              <div className="p-3 bg-[#d9a078]/5 dark:bg-[#d9a078]/5 border border-[#d9a078]/10 dark:border-[#d9a078]/10 w-fit">
                <Code2 className="w-5 h-5 text-[#d9a078] dark:text-[#d9a078]" />
              </div>
              <h4 className="font-sans font-bold text-sm text-black dark:text-white uppercase tracking-tight">UltraHonk ZK-Proofs</h4>
              <p className="text-xs text-[#4a4451] dark:text-[#a09ba8] leading-relaxed font-sans">
                Compiles constraints using Noir DSL to enforce non-interactive settlement rules. The proofs ensure that funds locked on Base Sepolia are only cleared on Stellar Soroban if matching payout addresses are verified.
              </p>
            </div>

            {/* Feature 3 */}
            <div className={`p-6 border border-[#E5E5E5] dark:border-[#1e1b22] ${darkMode ? "bg-[#141217]" : "bg-white"} space-y-4 rounded-none`}>
              <div className="p-3 bg-[#d9a078]/5 dark:bg-[#d9a078]/5 border border-[#d9a078]/10 dark:border-[#d9a078]/10 w-fit">
                <Shield className="w-5 h-5 text-[#d9a078] dark:text-[#d9a078]" />
              </div>
              <h4 className="font-sans font-bold text-sm text-black dark:text-white uppercase tracking-tight">TEE Hardware Safeguard</h4>
              <p className="text-xs text-[#4a4451] dark:text-[#a09ba8] leading-relaxed font-sans">
                Secure enclave hardware signatures protect user intent credentials. Users can toggle TEE enforcement for an extra layer of protection, preventing malicious network relays from manipulating pricing commitments.
              </p>
            </div>

            {/* Feature 4 */}
            <div className={`p-6 border border-[#E5E5E5] dark:border-[#1e1b22] ${darkMode ? "bg-[#141217]" : "bg-white"} space-y-4 rounded-none`}>
              <div className="p-3 bg-[#d9a078]/5 dark:bg-[#d9a078]/5 border border-[#d9a078]/10 dark:border-[#d9a078]/10 w-fit">
                <Terminal className="w-5 h-5 text-[#d9a078] dark:text-[#d9a078]" />
              </div>
              <h4 className="font-sans font-bold text-sm text-black dark:text-white uppercase tracking-tight">Off-chain Solver Daemon</h4>
              <p className="text-xs text-[#4a4451] dark:text-[#a09ba8] leading-relaxed font-sans">
                An active TypeScript Solver Daemon listens asynchronously to Stellar ledger state syncs. The instant pricing parameters shift, the daemon broadcasts the mirror state in parallel to base, solana, and movement.
              </p>
            </div>

            {/* Feature 5 */}
            <div className={`p-6 border border-[#E5E5E5] dark:border-[#1e1b22] ${darkMode ? "bg-[#141217]" : "bg-white"} space-y-4 rounded-none`}>
              <div className="p-3 bg-[#d9a078]/5 dark:bg-[#d9a078]/5 border border-[#d9a078]/10 dark:border-[#d9a078]/10 w-fit">
                <Coins className="w-5 h-5 text-[#d9a078] dark:text-[#d9a078]" />
              </div>
              <h4 className="font-sans font-bold text-sm text-black dark:text-white uppercase tracking-tight">Arbitrage Deficit Bounties</h4>
              <p className="text-xs text-[#4a4451] dark:text-[#a09ba8] leading-relaxed font-sans">
                Each target vault tracks its relative divergence factor. If a vault's balance drops below 85% of its target weight, a rebalancing bounty is instantly activated, allowing automated solvers to earn native rewards.
              </p>
            </div>

            {/* Feature 6 */}
            <div className={`p-6 border border-[#E5E5E5] dark:border-[#1e1b22] ${darkMode ? "bg-[#141217]" : "bg-white"} space-y-4 rounded-none`}>
              <div className="p-3 bg-[#d9a078]/5 dark:bg-[#d9a078]/5 border border-[#d9a078]/10 dark:border-[#d9a078]/10 w-fit">
                <Database className="w-5 h-5 text-[#d9a078] dark:text-[#d9a078]" />
              </div>
              <h4 className="font-sans font-bold text-sm text-black dark:text-white uppercase tracking-tight">Bonding Curve Equilibrium</h4>
              <p className="text-xs text-[#4a4451] dark:text-[#a09ba8] leading-relaxed font-sans">
                Globally-coordinated token prices scale relative to collective multi-chain collateral. As liquidity fills up the vaults, the native exchange token's pricing adapts dynamically along a stable mathematical slope.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={onEnterCockpit}
              className="px-8 py-4 bg-[#d9a078] dark:bg-[#c88f68] hover:bg-[#b8825f] dark:hover:bg-[#d9a078] text-white dark:text-black font-sans text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2.5 mx-auto border border-black dark:border-[#d9a078] transition-all cursor-pointer"
            >
              <span>ENTER THE INTERACTIVE SOLVER COCKPIT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t border-[#E5E5E5] dark:border-[#1e1b22] ${darkMode ? "bg-[#141217]" : "bg-[#FAFAFA]"} py-8 px-6 text-center text-[10px] font-mono text-[#666666] dark:text-[#6b6472]`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>PRISMFLASH // CRYPTOGRAPHIC MULTI-VM CLEARINGHOUSE SECURED BY SOLVER DAEMONS</span>
          <div className="flex gap-4">
            <span className="text-[#d9a078] dark:text-[#d9a078] font-bold">STELLAR SOROBAN V26</span>
            <span>•</span>
            <span className="text-[#d9a078] dark:text-[#d9a078] font-bold">NOIR ZK-PROOF V1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
