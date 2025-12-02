/**
 * Solana Wallet Context
 *
 * Provides Solana wallet connectivity for BillHaven using @solana/wallet-adapter.
 * Supports: Phantom, Solflare, Backpack, Coinbase Wallet, Trust Wallet
 *
 * Features:
 * - Auto-connect on page load
 * - Multi-wallet support
 * - Network switching (mainnet/devnet)
 * - Balance tracking
 * - Transaction signing
 */

import React, {
  createContext,
  useContext,
  useMemo,
  useState,
  useEffect,
  useCallback
} from 'react';

import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet
} from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  CoinbaseWalletAdapter,
  TrustWalletAdapter
} from '@solana/wallet-adapter-wallets';
import { clusterApiUrl } from '@solana/web3.js';

import {
  getSolanaNetwork,
  SOLANA_NETWORKS,
  DEFAULT_SOLANA_CONFIG
} from '../config/solanaNetworks';
import {
  getSOLBalance,
  getAllBalances
} from '../services/solanaPayment';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

// Create context for Solana-specific state
const SolanaContext = createContext(null);

/**
 * Inner provider that has access to wallet hooks
 */
function SolanaContextProvider({ children, network }) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { publicKey, connected, connecting, disconnecting } = wallet;

  const [balances, setBalances] = useState({
    SOL: { balance: 0, formatted: '0 SOL' },
    USDC: { balance: 0, formatted: '0 USDC' },
    USDT: { balance: 0, formatted: '0 USDT' }
  });
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [error, setError] = useState(null);

  // Fetch balances when wallet connects
  const fetchBalances = useCallback(async () => {
    if (!publicKey) {
      setBalances({
        SOL: { balance: 0, formatted: '0 SOL' },
        USDC: { balance: 0, formatted: '0 USDC' },
        USDT: { balance: 0, formatted: '0 USDT' }
      });
      return;
    }

    setIsLoadingBalance(true);
    setError(null);

    try {
      const networkKey = network === WalletAdapterNetwork.Mainnet ? 'mainnet' : 'devnet';
      const allBalances = await getAllBalances(publicKey.toString(), networkKey);
      setBalances(allBalances);
    } catch (err) {
      console.error('Error fetching Solana balances:', err);
      setError(err.message);
    } finally {
      setIsLoadingBalance(false);
    }
  }, [publicKey, network]);

  // Fetch balances on connect and periodically
  useEffect(() => {
    if (connected && publicKey) {
      fetchBalances();

      // Refresh balance every 30 seconds
      const interval = setInterval(fetchBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [connected, publicKey, fetchBalances]);

  // Get formatted address
  const formattedAddress = useMemo(() => {
    if (!publicKey) return null;
    const addr = publicKey.toString();
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  }, [publicKey]);

  // Get full address
  const address = useMemo(() => {
    return publicKey?.toString() || null;
  }, [publicKey]);

  // Network info
  const networkInfo = useMemo(() => {
    const networkKey = network === WalletAdapterNetwork.Mainnet ? 'mainnet' : 'devnet';
    return getSolanaNetwork(networkKey);
  }, [network]);

  // Context value
  const contextValue = useMemo(() => ({
    // Wallet state
    wallet,
    publicKey,
    address,
    formattedAddress,
    connected,
    connecting,
    disconnecting,

    // Connection
    connection,

    // Balances
    balances,
    isLoadingBalance,
    refreshBalances: fetchBalances,

    // Network
    network,
    networkInfo,
    isTestnet: network !== WalletAdapterNetwork.Mainnet,

    // Error state
    error,

    // Helper functions
    getExplorerUrl: (signature) => networkInfo.explorerTx(signature),
    getAddressUrl: (addr) => networkInfo.explorerAddress(addr || address)
  }), [
    wallet,
    publicKey,
    address,
    formattedAddress,
    connected,
    connecting,
    disconnecting,
    connection,
    balances,
    isLoadingBalance,
    fetchBalances,
    network,
    networkInfo,
    error
  ]);

  return (
    <SolanaContext.Provider value={contextValue}>
      {children}
    </SolanaContext.Provider>
  );
}

/**
 * Main Solana Wallet Provider
 *
 * Wraps the app with Solana wallet connectivity
 *
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components
 * @param {string} props.network - Network to connect to ('mainnet' | 'devnet')
 * @param {boolean} props.autoConnect - Whether to auto-connect on load
 */
export function SolanaWalletProvider({
  children,
  network: networkProp = 'devnet',
  autoConnect = true
}) {
  // Map network string to WalletAdapterNetwork
  const network = useMemo(() => {
    switch (networkProp) {
      case 'mainnet':
      case 'mainnet-beta':
        return WalletAdapterNetwork.Mainnet;
      case 'devnet':
      default:
        return WalletAdapterNetwork.Devnet;
    }
  }, [networkProp]);

  // Get endpoint for the network
  const endpoint = useMemo(() => {
    const networkConfig = getSolanaNetwork(networkProp);
    return networkConfig?.endpoint || clusterApiUrl(network);
  }, [network, networkProp]);

  // Initialize wallet adapters
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new CoinbaseWalletAdapter(),
    new TrustWalletAdapter()
  ], []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={autoConnect}>
        <WalletModalProvider>
          <SolanaContextProvider network={network}>
            {children}
          </SolanaContextProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

/**
 * Hook to access Solana wallet context
 */
export function useSolanaWallet() {
  const context = useContext(SolanaContext);

  if (!context) {
    throw new Error('useSolanaWallet must be used within a SolanaWalletProvider');
  }

  return context;
}

/**
 * Hook to check if Solana wallet is available (Phantom installed)
 */
export function useSolanaWalletAvailable() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    // Check if any Solana wallet is available
    const checkWallets = () => {
      const hasPhantom = typeof window !== 'undefined' && window.solana?.isPhantom;
      const hasSolflare = typeof window !== 'undefined' && window.solflare?.isSolflare;
      const hasBackpack = typeof window !== 'undefined' && window.backpack?.isBackpack;

      setAvailable(hasPhantom || hasSolflare || hasBackpack);
    };

    checkWallets();

    // Also check after a short delay (wallet might load async)
    const timeout = setTimeout(checkWallets, 1000);

    return () => clearTimeout(timeout);
  }, []);

  return available;
}

// Export the standard wallet adapter hooks for convenience
export { useConnection, useWallet } from '@solana/wallet-adapter-react';
export { WalletMultiButton, WalletDisconnectButton } from '@solana/wallet-adapter-react-ui';

// Export context for advanced usage
export { SolanaContext };

// Default export
export default SolanaWalletProvider;
