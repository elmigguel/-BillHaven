/**
 * WalletContext - Web3 Wallet Connection Provider
 *
 * Multi-chain support for all EVM networks like Uniswap/1inch.
 * Supports: Polygon, Ethereum, BSC, Arbitrum, Optimism, Base + testnets.
 * Uses ethers.js v6 for blockchain interaction.
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { ethers } from 'ethers'
import { NETWORKS, MAINNET_CHAINS, TESTNET_CHAINS, getEscrowAddress } from '../config/contracts'

// All supported chain IDs (mainnets + testnets)
const ALL_SUPPORTED_CHAINS = [...MAINNET_CHAINS, ...TESTNET_CHAINS]

const WalletContext = createContext(null)

export const WalletProvider = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState('')
  const [chainId, setChainId] = useState(null)
  const [signer, setSigner] = useState(null)
  const [provider, setProvider] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)
  const [walletType, setWalletType] = useState(null)

  // Debounce timer to prevent rapid-fire event handling
  const reinitTimerRef = useRef(null)

  // FIX: Use refs for stable event handler references to prevent memory leaks
  const handlersRef = useRef({
    accountsChanged: null,
    chainChanged: null,
    disconnect: null
  })

  // Shared re-initialization logic to prevent race conditions
  // Debounced to handle rapid chainChanged + accountsChanged events
  const reinitializeProvider = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') return

    // Clear any pending reinitialization
    if (reinitTimerRef.current) {
      clearTimeout(reinitTimerRef.current)
    }

    // Debounce: wait 100ms for rapid-fire events to settle
    reinitTimerRef.current = setTimeout(async () => {
      try {
        // FIX: Don't auto-reconnect if user intentionally disconnected
        const wasDisconnected = localStorage.getItem('billhaven_wallet_disconnected') === 'true'
        if (wasDisconnected) {
          return // User disconnected, don't auto-reconnect
        }

        const ethProvider = new ethers.BrowserProvider(window.ethereum)
        const accounts = await ethProvider.listAccounts()

        if (accounts.length > 0) {
          const network = await ethProvider.getNetwork()
          const ethSigner = await ethProvider.getSigner()

          // Atomic state update - prevents race conditions
          setProvider(ethProvider)
          setSigner(ethSigner)
          setWalletAddress(accounts[0].address)
          setChainId(Number(network.chainId))
          setIsConnected(true)
        } else {
          // No accounts means disconnected
          disconnect()
        }
      } catch (err) {
        console.error('Error reinitializing provider:', err)
        setError(`Provider reinitialization failed: ${err.message}`)
      }
    }, 100)
  }, [])

  // Initialize provider and check existing connection
  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const ethProvider = new ethers.BrowserProvider(window.ethereum)
          setProvider(ethProvider)

          // FIX: Check if user intentionally disconnected - don't auto-reconnect
          const wasDisconnected = localStorage.getItem('billhaven_wallet_disconnected') === 'true'

          // Check if already connected
          const accounts = await ethProvider.listAccounts()
          if (accounts.length > 0 && !wasDisconnected) {
            const network = await ethProvider.getNetwork()
            const ethSigner = await ethProvider.getSigner()

            setWalletAddress(accounts[0].address)
            setChainId(Number(network.chainId))
            setSigner(ethSigner)
            setIsConnected(true)
            detectWalletType()
          }
        } catch (err) {
          console.error('Error initializing wallet:', err)
        }

        // FIX: Store handlers in ref for stable references (prevents memory leak)
        handlersRef.current.accountsChanged = handleAccountsChanged
        handlersRef.current.chainChanged = handleChainChanged
        handlersRef.current.disconnect = handleDisconnect

        // Listen for account changes using stable refs
        window.ethereum.on('accountsChanged', handlersRef.current.accountsChanged)
        window.ethereum.on('chainChanged', handlersRef.current.chainChanged)
        window.ethereum.on('disconnect', handlersRef.current.disconnect)
      }
    }

    init()

    return () => {
      // FIX: Use the same handler refs for proper cleanup
      if (window.ethereum?.removeListener && handlersRef.current) {
        window.ethereum.removeListener('accountsChanged', handlersRef.current.accountsChanged)
        window.ethereum.removeListener('chainChanged', handlersRef.current.chainChanged)
        window.ethereum.removeListener('disconnect', handlersRef.current.disconnect)
      }
      // Clean up debounce timer
      if (reinitTimerRef.current) {
        clearTimeout(reinitTimerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Handle account changes
  // Note: accountsChanged fires when user switches accounts OR disconnects
  const handleAccountsChanged = useCallback(async (accounts) => {
    console.log('🔄 Account changed:', accounts)

    if (accounts.length === 0) {
      // User disconnected all accounts
      disconnect()
    } else if (accounts[0] !== walletAddress) {
      // Account actually changed - use shared reinitialization
      // This prevents race conditions with chainChanged
      await reinitializeProvider()
    }
    // If accounts[0] === walletAddress, it's a redundant event - ignore
  }, [walletAddress, reinitializeProvider])

  // Handle chain changes
  // Note: MetaMask fires chainChanged when network switches
  // This can fire simultaneously with accountsChanged - use shared logic
  const handleChainChanged = useCallback(async (newChainId) => {
    const parsedChainId = parseInt(newChainId, 16)
    console.log('⛓️  Chain changed:', parsedChainId)

    // Use shared reinitialization to prevent race conditions
    // This handles provider + signer + accounts atomically
    await reinitializeProvider()

    // Clear any previous errors on successful switch
    setError(null)
  }, [reinitializeProvider])

  // Handle disconnect
  const handleDisconnect = useCallback(() => {
    disconnect()
  }, [])

  // Detect wallet type (MetaMask, Coinbase, etc.)
  const detectWalletType = useCallback(() => {
    if (window.ethereum) {
      if (window.ethereum.isCoinbaseWallet) {
        setWalletType('coinbase')
      } else if (window.ethereum.isMetaMask) {
        setWalletType('metamask')
      } else if (window.ethereum.isWalletConnect) {
        setWalletType('walletconnect')
      } else {
        setWalletType('unknown')
      }
    }
  }, [])

  // Connect wallet
  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('Please install MetaMask or another Web3 wallet')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      const ethProvider = new ethers.BrowserProvider(window.ethereum)
      const ethSigner = await ethProvider.getSigner()
      const network = await ethProvider.getNetwork()

      // FIX: Clear disconnect flag when user connects new wallet
      localStorage.removeItem('billhaven_wallet_disconnected')

      setWalletAddress(accounts[0])
      setChainId(Number(network.chainId))
      setProvider(ethProvider)
      setSigner(ethSigner)
      setIsConnected(true)
      detectWalletType()

      // Multi-chain: Don't auto-switch, let user choose network
      // Show warning if on unsupported network (handled in UI)
    } catch (err) {
      if (err.code === 4001) {
        setError('Connection rejected by user')
      } else {
        setError(err.message || 'Failed to connect wallet')
      }
      console.error('Connection error:', err)
    } finally {
      setIsConnecting(false)
    }
  }, [detectWalletType])

  // Disconnect wallet - FIX: Actually disconnect from MetaMask + prevent auto-reconnect
  const disconnect = useCallback(async () => {
    // FIX: Try to revoke MetaMask permissions (supported in newer versions)
    if (window.ethereum?.isMetaMask) {
      try {
        await window.ethereum.request({
          method: 'wallet_revokePermissions',
          params: [{ eth_accounts: {} }]
        })
        console.log('✅ MetaMask permissions revoked')
      } catch (err) {
        // Fallback for wallets that don't support revokePermissions
        console.log('ℹ️ wallet_revokePermissions not supported, using localStorage flag')
      }
    }

    // FIX: Set flag to prevent auto-reconnect on page refresh
    localStorage.setItem('billhaven_wallet_disconnected', 'true')

    // Clear React state
    setWalletAddress('')
    setChainId(null)
    setSigner(null)
    setIsConnected(false)
    setWalletType(null)
    setError(null)
  }, [])

  // Switch network - supports all EVM chains
  const switchNetwork = useCallback(async (targetChainId) => {
    if (!window.ethereum) {
      setError('Wallet not available')
      return false
    }

    // Get network config from NETWORKS (supports all chains)
    const targetConfig = NETWORKS[targetChainId]

    if (!targetConfig) {
      setError(`Network ${targetChainId} not supported`)
      return false
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      })
      setChainId(targetChainId)
      return true
    } catch (switchError) {
      // Network not added to wallet, try to add it
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: `0x${targetChainId.toString(16)}`,
              chainName: targetConfig.name,
              nativeCurrency: targetConfig.nativeCurrency,
              rpcUrls: [targetConfig.rpcUrl],
              blockExplorerUrls: [targetConfig.blockExplorer]
            }],
          })
          setChainId(targetChainId)
          return true
        } catch (addError) {
          setError(`Failed to add ${targetConfig.name}`)
          return false
        }
      } else {
        setError(`Failed to switch to ${targetConfig.name}`)
        return false
      }
    }
  }, [])

  // Get network name - supports all chains
  const getNetworkName = useCallback(() => {
    const network = NETWORKS[chainId]
    if (network) return network.name
    return 'Unsupported Network'
  }, [chainId])

  // Get current network config
  const getNetworkConfig = useCallback(() => {
    return NETWORKS[chainId] || null
  }, [chainId])

  // Check if on supported network (any of our 11 networks)
  const isCorrectNetwork = useCallback(() => {
    return ALL_SUPPORTED_CHAINS.includes(chainId)
  }, [chainId])

  // Check if escrow contract is deployed on current network
  const hasEscrowContract = useCallback(() => {
    return !!getEscrowAddress(chainId)
  }, [chainId])

  // Check if current network is testnet
  const isTestnet = useCallback(() => {
    return TESTNET_CHAINS.includes(chainId)
  }, [chainId])

  // Format address for display
  const formatAddress = useCallback((addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }, [])

  // Get block explorer URL - supports all chains
  const getExplorerUrl = useCallback((type, hash) => {
    const network = NETWORKS[chainId]
    if (!network) return '#'

    const baseUrl = network.blockExplorer

    if (type === 'tx') return `${baseUrl}/tx/${hash}`
    if (type === 'address') return `${baseUrl}/address/${hash}`
    if (type === 'token') return `${baseUrl}/token/${hash}`
    return baseUrl
  }, [chainId])

  const value = {
    // State
    walletAddress,
    chainId,
    signer,
    provider,
    isConnected,
    isConnecting,
    error,
    walletType,

    // Methods
    connectWallet,
    disconnect,
    switchNetwork,
    getNetworkName,
    getNetworkConfig,
    isCorrectNetwork,
    hasEscrowContract,
    isTestnet,
    formatAddress,
    getExplorerUrl,

    // Constants (for UI components)
    supportedChains: ALL_SUPPORTED_CHAINS,
    mainnetChains: MAINNET_CHAINS,
    testnetChains: TESTNET_CHAINS,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return context
}
