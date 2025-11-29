/**
 * TokenSelector Component
 * Allows users to select between native token and ERC20 stablecoins for bill payment
 */

import { useState, useEffect } from 'react'
import { Label } from '../ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Loader2, Coins, AlertCircle } from 'lucide-react'
import { escrowService } from '../../services/escrowService'
import { getNetwork } from '../../config/contracts'

// Token definitions with metadata
const TOKEN_METADATA = {
  NATIVE: {
    symbol: 'NATIVE',
    name: 'Native Token',
    decimals: 18,
    icon: Coins,
    color: 'bg-purple-500'
  },
  USDT: {
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    icon: Coins,
    color: 'bg-green-500'
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    icon: Coins,
    color: 'bg-blue-500'
  }
}

export function TokenSelector({
  chainId,
  provider,
  userAddress,
  onTokenSelect,
  selectedToken = 'NATIVE',
  disabled = false
}) {
  const [tokens, setTokens] = useState([])
  const [balances, setBalances] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Get network info for native token symbol
  const network = getNetwork(chainId)
  const nativeSymbol = network?.nativeCurrency?.symbol || 'ETH'

  // Load available tokens for current network
  useEffect(() => {
    const loadTokens = async () => {
      if (!chainId) {
        setTokens([])
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        // Get stablecoins for this network
        const stablecoins = escrowService.getSupportedTokens(chainId)

        // Build token list starting with native token
        const tokenList = [
          {
            type: 'NATIVE',
            address: null,
            symbol: nativeSymbol,
            name: `${nativeSymbol} (Native)`,
            decimals: 18,
            color: 'bg-purple-500'
          }
        ]

        // Add stablecoins if available
        if (stablecoins) {
          if (stablecoins.USDT) {
            tokenList.push({
              type: 'USDT',
              address: stablecoins.USDT,
              symbol: 'USDT',
              name: 'Tether USD',
              decimals: 6,
              color: 'bg-green-500'
            })
          }
          if (stablecoins.USDC) {
            tokenList.push({
              type: 'USDC',
              address: stablecoins.USDC,
              symbol: 'USDC',
              name: 'USD Coin',
              decimals: 6,
              color: 'bg-blue-500'
            })
          }
        }

        setTokens(tokenList)

        // Load balances if provider and address available
        if (provider && userAddress) {
          await loadBalances(tokenList, provider, userAddress)
        }
      } catch (err) {
        console.error('Error loading tokens:', err)
        setError('Failed to load tokens')
      } finally {
        setLoading(false)
      }
    }

    loadTokens()
  }, [chainId, nativeSymbol])

  // Load balances when provider/address changes
  useEffect(() => {
    if (provider && userAddress && tokens.length > 0) {
      loadBalances(tokens, provider, userAddress)
    }
  }, [provider, userAddress, tokens])

  const loadBalances = async (tokenList, provider, userAddress) => {
    const newBalances = {}

    for (const token of tokenList) {
      try {
        if (token.type === 'NATIVE') {
          // Get native balance
          const balance = await provider.getBalance(userAddress)
          const { ethers } = await import('ethers')
          newBalances[token.type] = ethers.formatEther(balance)
        } else if (token.address) {
          // Get ERC20 balance
          const balance = await escrowService.getTokenBalance(
            provider,
            token.address,
            userAddress
          )
          newBalances[token.type] = balance
        }
      } catch (err) {
        console.error(`Error loading balance for ${token.symbol}:`, err)
        newBalances[token.type] = '0'
      }
    }

    setBalances(newBalances)
  }

  const handleTokenChange = (value) => {
    const token = tokens.find(t => t.type === value)
    if (token && onTokenSelect) {
      onTokenSelect({
        type: token.type,
        address: token.address,
        symbol: token.symbol,
        decimals: token.decimals,
        isNative: token.type === 'NATIVE'
      })
    }
  }

  const formatBalance = (balance) => {
    if (!balance) return '0.00'
    const num = parseFloat(balance)
    if (num < 0.01) return '< 0.01'
    if (num < 1000) return num.toFixed(2)
    if (num < 1000000) return (num / 1000).toFixed(2) + 'K'
    return (num / 1000000).toFixed(2) + 'M'
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <Label>Payment Token</Label>
        <div className="flex items-center gap-2 p-3 border rounded-md bg-gray-800/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm text-gray-400">Loading tokens...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-2">
        <Label>Payment Token</Label>
        <div className="flex items-center gap-2 p-3 border border-red-500/50 rounded-md bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <span className="text-sm text-red-400">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="token-select">Payment Token</Label>
      <Select
        value={selectedToken}
        onValueChange={handleTokenChange}
        disabled={disabled || tokens.length === 0}
      >
        <SelectTrigger id="token-select" className="bg-gray-800 border-gray-700">
          <SelectValue placeholder="Select token" />
        </SelectTrigger>
        <SelectContent className="bg-gray-800 border-gray-700">
          {tokens.map((token) => (
            <SelectItem
              key={token.type}
              value={token.type}
              className="cursor-pointer hover:bg-gray-700"
            >
              <div className="flex items-center justify-between w-full gap-4">
                <div className="flex items-center gap-2">
                  <Badge className={`${token.color} text-white text-xs px-1.5`}>
                    {token.symbol}
                  </Badge>
                  <span>{token.name}</span>
                </div>
                {balances[token.type] && (
                  <span className="text-xs text-gray-400">
                    Bal: {formatBalance(balances[token.type])}
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Balance display */}
      {selectedToken && balances[selectedToken] && (
        <p className="text-xs text-gray-400">
          Available: {formatBalance(balances[selectedToken])}{' '}
          {tokens.find(t => t.type === selectedToken)?.symbol}
        </p>
      )}

      {/* Info for ERC20 tokens */}
      {selectedToken !== 'NATIVE' && (
        <p className="text-xs text-amber-400/80">
          ERC20 tokens require an approval transaction before locking in escrow.
        </p>
      )}
    </div>
  )
}

export default TokenSelector
