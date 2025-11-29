/**
 * WalletContext - Web3 Wallet Connection Provider
 *
 * Provides wallet connection state and methods for the entire app.
 * Uses ethers.js v6 for blockchain interaction.
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { ethers } from 'ethers'
import { POLYGON_MAINNET, POLYGON_AMOY } from '../config/contracts'

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

  // Initialize provider and check existing connection
  useEffect(() => {
    const init = async () => {
      if (typeof window.ethereum !== 'undefined') {
        try {
          const ethProvider = new ethers.BrowserProvider(window.ethereum)
          setProvider(ethProvider)

          // Check if already connected
          const accounts = await ethProvider.listAccounts()
          if (accounts.length > 0) {
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

        // Listen for account changes
        window.ethereum.on('accountsChanged', handleAccountsChanged)
        window.ethereum.on('chainChanged', handleChainChanged)
        window.ethereum.on('disconnect', handleDisconnect)
      }
    }

    init()

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
        window.ethereum.removeListener('disconnect', handleDisconnect)
      }
    }
  }, [])

  // Handle account changes
  const handleAccountsChanged = useCallback(async (accounts) => {
    if (accounts.length === 0) {
      disconnect()
    } else {
      setWalletAddress(accounts[0])
      if (provider) {
        const ethSigner = await provider.getSigner()
        setSigner(ethSigner)
      }
    }
  }, [provider])

  // Handle chain changes
  const handleChainChanged = useCallback((newChainId) => {
    setChainId(parseInt(newChainId, 16))
    // Reload to reset provider state
    window.location.reload()
  }, [])

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

      setWalletAddress(accounts[0])
      setChainId(Number(network.chainId))
      setProvider(ethProvider)
      setSigner(ethSigner)
      setIsConnected(true)
      detectWalletType()

      // Auto-switch to Polygon Amoy if on wrong network
      if (Number(network.chainId) !== 80002 && Number(network.chainId) !== 137) {
        await switchNetwork(80002) // Default to testnet
      }
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

  // Disconnect wallet
  const disconnect = useCallback(() => {
    setWalletAddress('')
    setChainId(null)
    setSigner(null)
    setIsConnected(false)
    setWalletType(null)
    setError(null)
  }, [])

  // Switch network
  const switchNetwork = useCallback(async (targetChainId) => {
    if (!window.ethereum) {
      setError('Wallet not available')
      return false
    }

    const targetConfig = targetChainId === 137 ? POLYGON_MAINNET : POLYGON_AMOY

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${targetChainId.toString(16)}` }],
      })
      setChainId(targetChainId)
      return true
    } catch (switchError) {
      // Network not added, try to add it
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
          setError('Failed to add network')
          return false
        }
      } else {
        setError('Failed to switch network')
        return false
      }
    }
  }, [])

  // Get network name
  const getNetworkName = useCallback(() => {
    if (chainId === 137) return 'Polygon Mainnet'
    if (chainId === 80002) return 'Polygon Amoy'
    return 'Unknown Network'
  }, [chainId])

  // Check if on correct network
  const isCorrectNetwork = useCallback(() => {
    return chainId === 137 || chainId === 80002
  }, [chainId])

  // Format address for display
  const formatAddress = useCallback((addr) => {
    if (!addr) return ''
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }, [])

  // Get block explorer URL
  const getExplorerUrl = useCallback((type, hash) => {
    const baseUrl = chainId === 137
      ? 'https://polygonscan.com'
      : 'https://amoy.polygonscan.com'

    if (type === 'tx') return `${baseUrl}/tx/${hash}`
    if (type === 'address') return `${baseUrl}/address/${hash}`
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
    isCorrectNetwork,
    formatAddress,
    getExplorerUrl,
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
