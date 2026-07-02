/**
 * PrismZK public-testnet wallet provider layer.
 *
 * Supports real browser wallets when present:
 * - Base Sepolia / EVM: injected EIP-1193 wallets (MetaMask, Coinbase, Rabby, WalletConnect-injected)
 * - Solana Devnet: Phantom, Solflare, Backpack, generic injected Solana provider
 * - Stellar Testnet: Freighter-compatible APIs and Stellar Wallets Kit-compatible globals
 * - Movement/Aptos: Petra, Martian, Pontem-style injected providers
 *
 * Manual address fallback stays in the UI, but only provider-returned connections should be
 * considered signing-capable by execution flows.
 */

export interface ConnectedWallet {
  chain: string;
  address: string;
  provider: string;
  canSign: boolean;
}

const BASE_SEPOLIA = {
  chainId: "0x14a34", // 84532
  chainName: "Base Sepolia",
  nativeCurrency: { name: "Sepolia Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: ["https://sepolia.base.org"],
  blockExplorerUrls: ["https://sepolia.basescan.org"],
};

const pick = (...values: any[]) => values.find(Boolean);

export class WalletProvider {
  static getProviderInventory(): Record<string, string[]> {
    const w = window as any;
    return {
      base: [
        w.ethereum?.isMetaMask && "MetaMask",
        w.ethereum?.isCoinbaseWallet && "Coinbase Wallet",
        w.coinbaseWalletExtension && "Coinbase Wallet Extension",
        w.ethereum && "Injected EIP-1193",
      ].filter(Boolean),
      solana: [
        w.phantom?.solana && "Phantom",
        w.solflare && "Solflare",
        w.backpack?.solana && "Backpack",
        w.solana && "Injected Solana",
      ].filter(Boolean),
      stellar: [
        w.freighterApi && "Freighter API",
        w.stellar?.freighterApi && "Stellar Freighter",
        w.stellar && "Injected Stellar",
      ].filter(Boolean),
      movement: [
        w.aptos && "Petra/Aptos",
        w.martian && "Martian",
        w.pontem && "Pontem",
        w.movement && "Movement",
      ].filter(Boolean),
    };
  }

  static async fetchBaseBalance(address: string): Promise<string> {
    try {
      const response = await fetch("https://sepolia.base.org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBalance", params: [address, "latest"] }),
      });
      const data = await response.json();
      if (data.result) return (Number(BigInt(data.result)) / 1e18).toFixed(4);
    } catch (e) {
      console.error("Failed to fetch real Base balance", e);
    }
    return "0.0000";
  }

  static async fetchStellarBalance(address: string): Promise<string> {
    try {
      const response = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
      if (response.ok) {
        const data = await response.json();
        const nativeAsset = data.balances?.find((b: any) => b.asset_type === "native");
        return nativeAsset ? parseFloat(nativeAsset.balance).toFixed(2) : "0.00";
      }
    } catch (e) {
      console.error("Failed to fetch real Stellar balance", e);
    }
    return "0.00";
  }

  static async fetchSolanaBalance(address: string): Promise<string> {
    try {
      const response = await fetch("https://api.devnet.solana.com", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "getBalance", params: [address] }),
      });
      const data = await response.json();
      if (data.result) return (data.result.value / 1e9).toFixed(3);
    } catch (e) {
      console.error("Failed to fetch real Solana balance", e);
    }
    return "0.000";
  }

  static async fetchMovementBalance(address: string): Promise<string> {
    try {
      const cleanAddress = address.startsWith("0x") ? address : `0x${address}`;
      const endpoints = [
        `https://testnet.movementnetwork.xyz/v1/accounts/${cleanAddress}/resource/0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`,
        `https://aptos.testnet.porto.movementlabs.xyz/v1/accounts/${cleanAddress}/resource/0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`,
      ];
      for (const url of endpoints) {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const value = data.data?.coin?.value;
          if (value) return (Number(value) / 1e8).toFixed(2);
        }
      }
    } catch (e) {
      console.error("Failed to fetch real Movement balance", e);
    }
    return "0.00";
  }

  static async connectBaseWallet(): Promise<string | null> {
    const w = window as any;
    const ethereum = pick(w.ethereum, w.coinbaseWalletExtension);
    if (!ethereum?.request) return null;
    try {
      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      try {
        await ethereum.request({ method: "wallet_switchEthereumChain", params: [{ chainId: BASE_SEPOLIA.chainId }] });
      } catch (switchErr: any) {
        if (switchErr?.code === 4902 || `${switchErr?.message || ""}`.includes("Unrecognized")) {
          await ethereum.request({ method: "wallet_addEthereumChain", params: [BASE_SEPOLIA] });
        }
      }
      return accounts?.[0] || null;
    } catch (e) {
      console.error("EVM wallet connection error", e);
      return null;
    }
  }

  static getSolanaProvider(): any {
    const w = window as any;
    return pick(w.phantom?.solana, w.backpack?.solana, w.solflare, w.solana);
  }

  static async connectSolanaWallet(): Promise<string | null> {
    const solana = WalletProvider.getSolanaProvider();
    if (!solana?.connect) return null;
    try {
      const resp = await solana.connect({ onlyIfTrusted: false });
      return pick(resp?.publicKey?.toString?.(), solana.publicKey?.toString?.()) || null;
    } catch (e) {
      console.error("Solana wallet connection error", e);
      return null;
    }
  }

  static async connectStellarWallet(): Promise<string | null> {
    const w = window as any;
    const freighter = pick(w.freighterApi, w.stellar?.freighterApi, w.stellar);
    if (!freighter) return null;
    try {
      if (typeof freighter.requestAccess === "function") return (await freighter.requestAccess()) || null;
      if (typeof freighter.getAddress === "function") {
        const result = await freighter.getAddress();
        return result?.address || result || null;
      }
      if (typeof freighter.getPublicKey === "function") return (await freighter.getPublicKey()) || null;
    } catch (e) {
      console.error("Stellar wallet connection error", e);
    }
    return null;
  }

  static async connectMovementWallet(): Promise<string | null> {
    const w = window as any;
    const aptos = pick(w.aptos, w.martian, w.pontem, w.movement);
    if (!aptos?.connect) return null;
    try {
      const response = await aptos.connect();
      return pick(response?.address, response?.publicKey, aptos.account?.address?.toString?.()) || null;
    } catch (e) {
      console.error("Movement wallet connection error", e);
      return null;
    }
  }

  static async signBaseMessage(message: string): Promise<string | null> {
    const ethereum = (window as any).ethereum;
    if (!ethereum?.request) return null;
    const accounts = await ethereum.request({ method: "eth_requestAccounts" });
    return ethereum.request({ method: "personal_sign", params: [message, accounts[0]] });
  }

  static async signSolanaMessage(message: string): Promise<string | null> {
    const solana = WalletProvider.getSolanaProvider();
    if (!solana?.signMessage) return null;
    const encoded = new TextEncoder().encode(message);
    const signed = await solana.signMessage(encoded, "utf8");
    return Array.from(signed.signature as Uint8Array).map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  static async signStellarTransaction(xdr: string, networkPassphrase = "Test SDF Network ; September 2015"): Promise<string | null> {
    const w = window as any;
    const freighter = pick(w.freighterApi, w.stellar?.freighterApi, w.stellar);
    if (!freighter?.signTransaction) return null;
    const result = await freighter.signTransaction(xdr, { networkPassphrase });
    return result?.signedTxXdr || result || null;
  }
}
