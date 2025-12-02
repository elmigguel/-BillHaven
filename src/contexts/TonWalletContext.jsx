/**
 * TonWalletContext - TON Blockchain Wallet Provider
 *
 * Provides TonConnect 2.0 wallet integration for BillHaven.
 * Supports: Tonkeeper, MyTonWallet, OpenMask, and other TON wallets.
 *
 * Ultra-low fees: ~$0.025 per transaction
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TonConnectUIProvider, useTonConnectUI, useTonAddress, useTonWallet } from '@tonconnect/ui-react';
import { Address, beginCell, toNano } from '@ton/ton';
import { getTonNetwork, getTonUSDT, TON_FEES } from '../config/tonNetworks';

const TonWalletContext = createContext(null);

// Inner provider that uses TonConnect hooks
function TonWalletProviderInner({ children }) {
  const [tonConnectUI] = useTonConnectUI();
  const userFriendlyAddress = useTonAddress(); // User-friendly format (EQ...)
  const rawAddress = useTonAddress(false); // Raw format
  const wallet = useTonWallet();

  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [network, setNetwork] = useState('mainnet'); // 'mainnet' or 'testnet'

  // Update connection state when wallet changes
  useEffect(() => {
    setIsConnected(!!wallet);
    if (wallet) {
      console.log('TON Wallet connected:', userFriendlyAddress);
    }
  }, [wallet, userFriendlyAddress]);

  // Connect wallet - opens TonConnect modal
  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    try {
      await tonConnectUI.openModal();
    } catch (err) {
      console.error('TON wallet connection error:', err);
      setError(err.message || 'Failed to connect TON wallet');
    } finally {
      setIsConnecting(false);
    }
  }, [tonConnectUI]);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      await tonConnectUI.disconnect();
      setIsConnected(false);
      console.log('TON Wallet disconnected');
    } catch (err) {
      console.error('TON disconnect error:', err);
    }
  }, [tonConnectUI]);

  // Send native TON
  const sendTon = useCallback(async (toAddress, amount) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360, // 6 minutes
        messages: [
          {
            address: toAddress,
            amount: toNano(amount.toString()).toString()
          }
        ]
      };

      const result = await tonConnectUI.sendTransaction(transaction);
      console.log('TON transfer sent:', result);
      return result;
    } catch (err) {
      console.error('TON transfer error:', err);
      throw err;
    }
  }, [isConnected, tonConnectUI]);

  // Send USDT (Jetton transfer)
  const sendUSDT = useCallback(async (toAddress, amount, jettonWalletAddress) => {
    if (!isConnected) {
      throw new Error('Wallet not connected');
    }

    const usdtConfig = getTonUSDT(network === 'testnet');

    // Convert USDT amount to smallest units (6 decimals!)
    const jettonAmount = BigInt(Math.floor(amount * Math.pow(10, usdtConfig.decimals)));

    // Build forward payload (optional comment)
    const forwardPayload = beginCell()
      .storeUint(0, 32) // 0 opcode = text comment
      .storeStringTail('BillHaven Payment')
      .endCell();

    // Build Jetton transfer body (TEP-74 standard)
    const body = beginCell()
      .storeUint(0xf8a7ea5, 32)              // Jetton transfer op code
      .storeUint(0, 64)                       // Query ID
      .storeCoins(jettonAmount)               // Amount (6 decimals for USDT!)
      .storeAddress(Address.parse(toAddress)) // Destination
      .storeAddress(Address.parse(userFriendlyAddress)) // Response destination
      .storeBit(0)                            // No custom payload
      .storeCoins(toNano(TON_FEES.forwardAmount)) // Forward amount (1 nanoton for compliance!)
      .storeBit(1)                            // Store forward payload as reference
      .storeRef(forwardPayload)
      .endCell();

    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 360,
        messages: [
          {
            address: jettonWalletAddress, // User's USDT Jetton Wallet
            amount: toNano(TON_FEES.jettonTransferGas).toString(), // Gas fee
            payload: body.toBoc().toString('base64')
          }
        ]
      };

      const result = await tonConnectUI.sendTransaction(transaction);
      console.log('USDT transfer sent:', result);
      return result;
    } catch (err) {
      console.error('USDT transfer error:', err);
      throw err;
    }
  }, [isConnected, tonConnectUI, userFriendlyAddress, network]);

  // Format address for display
  const formatAddress = useCallback((addr) => {
    if (!addr) return '';
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  }, []);

  // Get explorer URL
  const getExplorerUrl = useCallback((type, hash) => {
    const networkConfig = getTonNetwork(network === 'testnet');
    const baseUrl = networkConfig.explorer;

    if (type === 'tx') return `${baseUrl}/tx/${hash}`;
    if (type === 'address') return `${baseUrl}/address/${hash}`;
    return baseUrl;
  }, [network]);

  // Switch network (mainnet/testnet)
  const switchNetwork = useCallback((newNetwork) => {
    if (newNetwork === 'mainnet' || newNetwork === 'testnet') {
      setNetwork(newNetwork);
      console.log('Switched to TON', newNetwork);
    }
  }, []);

  const value = {
    // State
    walletAddress: userFriendlyAddress,
    rawAddress,
    isConnected,
    isConnecting,
    error,
    wallet,
    network,

    // Methods
    connectWallet,
    disconnect,
    sendTon,
    sendUSDT,
    formatAddress,
    getExplorerUrl,
    switchNetwork,

    // TonConnect UI instance (for advanced usage)
    tonConnectUI
  };

  return (
    <TonWalletContext.Provider value={value}>
      {children}
    </TonWalletContext.Provider>
  );
}

// Main provider wrapper with TonConnectUIProvider
export function TonWalletProvider({ children }) {
  // Safe manifest URL that only constructs after client-side hydration
  const [manifestUrl, setManifestUrl] = React.useState(null);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    // Only construct URL after client-side mount
    setIsClient(true);
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}/tonconnect-manifest.json`;
      setManifestUrl(url);
    }
  }, []);

  // Don't render TonConnect provider until we have a valid manifest URL
  // This prevents SSR/hydration crashes
  if (!isClient || !manifestUrl) {
    // Return children without TON functionality during SSR/initial load
    return (
      <TonWalletContext.Provider value={{
        walletAddress: '',
        isConnected: false,
        isConnecting: false,
        error: null,
        connectWallet: () => console.warn('TON wallet loading...'),
        disconnect: () => {},
        sendTon: () => Promise.reject('TON wallet loading...'),
        sendUSDT: () => Promise.reject('TON wallet loading...'),
        formatAddress: (addr) => addr || '',
        getExplorerUrl: () => '#',
        network: 'mainnet'
      }}>
        {children}
      </TonWalletContext.Provider>
    );
  }

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      <TonWalletProviderInner>
        {children}
      </TonWalletProviderInner>
    </TonConnectUIProvider>
  );
}

// Hook to use TON wallet context
export function useTonWalletContext() {
  const context = useContext(TonWalletContext);
  if (!context) {
    // Return safe defaults if not wrapped in provider
    return {
      walletAddress: '',
      isConnected: false,
      isConnecting: false,
      error: null,
      connectWallet: () => console.warn('TonWalletProvider not found'),
      disconnect: () => {},
      sendTon: () => Promise.reject('TonWalletProvider not found'),
      sendUSDT: () => Promise.reject('TonWalletProvider not found'),
      formatAddress: (addr) => addr || '',
      getExplorerUrl: () => '#',
      network: 'mainnet'
    };
  }
  return context;
}

export default TonWalletContext;
