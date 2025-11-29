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

const SUPPORTED_NETWORKS = {
  80002: { name: 'Polygon Amoy', shortName: 'Amoy', color: 'bg-blue-500', type: 'testnet' },
  137: { name: 'Polygon Mainnet', shortName: 'Mainnet', color: 'bg-purple-500', type: 'mainnet' },
}

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

          {/* Network Switching */}
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Switch Network
          </DropdownMenuLabel>

          <DropdownMenuItem
            onClick={() => switchNetwork(80002)}
            className={`cursor-pointer ${chainId === 80002 ? 'bg-blue-50' : ''}`}
          >
            <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
            Polygon Amoy (Testnet)
            {chainId === 80002 && <Check className="w-4 h-4 ml-auto text-blue-500" />}
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => switchNetwork(137)}
            className={`cursor-pointer ${chainId === 137 ? 'bg-purple-50' : ''}`}
          >
            <div className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
            Polygon Mainnet
            {chainId === 137 && <Check className="w-4 h-4 ml-auto text-purple-500" />}
          </DropdownMenuItem>

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
