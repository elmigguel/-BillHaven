/**
 * ConnectWalletButton - Web3 Wallet Connection Button
 *
 * Shows connect button when disconnected, wallet info when connected.
 * Includes network switching and disconnect functionality.
 */

import React, { useState } from 'react'
import { useWallet } from '../../contexts/WalletContext'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '../ui/dropdown-menu'
import { Badge } from '../ui/badge'
import { Wallet, Copy, ExternalLink, LogOut, AlertCircle, Check, ChevronDown } from 'lucide-react'

// ALL supported networks - Multi-chain support like Uniswap/1inch
const SUPPORTED_NETWORKS = {
  // ============ MAINNETS ============
  137: { name: 'Polygon', shortName: 'MATIC', color: 'bg-purple-500', type: 'mainnet', icon: '🟣' },
  1: { name: 'Ethereum', shortName: 'ETH', color: 'bg-blue-600', type: 'mainnet', icon: '⟠' },
  56: { name: 'BNB Chain', shortName: 'BNB', color: 'bg-yellow-500', type: 'mainnet', icon: '🟡' },
  42161: { name: 'Arbitrum', shortName: 'ARB', color: 'bg-blue-400', type: 'mainnet', icon: '🔵' },
  10: { name: 'Optimism', shortName: 'OP', color: 'bg-red-500', type: 'mainnet', icon: '🔴' },
  8453: { name: 'Base', shortName: 'BASE', color: 'bg-blue-500', type: 'mainnet', icon: '🔷' },
  // ============ TESTNETS ============
  80002: { name: 'Polygon Amoy', shortName: 'Amoy', color: 'bg-purple-400', type: 'testnet', icon: '🟣' },
  11155111: { name: 'Sepolia', shortName: 'SEP', color: 'bg-blue-400', type: 'testnet', icon: '⟠' },
  97: { name: 'BSC Testnet', shortName: 'tBNB', color: 'bg-yellow-400', type: 'testnet', icon: '🟡' },
  421614: { name: 'Arbitrum Sepolia', shortName: 'tARB', color: 'bg-blue-300', type: 'testnet', icon: '🔵' },
  84532: { name: 'Base Sepolia', shortName: 'tBASE', color: 'bg-blue-300', type: 'testnet', icon: '🔷' },
}

// Separate mainnets and testnets for UI
const MAINNET_CHAINS = [137, 1, 56, 42161, 10, 8453]
const TESTNET_CHAINS = [80002, 11155111, 97, 421614, 84532]

export default function ConnectWalletButton() {
  const {
    walletAddress,
    chainId,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    disconnect,
    switchNetwork,
    formatAddress,
    getExplorerUrl,
    walletType,
    isCorrectNetwork,
  } = useWallet()

  const [copied, setCopied] = useState(false)

  // Copy address to clipboard
  const copyAddress = () => {
    navigator.clipboard.writeText(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // If not connected, show connect button
  if (!isConnected) {
    return (
      <Button
        onClick={connectWallet}
        disabled={isConnecting}
        className="bg-purple-600 hover:bg-purple-700 text-white"
      >
        <Wallet className="w-4 h-4 mr-2" />
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>
    )
  }

  const currentNetwork = SUPPORTED_NETWORKS[chainId]
  const isUnsupportedNetwork = !currentNetwork

  return (
    <div className="flex items-center gap-2">
      {/* Network Badge */}
      {currentNetwork && (
        <Badge
          variant="outline"
          className={`${currentNetwork.color} text-white border-0 text-xs`}
        >
          {currentNetwork.shortName}
          {currentNetwork.type === 'testnet' && ' (Test)'}
        </Badge>
      )}

      {/* Unsupported Network Warning */}
      {isUnsupportedNetwork && (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Wrong Network
        </Badge>
      )}

      {/* Wallet Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`${
              isUnsupportedNetwork
                ? 'border-red-500 text-red-500 hover:bg-red-50'
                : 'border-emerald-500 text-emerald-500 hover:bg-emerald-50'
            }`}
          >
            <Wallet className="w-4 h-4 mr-2" />
            {formatAddress(walletAddress)}
            <ChevronDown className="w-4 h-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-64">
          {/* Wallet Info Header */}
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">
                {walletType ? walletType.charAt(0).toUpperCase() + walletType.slice(1) : 'Wallet'}
              </p>
              <p className="text-xs text-muted-foreground font-mono break-all">
                {walletAddress}
              </p>
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          {/* Copy Address */}
          <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2 text-green-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Address
              </>
            )}
          </DropdownMenuItem>

          {/* View on Explorer */}
          <DropdownMenuItem asChild>
            <a
              href={getExplorerUrl('address', walletAddress)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on Explorer
            </a>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Network Switching - MAINNETS */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Mainnets
          </DropdownMenuLabel>

          {MAINNET_CHAINS.map((netId) => {
            const network = SUPPORTED_NETWORKS[netId]
            return (
              <DropdownMenuItem
                key={netId}
                onClick={() => switchNetwork(netId)}
                className={`cursor-pointer ${chainId === netId ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
              >
                <span className="mr-2">{network.icon}</span>
                {network.name}
                {chainId === netId && <Check className="w-4 h-4 ml-auto text-green-500" />}
              </DropdownMenuItem>
            )
          })}

          <DropdownMenuSeparator />

          {/* Network Switching - TESTNETS */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Testnets (Free)
          </DropdownMenuLabel>

          {TESTNET_CHAINS.map((netId) => {
            const network = SUPPORTED_NETWORKS[netId]
            return (
              <DropdownMenuItem
                key={netId}
                onClick={() => switchNetwork(netId)}
                className={`cursor-pointer ${chainId === netId ? 'bg-gray-100 dark:bg-gray-800' : ''}`}
              >
                <span className="mr-2">{network.icon}</span>
                {network.name}
                {chainId === netId && <Check className="w-4 h-4 ml-auto text-green-500" />}
              </DropdownMenuItem>
            )
          })}

          <DropdownMenuSeparator />

          {/* Disconnect */}
          <DropdownMenuItem
            onClick={disconnect}
            className="text-red-600 focus:text-red-600 cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Error Toast */}
      {error && (
        <div className="absolute top-16 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
