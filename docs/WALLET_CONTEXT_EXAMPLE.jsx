/**
 * COMPLETE EXAMPLE: WalletContext with Modern Chain Switching (2025)
 *
 * This example shows the full implementation of a production-ready
 * WalletContext that handles chain switching WITHOUT page reload.
 *
 * Key Features:
 * - No race conditions between chainChanged/accountsChanged
 * - Debouncing for rapid-fire events
 * - Shared reinitialization logic
 * - Proper cleanup
 * - ethers.js v6 compatible
 * - Multi-chain support
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { ethers } from 'ethers'

const WalletContext = createContext(null)

// ============================================================================
// WALLET PROVIDER COMPONENT
// ============================================================================

export const WalletProvider = ({ children }) => {
  // Core wallet state
  const [walletAddress, setWalletAddress] = useState('')
  const [chainId, setChainId] = useState(null)
  const [signer, setSigner] = useState(null)
  const [provider, setProvider] = useState(null)
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState(null)

  // Debounce timer to prevent race conditions
  const reinitTimerRef = useRef(null)

  // ============================================================================
  // CORE: Shared Reinitialization Logic
  // ============================================================================
  // This is the key to preventing race conditions!
  // Both chainChanged and accountsChanged call this same function.

  const reinitializeProvider = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') return

    // Clear any pending reinitialization (debouncing)
    if (reinitTimerRef.current) {
      clearTimeout(reinitTimerRef.current)
    }

    // Wait 100ms for rapid-fire events to settle
    // If another event fires, this timer resets
    reinitTimerRef.current = setTimeout(async () => {
      try {
        console.log('🔄 Reinitializing provider...')

        // CRITICAL: Create NEW BrowserProvider instance
        // Provider is immutable - can't change network on existing instance
        const ethProvider = new ethers.BrowserProvider(window.ethereum)

        // Get all accounts
        const accounts = await ethProvider.listAccounts()

        if (accounts.length > 0) {
          // Get network info and signer
          const network = await ethProvider.getNetwork()
          const ethSigner = await ethProvider.getSigner()

          // ATOMIC STATE UPDATE
          // Update all related state at once to prevent partial updates
          // React batches these automatically
          setProvider(ethProvider)
          setSigner(ethSigner)
          setWalletAddress(accounts[0].address)
          setChainId(Number(network.chainId))
          setIsConnected(true)

          console.log('✅ Provider reinitialized:', {
            address: accounts[0].address,
            chainId: Number(network.chainId),
            network: network.name
          })
        } else {
          // No accounts = user disconnected
          disconnect()
        }
      } catch (err) {
        console.error('❌ Error reinitializing provider:', err)
        setError(`Provider reinitialization failed: ${err.message}`)
      }
    }, 100) // 100ms debounce
  }, []) // No dependencies - function is stable

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  // Handle account changes (user switches account in MetaMask)
  const handleAccountsChanged = useCallback(async (accounts) => {
    console.log('👤 accountsChanged event:', accounts)

    if (accounts.length === 0) {
      // User disconnected all accounts from your site
      console.log('🔌 User disconnected')
      disconnect()
    } else if (accounts[0] !== walletAddress) {
      // Account actually changed (not a redundant event)
      console.log('🔄 Account switched from', walletAddress, 'to', accounts[0])
      await reinitializeProvider()
    } else {
      // Redundant event (same account) - ignore
      console.log('⏭️  Redundant accountsChanged event - ignoring')
    }
  }, [walletAddress, reinitializeProvider])

  // Handle chain changes (user switches network in MetaMask)
  const handleChainChanged = useCallback(async (newChainId) => {
    const parsedChainId = parseInt(newChainId, 16)
    console.log('⛓️  chainChanged event:', parsedChainId)

    // Use shared reinitialization to prevent race conditions
    // This handles provider + signer + accounts atomically
    await reinitializeProvider()

    // Clear any previous errors on successful switch
    setError(null)
  }, [reinitializeProvider])

  // Handle disconnect
  const handleDisconnect = useCallback(() => {
    console.log('🔌 disconnect event')
    disconnect()
  }, [])

  // ============================================================================
  // INITIALIZATION & CLEANUP
  // ============================================================================

  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const ethProvider = new ethers.BrowserProvider(window.ethereum)
          setProvider(ethProvider)

          // Check if already connected (persistent connection)
          const accounts = await ethProvider.listAccounts()
          if (accounts.length > 0) {
            const network = await ethProvider.getNetwork()
            const ethSigner = await ethProvider.getSigner()

            setWalletAddress(accounts[0].address)
            setChainId(Number(network.chainId))
            setSigner(ethSigner)
            setIsConnected(true)

            console.log('✅ Restored existing connection:', {
              address: accounts[0].address,
              chainId: Number(network.chainId)
            })
          }
        } catch (err) {
          console.error('❌ Error initializing wallet:', err)
        }

        // CRITICAL: Listen on window.ethereum, NOT on provider!
        // ethers.js v6 BrowserProvider doesn't expose these events
        window.ethereum.on('accountsChanged', handleAccountsChanged)
        window.ethereum.on('chainChanged', handleChainChanged)
        window.ethereum.on('disconnect', handleDisconnect)

        console.log('👂 Event listeners registered')
      } else {
        console.warn('⚠️  window.ethereum not found - install MetaMask')
      }
    }

    init()

    // CLEANUP: Remove listeners on unmount
    // Prevents memory leaks in single-page apps
    return () => {
      if (window.ethereum?.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
        window.ethereum.removeListener('disconnect', handleDisconnect)
        console.log('🧹 Event listeners cleaned up')
      }

      // Clear any pending debounce timer
      if (reinitTimerRef.current) {
        clearTimeout(reinitTimerRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run once on mount

  // ============================================================================
  // PUBLIC METHODS
  // ============================================================================

  // Connect wallet (request user permission)
  const connectWallet = useCallback(async () => {
    if (typeof window.ethereum === 'undefined') {
      setError('Please install MetaMask or another Web3 wallet')
      return
    }

    setIsConnecting(true)
    setError(null)

    try {
      console.log('🔗 Requesting wallet connection...')

      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      })

      // Create provider and get signer
      const ethProvider = new ethers.BrowserProvider(window.ethereum)
      const ethSigner = await ethProvider.getSigner()
      const network = await ethProvider.getNetwork()

      // Update state
      setWalletAddress(accounts[0])
      setChainId(Number(network.chainId))
      setProvider(ethProvider)
      setSigner(ethSigner)
      setIsConnected(true)

      console.log('✅ Wallet connected:', {
        address: accounts[0],
        chainId: Number(network.chainId),
        network: network.name
      })
    } catch (err) {
      if (err.code === 4001) {
        setError('Connection rejected by user')
        console.log('❌ User rejected connection')
      } else {
        setError(err.message || 'Failed to connect wallet')
        console.error('❌ Connection error:', err)
      }
    } finally {
      setIsConnecting(false)
    }
  }, [])

  // Disconnect wallet (clear state)
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting wallet...')

    setWalletAddress('')
    setChainId(null)
    setSigner(null)
    setIsConnected(false)
    setError(null)

    console.log('✅ Wallet disconnected')
  }, [])

  // Switch network
  const switchNetwork = useCallback(async (targetChainId) => {
    if (!window.ethereum) {
      setError('Wallet not available')
      return false
    }

    try {
      console.log(`🔄 Switching to chain ${targetChainId}...`)

      // Try to switch to the network
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      })

      console.log(`✅ Switched to chain ${targetChainId}`)
      return true
    } catch (switchError) {
      // Network not added to wallet (error 4902)
      if (switchError.code === 4902) {
        console.log(`⚠️  Chain ${targetChainId} not in wallet - need to add it`)
        // You would add the network here with wallet_addEthereumChain
        setError(`Network ${targetChainId} not added to wallet`)
        return false
      } else {
        console.error('❌ Failed to switch network:', switchError)
        setError(`Failed to switch network: ${switchError.message}`)
        return false
      }
    }
  }, [])

  // Format address for display
  const formatAddress = useCallback((addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }, [])

  // ============================================================================
  // CONTEXT VALUE
  // ============================================================================

  const value = {
    // State
    walletAddress,
    chainId,
    signer,
    provider,
    isConnected,
    isConnecting,
    error,

    // Methods
    connectWallet,
    disconnect,
    switchNetwork,
    formatAddress,
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider')
  }
  return context
}

// ============================================================================
// EXAMPLE USAGE IN COMPONENTS
// ============================================================================

/*

// 1. Wrap your app with WalletProvider
import { WalletProvider } from './contexts/WalletContext'

function App() {
  return (
    <WalletProvider>
      <YourApp />
    </WalletProvider>
  )
}

// 2. Use in any component
import { useWallet } from './contexts/WalletContext'

function ConnectButton() {
  const { walletAddress, chainId, connectWallet, disconnect, isConnecting } = useWallet()

  if (walletAddress) {
    return (
      <div>
        <p>Connected: {walletAddress}</p>
        <p>Chain: {chainId}</p>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    )
  }

  return (
    <button onClick={connectWallet} disabled={isConnecting}>
      {isConnecting ? 'Connecting...' : 'Connect Wallet'}
    </button>
  )
}

// 3. Use signer for transactions
function SendTransaction() {
  const { signer, chainId } = useWallet()

  const sendTx = async () => {
    if (!signer) return

    const tx = await signer.sendTransaction({
      to: '0x...',
      value: ethers.parseEther('0.01')
    })

    await tx.wait()
    console.log('Transaction confirmed!')
  }

  return <button onClick={sendTx}>Send 0.01 ETH</button>
}

// 4. Use provider for reading
function GetBalance() {
  const { provider, walletAddress } = useWallet()
  const [balance, setBalance] = useState('0')

  useEffect(() => {
    if (!provider || !walletAddress) return

    const fetchBalance = async () => {
      const bal = await provider.getBalance(walletAddress)
      setBalance(ethers.formatEther(bal))
    }

    fetchBalance()
  }, [provider, walletAddress])

  return <p>Balance: {balance} ETH</p>
}

*/
