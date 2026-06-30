/**
 * Real Blockchain Wallet Provider & RPC Balance Aggregator
 * Connects to MetaMask (Base EVM), Phantom (Solana), Freighter (Stellar), and Petra/Martian (Movement)
 * Queries live public RPC endpoints for authentic balances on testnets.
 */

export interface WalletState {
  baseAddress: string | null;
  baseBalance: string;
  stellarAddress: string | null;
  stellarBalance: string;
  solanaAddress: string | null;
  solanaBalance: string;
  movementAddress: string | null;
  movementBalance: string;
}

export class WalletProvider {
  /**
   * Fetch real Base Sepolia ETH balance using official JSON-RPC
   */
  static async fetchBaseBalance(address: string): Promise<string> {
    try {
      const response = await fetch("https://sepolia.base.org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getBalance",
          params: [address, "latest"]
        })
      });
      const data = await response.json();
      if (data.result) {
        const wei = BigInt(data.result);
        const eth = Number(wei) / 1e18;
        return eth.toFixed(4);
      }
      return "0.0000";
    } catch (e) {
      console.error("Failed to fetch real Base balance", e);
      return "0.0000";
    }
  }

  /**
   * Fetch real Stellar Testnet XLM balance using the public Horizon API
   */
  static async fetchStellarBalance(address: string): Promise<string> {
    try {
      const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
      if (response.ok) {
        const data = await response.json();
        const nativeAsset = data.balances?.find((b: any) => b.asset_type === "native");
        return nativeAsset ? parseFloat(nativeAsset.balance).toFixed(2) : "0.00";
      }
      return "0.00";
    } catch (e) {
      console.error("Failed to fetch real Stellar balance", e);
      return "0.00";
    }
  }

  /**
   * Fetch real Solana Devnet SOL balance using official JSON-RPC
   */
  static async fetchSolanaBalance(address: string): Promise<string> {
    try {
      const response = await fetch("https://api.devnet.solana.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "getBalance",
          params: [address]
        })
      });
      const data = await response.json();
      if (data.result) {
        const lamports = data.result.value;
        const sol = lamports / 1e9;
        return sol.toFixed(3);
      }
      return "0.000";
    } catch (e) {
      console.error("Failed to fetch real Solana balance", e);
      return "0.000";
    }
  }

  /**
   * Fetch real Movement Porto Testnet MOVE/APT balance from official node API
   */
  static async fetchMovementBalance(address: string): Promise<string> {
    try {
      // Normalize address formatting if needed
      const cleanAddress = address.startsWith("0x") ? address : `0x${address}`;
      const response = await fetch(
        `https://aptos.testnet.porto.movementlabs.xyz/v1/accounts/${cleanAddress}/resource/0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`
      );
      if (response.ok) {
        const data = await response.json();
        const value = data.data?.coin?.value;
        if (value) {
          const moveTokens = Number(value) / 1e8;
          return moveTokens.toFixed(2);
        }
      }
      return "0.00";
    } catch (e) {
      console.error("Failed to fetch real Movement balance", e);
      return "0.00";
    }
  }

  /**
   * Connect to MetaMask / EVM Wallet
   */
  static async connectBaseWallet(): Promise<string | null> {
    const ethereum = (window as any).ethereum;
    if (ethereum) {
      try {
        const accounts = await ethereum.request({ method: "eth_requestAccounts" });
        return accounts[0] || null;
      } catch (e) {
        console.error("EVM Connection error", e);
        return null;
      }
    }
    return null;
  }

  /**
   * Connect to Phantom Solana Wallet
   */
  static async connectSolanaWallet(): Promise<string | null> {
    const solana = (window as any).solana;
    if (solana && solana.isPhantom) {
      try {
        const resp = await solana.connect();
        return resp.publicKey.toString();
      } catch (e) {
        console.error("Solana Connection error", e);
        return null;
      }
    }
    return null;
  }

  /**
   * Connect to Freighter Stellar Wallet
   */
  static async connectStellarWallet(): Promise<string | null> {
    const freighter = (window as any).freighterApi || (window as any).stellar;
    if (freighter) {
      try {
        // Some Freighter API versions use getPublicKey, others use window.stellar.getPublicKey
        if (typeof freighter.getPublicKey === "function") {
          const pubkey = await freighter.getPublicKey();
          return pubkey || null;
        }
      } catch (e) {
        console.error("Stellar Freighter connection error", e);
        return null;
      }
    }
    return null;
  }

  /**
   * Connect to Aptos / Movement Wallet (Petra/Martian)
   */
  static async connectMovementWallet(): Promise<string | null> {
    const aptos = (window as any).aptos || (window as any).martian;
    if (aptos) {
      try {
        const response = await aptos.connect();
        return response.address || null;
      } catch (e) {
        console.error("Movement Connection error", e);
        return null;
      }
    }
    return null;
  }
}
