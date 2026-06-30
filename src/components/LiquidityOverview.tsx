import React, { useState, useEffect, useRef } from "react";
import * as d3 from "d3";
import { Coins, HelpCircle, Sliders, Info, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";

interface LiquidityOverviewProps {
  chains: any;
  darkMode?: boolean;
}

interface ChainLiquidity {
  name: string;
  symbol: string;
  solverBalance: number;
  capacity: number; // Total pool size allocated for solver
  usdValue: number;
  priceUsd: number;
  utilization: number;
}

export const LiquidityOverview: React.FC<LiquidityOverviewProps> = ({ chains, darkMode }) => {
  // Simulator input state: User can enter custom swap amount to see how it affects depth
  const [simulateAmount, setSimulateAmount] = useState<number>(250);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const [hoveredChain, setHoveredChain] = useState<string | null>(null);
  const [tokens, setTokens] = useState<any[]>([]);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Fetch clearinghouse tokens registered dynamically
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const res = await fetch("/api/tokens");
        const data = await res.json();
        if (Array.isArray(data)) {
          setTokens(data);
        }
      } catch (err) {
        console.error("Error fetching clearinghouse tokens:", err);
      }
    };

    fetchTokens();
    const interval = setInterval(fetchTokens, 3000);
    return () => clearInterval(interval);
  }, []);

  // Extract current solver wallet balances from live state, fallback to initial constants
  const baseSolverBalance = chains?.base?.balances?.["SolverWallet"] ?? 5000;
  const solanaSolverBalance = chains?.solana?.balances?.["SolverWallet"] ?? 1500;
  const movementSolverBalance = chains?.movement?.balances?.["SolverWallet"] ?? 25000;

  // Static price conversions for routing evaluation
  const PRICE_USDC = 1.0;
  const PRICE_SOL = 140.0;
  const PRICE_MOVE = 0.85;

  // Formulate chain-specific details
  const chainData: ChainLiquidity[] = [
    {
      name: "Base Sepolia",
      symbol: "USDC",
      solverBalance: baseSolverBalance,
      capacity: 10000, // Total allocated capacity
      priceUsd: PRICE_USDC,
      usdValue: baseSolverBalance * PRICE_USDC,
      utilization: ((10000 - baseSolverBalance) / 10000) * 100,
    },
    {
      name: "Solana Devnet",
      symbol: "SOL",
      solverBalance: solanaSolverBalance,
      capacity: 3000,
      priceUsd: PRICE_SOL,
      usdValue: solanaSolverBalance * PRICE_SOL,
      utilization: ((3000 - solanaSolverBalance) / 3000) * 100,
    },
    {
      name: "Movement Porto",
      symbol: "MOVE",
      solverBalance: movementSolverBalance,
      capacity: 50000,
      priceUsd: PRICE_MOVE,
      usdValue: movementSolverBalance * PRICE_MOVE,
      utilization: ((50000 - movementSolverBalance) / 50000) * 100,
    },
  ];

  const totalTvlUsd = chainData.reduce((acc, c) => acc + c.usdValue, 0);

  // Projected required amounts based on simulator (simulating realistic cross-chain distribution)
  const reqBase = simulateAmount; // Base lock is 1:1 with USDC swap value
  const reqSolana = (simulateAmount * 0.05).toFixed(2); // Solana payout ratio (approx 5% of swap weight in SOL)
  const reqMovement = (simulateAmount * 0.35).toFixed(1); // Movement payout ratio (approx 35% of swap weight in MOVE)

  const isBaseExhausted = Number(reqBase) > baseSolverBalance;
  const isSolanaExhausted = Number(reqSolana) > solanaSolverBalance;
  const isMovementExhausted = Number(reqMovement) > movementSolverBalance;
  const isAnyExhausted = isBaseExhausted || isSolanaExhausted || isMovementExhausted;

  // Setup D3 Chart Visualization
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const container = d3.select(containerRef.current);
    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const parentWidth = containerRef.current.getBoundingClientRect().width || 480;
    const margin = { top: 30, right: 20, bottom: 40, left: 110 };
    const width = parentWidth;
    const height = 180;
    const contentWidth = width - margin.left - margin.right;
    const contentHeight = height - margin.top - margin.bottom;

    svg
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("preserveAspectRatio", "xMinYMin meet");

    const g = svg
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // Chart Data including Simulated Impacts
    const chartItems = chainData.map((c) => {
      let simulatedImpact = 0;
      if (c.name.includes("Base")) simulatedImpact = Number(reqBase);
      if (c.name.includes("Solana")) simulatedImpact = Number(reqSolana);
      if (c.name.includes("Movement")) simulatedImpact = Number(reqMovement);

      return {
        name: c.name,
        symbol: c.symbol,
        capacity: c.capacity,
        available: c.solverBalance,
        simulated: Math.min(c.solverBalance, simulatedImpact),
        remaining: Math.max(0, c.solverBalance - simulatedImpact),
        isExceeded: simulatedImpact > c.solverBalance,
      };
    });

    // Y Scale: Categorical chains
    const y = d3
      .scaleBand()
      .domain(chartItems.map((d) => d.name))
      .range([0, contentHeight])
      .padding(0.3);

    // X Scale: Normalized to percentage of total capacity to fit heterogeneous scales nicely
    const x = d3
      .scaleLinear()
      .domain([0, 100])
      .range([0, contentWidth]);

    // Gridlines
    g.append("g")
      .attr("class", "grid-lines")
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", darkMode ? 0.12 : 0.06)
      .call(
        d3.axisBottom(x)
          .tickSize(contentHeight)
          .tickFormat(() => "")
      );

    // X Axis
    g.append("g")
      .attr("transform", `translate(0,${contentHeight})`)
      .attr("class", "x-axis text-[8px] font-mono")
      .call(d3.axisBottom(x).ticks(5).tickFormat((d) => `${d}%`))
      .call((g) => g.select(".domain").attr("stroke", "currentColor").attr("stroke-opacity", 0.2))
      .call((g) => g.selectAll(".tick line").attr("stroke", "currentColor").attr("stroke-opacity", 0.2))
      .call((g) => g.selectAll("text").attr("fill", "currentColor").attr("opacity", 0.7));

    // Y Axis
    g.append("g")
      .attr("class", "y-axis text-[9px] font-sans font-bold")
      .call(d3.axisLeft(y).tickSize(0))
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll("text").attr("fill", darkMode ? "#E5E5E5" : "#111111"));

    // Label under xAxis
    svg.append("text")
      .attr("x", margin.left + contentWidth / 2)
      .attr("y", height - 6)
      .attr("text-anchor", "middle")
      .attr("class", "text-[8px] font-mono fill-zinc-500 uppercase tracking-tight")
      .text("Solver Wallet Allocation & Routing Depth Percentage");

    // Colors
    const colorCapacity = darkMode ? "#2D2D30" : "#F3F4F6";
    const colorAvailable = "#002FA7"; // Prism Deep Blue
    const colorSimulated = "#FFA500"; // Simulation Impact (Amber)
    const colorExceeded = "#EF4444";  // Insufficient liquidity (Red)

    // Render Bars
    chartItems.forEach((d) => {
      const yPos = y(d.name) || 0;
      const barHeight = y.bandwidth();

      // 1. Total Allocated capacity background (100%)
      g.append("rect")
        .attr("x", 0)
        .attr("y", yPos)
        .attr("width", x(100))
        .attr("height", barHeight)
        .attr("fill", colorCapacity)
        .attr("stroke", darkMode ? "#3F3F46" : "#E5E5E5")
        .attr("stroke-width", 1);

      // 2. Active solver liquidity level bar
      const availablePct = (d.available / d.capacity) * 100;
      g.append("rect")
        .attr("x", 0)
        .attr("y", yPos)
        .attr("width", x(availablePct))
        .attr("height", barHeight)
        .attr("fill", darkMode ? "#3B82F6" : colorAvailable)
        .attr("opacity", 0.35);

      // 3. Simulated utilization slice
      const simulatedPct = (d.simulated / d.capacity) * 100;
      if (simulatedPct > 0) {
        g.append("rect")
          .attr("x", 0)
          .attr("y", yPos)
          .attr("width", x(simulatedPct))
          .attr("height", barHeight)
          .attr("fill", d.isExceeded ? colorExceeded : colorSimulated)
          .attr("opacity", d.isExceeded ? 0.95 : 0.85);
      }

      // 4. Exceeding warning indicator strip
      if (d.isExceeded) {
        g.append("rect")
          .attr("x", x(availablePct))
          .attr("y", yPos)
          .attr("width", x(100) - x(availablePct))
          .attr("height", barHeight)
          .attr("fill", "url(#exceeded-stripe)")
          .attr("opacity", 0.25);
      }

      // Text summary label inside/next to the bar
      g.append("text")
        .attr("x", x(Math.max(availablePct, 5)) + 6)
        .attr("y", yPos + barHeight / 2 + 3)
        .attr("class", "text-[8.5px] font-mono fill-zinc-600 font-bold")
        .text(`${d.available.toLocaleString()} ${d.symbol}`);
    });

    // Add striped pattern for exceeded areas
    const defs = svg.append("defs");
    const pattern = defs.append("pattern")
      .attr("id", "exceeded-stripe")
      .attr("width", 8)
      .attr("height", 8)
      .attr("patternUnits", "userSpaceOnUse")
      .attr("patternTransform", "rotate(45)");

    pattern.append("line")
      .attr("x1", 0)
      .attr("y1", 0)
      .attr("x2", 0)
      .attr("y2", 8)
      .attr("stroke", "#EF4444")
      .attr("stroke-width", 2);

  }, [chains, darkMode, simulateAmount, reqBase, reqSolana, reqMovement]);

  return (
    <div id="liquidity-overview-card" className="border border-[#E5E5E5] rounded-none bg-white flex flex-col">
      <div className="p-4 bg-[#FAFAFA] border-b border-[#E5E5E5] flex items-center justify-between">
        <h2 className="font-sans font-bold text-xs text-black uppercase tracking-tighter flex items-center gap-2">
          <Coins className="w-4 h-4 text-[#002FA7]" /> 6.0 Cross-Chain Liquidity Overview
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowTooltip(!showTooltip)}
            className="text-zinc-400 hover:text-[#002FA7] cursor-pointer"
            title="Protocol Liquidity Information"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1 font-mono text-[9px] bg-white border border-[#E5E5E5] px-2 py-0.5">
            <span className="text-[#666666] uppercase">Pool Cap:</span>
            <span className="text-[#002FA7] font-bold">${totalTvlUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD</span>
          </div>
        </div>
      </div>

      {showTooltip && (
        <div className="p-3.5 bg-blue-50/50 border-b border-[#E5E5E5] text-[10px] text-zinc-700 leading-relaxed font-sans space-y-1.5 animate-fadeIn">
          <div className="flex items-center gap-1.5 font-bold text-[#002FA7] uppercase text-[9.5px]">
            <Info className="w-3.5 h-3.5" /> Solver Liquidity Pool Depth Architecture
          </div>
          <p>
            Prism executes cross-chain transfers utilizing a distributed peer solver pool system. When a user locks assets on Base (EVM), 
            licensed solvers detect the commitment and disburse fast payouts on Solana (SVM) and Movement (MoveVM) instantly. 
            Solvers collateralize their vaults to guarantee execution security.
          </p>
          <p className="text-[9px] text-[#666666]">
            This telemetry widget displays current available liquidity in each solver's settlement wallet. Use the slider below to simulate 
            varying transaction sizes and observe routing depletion metrics before committing swaps.
          </p>
        </div>
      )}

      {/* Numerical Depth Analytics */}
      <div className="p-4 grid grid-cols-3 gap-3 border-b border-[#E5E5E5] bg-white text-black">
        {chainData.map((c, idx) => (
          <div
            key={idx}
            className={`border border-[#E5E5E5] p-2.5 space-y-1 transition-all ${
              hoveredChain === c.name ? "bg-[#FAFAFA] border-[#002FA7]" : "bg-white"
            }`}
            onMouseEnter={() => setHoveredChain(c.name)}
            onMouseLeave={() => setHoveredChain(null)}
          >
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-sans font-bold text-[#666666] uppercase tracking-tight">
                {c.name.split(" ")[0]} Pool
              </span>
              <span className="text-[8.5px] font-mono text-zinc-400">
                1 {c.symbol} = ${c.priceUsd}
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-0.5">
              <span className="text-sm font-mono font-bold">
                {c.solverBalance.toLocaleString(undefined, { maximumFractionDigits: 1 })}
                <span className="text-[10px] font-sans text-zinc-500 font-medium ml-1">{c.symbol}</span>
              </span>
            </div>
            <div className="flex justify-between items-center text-[8.5px] font-mono pt-1 text-zinc-500 border-t border-dashed border-[#F0F0F0]">
              <span>Capacity: {c.capacity.toLocaleString()}</span>
              <span className={`font-bold ${c.utilization > 50 ? "text-amber-600" : "text-[#00A86B]"}`}>
                {c.utilization.toFixed(0)}% Utilized
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Graphical D3 Depth Plot */}
      <div className="bg-white p-2 flex justify-center relative min-h-[180px]" ref={containerRef}>
        <svg ref={svgRef} className="text-black" />
      </div>

      {/* INTERACTIVE ROUTING DEPTH SIMULATOR */}
      <div className="p-4 border-t border-[#E5E5E5] bg-[#FAFAFA] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-sans font-bold text-[10px] text-black uppercase tracking-tight">
            <Sliders className="w-3.5 h-3.5 text-[#002FA7]" /> Live Route Capacity Simulator
          </div>
          <div className="font-mono text-[10.5px] bg-white border border-[#E5E5E5] px-2 py-0.5 font-bold">
            Simulated Swapping: <span className="text-[#002FA7]">{simulateAmount} USDC</span>
          </div>
        </div>

        {/* Amount Slider Control */}
        <div className="space-y-1.5">
          <input
            type="range"
            min="10"
            max="1500"
            step="10"
            value={simulateAmount}
            onChange={(e) => setSimulateAmount(Number(e.target.value))}
            className="w-full h-1.5 bg-[#E5E5E5] rounded-none appearance-none cursor-pointer accent-[#002FA7]"
          />
          <div className="flex justify-between text-[8px] font-mono text-zinc-400 uppercase">
            <span>10 USDC (Min Route)</span>
            <span>750 USDC</span>
            <span>1,500 USDC (Max Route)</span>
          </div>
        </div>

        {/* Projected Solver Load Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 font-mono text-[9px]">
          {/* Base load */}
          <div className={`p-2 border ${
            isBaseExhausted 
              ? "bg-red-50 border-red-300 text-red-900" 
              : "bg-white border-[#E5E5E5]"
          }`}>
            <span className="block text-[8px] uppercase text-zinc-500 font-bold">Projected Base Lock</span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-bold">{reqBase} USDC</span>
              {isBaseExhausted ? (
                <span className="text-[8px] font-bold text-red-600 bg-red-100 px-1">OVER DRAIN</span>
              ) : (
                <span className="text-[8px] font-bold text-zinc-500">{(reqBase / baseSolverBalance * 100).toFixed(0)}% Load</span>
              )}
            </div>
          </div>

          {/* Solana load */}
          <div className={`p-2 border ${
            isSolanaExhausted 
              ? "bg-red-50 border-red-300 text-red-900" 
              : "bg-white border-[#E5E5E5]"
          }`}>
            <span className="block text-[8px] uppercase text-zinc-500 font-bold">Projected Solana Payout</span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-bold">{reqSolana} SOL</span>
              {isSolanaExhausted ? (
                <span className="text-[8px] font-bold text-red-600 bg-red-100 px-1">OVER DRAIN</span>
              ) : (
                <span className="text-[8px] font-bold text-zinc-500">{(Number(reqSolana) / solanaSolverBalance * 100).toFixed(0)}% Load</span>
              )}
            </div>
          </div>

          {/* Movement load */}
          <div className={`p-2 border ${
            isMovementExhausted 
              ? "bg-red-50 border-red-300 text-red-900" 
              : "bg-white border-[#E5E5E5]"
          }`}>
            <span className="block text-[8px] uppercase text-zinc-500 font-bold">Projected Movement Payout</span>
            <div className="flex items-center justify-between mt-1">
              <span className="font-bold">{reqMovement} MOVE</span>
              {isMovementExhausted ? (
                <span className="text-[8px] font-bold text-red-600 bg-red-100 px-1">OVER DRAIN</span>
              ) : (
                <span className="text-[8px] font-bold text-zinc-500">{(Number(reqMovement) / movementSolverBalance * 100).toFixed(0)}% Load</span>
              )}
            </div>
          </div>
        </div>

        {/* Feasibility Alert Message */}
        <div className="pt-1.5 border-t border-[#E5E5E5]">
          {isAnyExhausted ? (
            <div className="bg-red-500/10 border border-red-500/30 p-2.5 text-red-800 text-[10px] leading-relaxed flex gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-red-600 animate-pulse" />
              <div>
                <strong className="block font-bold">INSUFFICIENT SOLVER LIQUIDITY FOR CURRENT ROUTE SIZE</strong>
                Simulated transaction requirements exceed active Solver pool capacities on one or more target networks. Splitting order volumes or selecting a smaller intent template is highly recommended.
              </div>
            </div>
          ) : (
            <div className="bg-emerald-500/10 border border-emerald-500/30 p-2.5 text-emerald-800 text-[10px] leading-relaxed flex gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-[#00A86B]" />
              <div>
                <strong className="block font-bold">ROUTE FEASIBILITY METRICS SECURED</strong>
                Fully redundant liquidity depth confirmed across all three networks. Solvers have ample margin to settle claims concurrently with minimal slippage overhead.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CLEARINGHOUSE TOKEN DIRECTORY */}
      <div className="p-4 border-t border-[#E5E5E5] bg-white space-y-2">
        <h3 className="font-sans font-bold text-[10px] text-black uppercase tracking-tight flex items-center gap-1.5">
          <Zap className="w-3.5 h-3.5 text-[#002FA7]" /> ZK Multi-Chain Clearinghouse Tokens
        </h3>
        <p className="text-[9px] text-[#666666] leading-relaxed">
          Dynamic matching mock test tokens active across registered VM architectures. Create yours by running: <code className="font-mono bg-zinc-100 text-[#002FA7] px-1 py-0.5 rounded">npm run create-tokens</code>
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
          {tokens.length === 0 ? (
            <div className="text-[9.5px] text-zinc-400 italic">No registered clearinghouse tokens.</div>
          ) : (
            tokens.map((tok, idx) => (
              <div key={idx} className="border border-[#E5E5E5] p-2 bg-[#FAFAFA] flex flex-col justify-between space-y-1 font-mono text-[9.5px]">
                <div className="flex items-center justify-between">
                  <span className="font-sans font-bold text-black">{tok.name}</span>
                  <span className="bg-blue-100 text-[#002FA7] font-bold px-1.5 py-0.5 text-[8px] rounded uppercase">{tok.symbol}</span>
                </div>
                <div className="flex justify-between items-center text-zinc-500 text-[8.5px] pt-0.5 border-t border-dashed border-zinc-200">
                  <span>Supply: {tok.supply.toLocaleString()}</span>
                  <span className="uppercase text-[8px] bg-zinc-200/60 px-1 font-sans">{tok.chains.join(" | ")}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
