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
    <div className={`min-h-screen font-sans ${darkMode ? "bg-zinc-950 text-white" : "bg-[#F9F9F9] text-[#000000]"} flex flex-col transition-colors duration-300`}>
      {/* Dynamic Background Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e5e5e5_1px,transparent_1px),linear-gradient(to_bottom,#e5e5e5_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 dark:opacity-10 pointer-events-none" />

      {/* Landing Navbar */}
      <header className={`border-b border-[#E5E5E5] dark:border-zinc-800 ${darkMode ? "bg-zinc-900/80" : "bg-white/80"} backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50`}>
        <div className="flex items-center gap-3">
          <div className="border border-black dark:border-white p-2 bg-white dark:bg-zinc-800">
            <Cpu className="w-5 h-5 text-[#002FA7] dark:text-cyan-400" />
          </div>
          <div>
            <h1 className="font-sans text-sm font-bold tracking-widest text-black dark:text-white uppercase">PRISMFLASH</h1>
            <p className="text-[9px] text-[#666666] dark:text-zinc-400 font-mono uppercase tracking-tight">Multi-VM Settlement Protocol</p>
          </div>
        </div>

        <button
          onClick={onEnterCockpit}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-black dark:border-cyan-400 bg-[#002FA7] dark:bg-cyan-500 hover:bg-[#001D6E] dark:hover:bg-cyan-400 text-white dark:text-black font-mono text-[10px] uppercase font-bold transition-all cursor-pointer"
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
              className="inline-flex items-center gap-2 px-3 py-1 border border-[#002FA7]/30 dark:border-cyan-400/30 bg-[#002FA7]/5 dark:bg-cyan-400/5 font-mono text-[10px] font-bold text-[#002FA7] dark:text-cyan-400 uppercase tracking-widest"
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
              <span className="text-[#002FA7] dark:text-cyan-400 font-mono font-medium lowercase">intent</span> control layer
            </motion.h2>

            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed font-sans max-w-xl"
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
                className="px-6 py-4 bg-black dark:bg-cyan-400 hover:bg-[#002FA7] dark:hover:bg-cyan-300 text-white dark:text-black font-sans text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 transition-all cursor-pointer border border-black dark:border-cyan-400 shadow-md"
              >
                <span>ENTER THE SOLVER COCKPIT</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <a
                href="#how-it-works"
                className="px-6 py-4 bg-white dark:bg-zinc-900 hover:bg-[#FAFAFA] dark:hover:bg-zinc-800 text-black dark:text-white border border-[#E5E5E5] dark:border-zinc-800 font-mono text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
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
              className={`border border-[#E5E5E5] dark:border-zinc-800 ${darkMode ? "bg-zinc-900/90" : "bg-white/90"} p-6 relative`}
            >
              {/* Corner Accents */}
              <div className="absolute top-0 left-0 w-2.5 h-2.5 border-t border-l border-black dark:border-cyan-400" />
              <div className="absolute top-0 right-0 w-2.5 h-2.5 border-t border-r border-black dark:border-cyan-400" />
              <div className="absolute bottom-0 left-0 w-2.5 h-2.5 border-b border-l border-black dark:border-cyan-400" />
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 border-b border-r border-black dark:border-cyan-400" />

              <div className="flex items-center justify-between border-b border-[#E5E5E5] dark:border-zinc-800 pb-3 mb-4">
                <span className="text-[10px] font-mono text-[#666666] dark:text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-[#002FA7] dark:text-cyan-400" />
                  REAL-TIME PIPELINE DIAGNOSTIC
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              </div>

              {/* Steps Visualizer */}
              <div className="space-y-4">
                <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-[#E5E5E5] dark:border-zinc-800 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-none bg-[#002FA7]/10 dark:bg-cyan-400/10 flex items-center justify-center text-[10px] font-mono font-bold text-[#002FA7] dark:text-cyan-400 border border-[#002FA7]/20">
                    EVM
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[11px] font-bold text-black dark:text-white uppercase font-sans">1. LOCK INTENT</h4>
                    <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono uppercase">Deposit committed to Base Sepolia Escrow</p>
                  </div>
                  <Lock className="w-4 h-4 text-zinc-400" />
                </div>

                <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-[#E5E5E5] dark:border-zinc-800 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-none bg-[#002FA7]/10 dark:bg-cyan-400/10 flex items-center justify-center text-[10px] font-mono font-bold text-[#002FA7] dark:text-cyan-400 border border-[#002FA7]/20">
                    ZK
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[11px] font-bold text-black dark:text-white uppercase font-sans">2. NOIR COMPILER</h4>
                    <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono uppercase">UltraHonk zero-knowledge proof generated</p>
                  </div>
                  <Shield className="w-4 h-4 text-zinc-400" />
                </div>

                <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-[#E5E5E5] dark:border-zinc-800 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-none bg-[#002FA7]/10 dark:bg-cyan-400/10 flex items-center justify-center text-[10px] font-mono font-bold text-[#002FA7] dark:text-cyan-400 border border-[#002FA7]/20">
                    STE
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[11px] font-bold text-black dark:text-white uppercase font-sans">3. SOROBAN VERIFIER</h4>
                    <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono uppercase">BN254 curve pairing clearance verified</p>
                  </div>
                  <Globe className="w-4 h-4 text-[#002FA7] dark:text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
                </div>

                <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-[#E5E5E5] dark:border-zinc-800 flex items-center gap-3">
                  <div className="w-6 h-6 rounded-none bg-[#002FA7]/10 dark:bg-cyan-400/10 flex items-center justify-center text-[10px] font-mono font-bold text-[#002FA7] dark:text-cyan-400 border border-[#002FA7]/20">
                    SOL
                  </div>
                  <div className="flex-1">
                    <h4 className="text-[11px] font-bold text-black dark:text-white uppercase font-sans">4. TARGET DISBURSAL</h4>
                    <p className="text-[9px] text-zinc-500 dark:text-zinc-400 font-mono uppercase">Solana & Movement parallel spoke vault payout</p>
                  </div>
                  <Coins className="w-4 h-4 text-[#00A86B]" />
                </div>
              </div>

              {/* State Status Log Box */}
              <div className="mt-4 p-2.5 bg-black text-emerald-400 font-mono text-[8px] border border-zinc-800 leading-tight">
                <div>[SYSTEM] SOLVER_DAEMON_LISTENER: PORT 3000 ONLINE</div>
                <div>[SOROBAN] SUBSCRIBED TO LEDGER STATE SYNCS</div>
                <div>[STATUS] Δ_i EQUILIBRIUM ACTIVE (SOLVER STABILIZED)</div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      {/* Narrative Section */}
      <section id="how-it-works" className={`border-t border-[#E5E5E5] dark:border-zinc-800 ${darkMode ? "bg-zinc-900" : "bg-[#FAFAFA]"} py-16`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-3 mb-12">
            <h3 className="font-sans text-xs font-bold text-[#002FA7] dark:text-cyan-400 uppercase tracking-widest font-mono">CORE SYSTEM CAPABILITIES</h3>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black dark:text-white uppercase">How PrismFlash Synchronizes multi-chain state</h2>
            <div className="h-0.5 w-16 bg-[#002FA7] dark:bg-cyan-400 mx-auto mt-2" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className={`p-6 border border-[#E5E5E5] dark:border-zinc-800 ${darkMode ? "bg-zinc-950" : "bg-white"} space-y-4 rounded-none`}>
              <div className="p-3 bg-[#002FA7]/5 dark:bg-cyan-400/5 border border-[#002FA7]/10 dark:border-cyan-400/10 w-fit">
                <Workflow className="w-5 h-5 text-[#002FA7] dark:text-cyan-400" />
              </div>
              <h4 className="font-sans font-bold text-sm text-black dark:text-white uppercase tracking-tight">Multi-VM Intent Routing</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                PrismFlash registers user swaps as cryptographic intents. Rather than chaining multiple risky bridges, users broadcast a single intent verified across four distinct virtual machines in a single pipeline.
              </p>
            </div>

            {/* Feature 2 */}
            <div className={`p-6 border border-[#E5E5E5] dark:border-zinc-800 ${darkMode ? "bg-zinc-950" : "bg-white"} space-y-4 rounded-none`}>
              <div className="p-3 bg-[#002FA7]/5 dark:bg-cyan-400/5 border border-[#002FA7]/10 dark:border-cyan-400/10 w-fit">
                <Code2 className="w-5 h-5 text-[#002FA7] dark:text-cyan-400" />
              </div>
              <h4 className="font-sans font-bold text-sm text-black dark:text-white uppercase tracking-tight">UltraHonk ZK-Proofs</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                Compiles constraints using Noir DSL to enforce non-interactive settlement rules. The proofs ensure that funds locked on Base Sepolia are only cleared on Stellar Soroban if matching payout addresses are verified.
              </p>
            </div>

            {/* Feature 3 */}
            <div className={`p-6 border border-[#E5E5E5] dark:border-zinc-800 ${darkMode ? "bg-zinc-950" : "bg-white"} space-y-4 rounded-none`}>
              <div className="p-3 bg-[#002FA7]/5 dark:bg-cyan-400/5 border border-[#002FA7]/10 dark:border-cyan-400/10 w-fit">
                <Shield className="w-5 h-5 text-[#002FA7] dark:text-cyan-400" />
              </div>
              <h4 className="font-sans font-bold text-sm text-black dark:text-white uppercase tracking-tight">TEE Hardware Safeguard</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                Secure enclave hardware signatures protect user intent credentials. Users can toggle TEE enforcement for an extra layer of protection, preventing malicious network relays from manipulating pricing commitments.
              </p>
            </div>

            {/* Feature 4 */}
            <div className={`p-6 border border-[#E5E5E5] dark:border-zinc-800 ${darkMode ? "bg-zinc-950" : "bg-white"} space-y-4 rounded-none`}>
              <div className="p-3 bg-[#002FA7]/5 dark:bg-cyan-400/5 border border-[#002FA7]/10 dark:border-cyan-400/10 w-fit">
                <Terminal className="w-5 h-5 text-[#002FA7] dark:text-cyan-400" />
              </div>
              <h4 className="font-sans font-bold text-sm text-black dark:text-white uppercase tracking-tight">Off-chain Solver Daemon</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                An active TypeScript Solver Daemon listens asynchronously to Stellar ledger state syncs. The instant pricing parameters shift, the daemon broadcasts the mirror state in parallel to base, solana, and movement.
              </p>
            </div>

            {/* Feature 5 */}
            <div className={`p-6 border border-[#E5E5E5] dark:border-zinc-800 ${darkMode ? "bg-zinc-950" : "bg-white"} space-y-4 rounded-none`}>
              <div className="p-3 bg-[#002FA7]/5 dark:bg-cyan-400/5 border border-[#002FA7]/10 dark:border-cyan-400/10 w-fit">
                <Coins className="w-5 h-5 text-[#002FA7] dark:text-cyan-400" />
              </div>
              <h4 className="font-sans font-bold text-sm text-black dark:text-white uppercase tracking-tight">Arbitrage Deficit Bounties</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                Each target vault tracks its relative divergence factor. If a vault's balance drops below 85% of its target weight, a rebalancing bounty is instantly activated, allowing automated solvers to earn native rewards.
              </p>
            </div>

            {/* Feature 6 */}
            <div className={`p-6 border border-[#E5E5E5] dark:border-zinc-800 ${darkMode ? "bg-zinc-950" : "bg-white"} space-y-4 rounded-none`}>
              <div className="p-3 bg-[#002FA7]/5 dark:bg-cyan-400/5 border border-[#002FA7]/10 dark:border-cyan-400/10 w-fit">
                <Database className="w-5 h-5 text-[#002FA7] dark:text-cyan-400" />
              </div>
              <h4 className="font-sans font-bold text-sm text-black dark:text-white uppercase tracking-tight">Bonding Curve Equilibrium</h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-sans">
                Globally-coordinated token prices scale relative to collective multi-chain collateral. As liquidity fills up the vaults, the native exchange token's pricing adapts dynamically along a stable mathematical slope.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={onEnterCockpit}
              className="px-8 py-4 bg-[#002FA7] dark:bg-cyan-500 hover:bg-[#001D6E] dark:hover:bg-cyan-400 text-white dark:text-black font-sans text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2.5 mx-auto border border-black dark:border-cyan-400 transition-all cursor-pointer"
            >
              <span>ENTER THE INTERACTIVE SOLVER COCKPIT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={`border-t border-[#E5E5E5] dark:border-zinc-800 ${darkMode ? "bg-zinc-950" : "bg-[#FAFAFA]"} py-8 px-6 text-center text-[10px] font-mono text-[#666666] dark:text-zinc-500`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>PRISMFLASH // CRYPTOGRAPHIC MULTI-VM CLEARINGHOUSE SECURED BY SOLVER DAEMONS</span>
          <div className="flex gap-4">
            <span className="text-[#002FA7] dark:text-cyan-400 font-bold">STELLAR SOROBAN V26</span>
            <span>•</span>
            <span className="text-[#002FA7] dark:text-cyan-400 font-bold">NOIR ZK-PROOF V1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
