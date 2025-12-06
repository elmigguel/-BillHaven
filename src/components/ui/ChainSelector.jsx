/**
 * ChainSelector - Premium multi-chain selector with real blockchain logos
 * Like Uniswap/1inch network selector - professional and beautiful
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, ChevronDown, Zap, Globe, Shield } from 'lucide-react';

// Real blockchain logos as SVG components
const ChainLogos = {
  ethereum: () => (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <g fill="none">
        <circle fill="#627EEA" cx="16" cy="16" r="16"/>
        <g fill="#FFF">
          <path fillOpacity=".6" d="M16.498 4v8.87l7.497 3.35z"/>
          <path d="M16.498 4L9 16.22l7.498-3.35z"/>
          <path fillOpacity=".6" d="M16.498 21.968v6.027L24 17.616z"/>
          <path d="M16.498 27.995v-6.028L9 17.616z"/>
          <path fillOpacity=".2" d="M16.498 20.573l7.497-4.353-7.497-3.348z"/>
          <path fillOpacity=".6" d="M9 16.22l7.498 4.353v-7.701z"/>
        </g>
      </g>
    </svg>
  ),
  polygon: () => (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle fill="#8247E5" cx="16" cy="16" r="16"/>
      <path fill="#FFF" d="M21.092 12.693c-.369-.215-.848-.215-1.254 0l-2.879 1.654-1.955 1.078-2.879 1.653c-.369.216-.848.216-1.254 0l-2.288-1.294c-.369-.215-.627-.61-.627-1.042V12.19c0-.431.221-.826.627-1.042l2.25-1.258c.37-.216.85-.216 1.256 0l2.25 1.258c.37.216.628.611.628 1.042v1.654l1.955-1.115v-1.653a1.16 1.16 0 00-.627-1.042l-4.17-2.372c-.369-.216-.848-.216-1.254 0l-4.244 2.372A1.16 1.16 0 006 11.076v4.78c0 .432.221.827.627 1.043l4.244 2.372c.369.215.849.215 1.254 0l2.879-1.618 1.955-1.114 2.879-1.617c.369-.216.848-.216 1.254 0l2.251 1.258c.37.215.627.61.627 1.042v2.552c0 .431-.22.826-.627 1.042l-2.25 1.294c-.37.216-.85.216-1.255 0l-2.251-1.258c-.37-.216-.628-.611-.628-1.042v-1.654l-1.955 1.115v1.653c0 .431.221.827.627 1.042l4.244 2.372c.369.216.848.216 1.254 0l4.244-2.372c.369-.215.627-.61.627-1.042v-4.78a1.16 1.16 0 00-.627-1.042l-4.28-2.409z"/>
    </svg>
  ),
  bsc: () => (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle fill="#F3BA2F" cx="16" cy="16" r="16"/>
      <path fill="#FFF" d="M12.116 14.404L16 10.52l3.886 3.886 2.26-2.26L16 6l-6.144 6.144 2.26 2.26zM6 16l2.26-2.26L10.52 16l-2.26 2.26L6 16zm6.116 1.596L16 21.48l3.886-3.886 2.26 2.259L16 26l-6.144-6.144-.003-.003 2.263-2.257zM21.48 16l2.26-2.26L26 16l-2.26 2.26L21.48 16zm-3.188-.002h.002L16 13.706l-1.89 1.89-.338.338-.464.463.003.003L16 18.292l2.293-2.293.001-.001-.002-.002v.002z"/>
    </svg>
  ),
  arbitrum: () => (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle fill="#28A0F0" cx="16" cy="16" r="16"/>
      <path fill="#FFF" d="M19.545 14.424l-2.194 3.43 5.19 7.7 2.3-1.36-5.296-9.77zm6.086 7.72l-7.47-13.76c-.14-.26-.31-.5-.5-.72-.35-.4-.77-.73-1.25-.96-.48-.23-1.02-.35-1.57-.35h-.38l-.91 1.5 6.97 12.85-3.14 4.67 1.92 1.13.02.01 6.33-4.33zm-9.38.29l-3.93-6.53-.77 1.26 3.38 6.31-4.63 2.74 1.85 1.1 4.1-4.88zm-5.98-6.17l1.06-1.75-2.58-4.24h3.94l.06-.1 1.1-1.8h-7.95l4.37 7.89z"/>
    </svg>
  ),
  optimism: () => (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle fill="#FF0420" cx="16" cy="16" r="16"/>
      <path fill="#FFF" d="M10.904 19.712c-1.684 0-2.928-.518-3.728-1.554-.794-1.042-1.192-2.51-1.192-4.406 0-1.896.398-3.364 1.192-4.406.8-1.036 2.044-1.554 3.728-1.554 1.684 0 2.928.518 3.728 1.554.794 1.042 1.192 2.51 1.192 4.406 0 1.896-.398 3.364-1.192 4.406-.8 1.036-2.044 1.554-3.728 1.554zm0-2.294c.644 0 1.144-.238 1.498-.714.36-.482.54-1.284.54-2.406s-.18-1.924-.54-2.406c-.354-.476-.854-.714-1.498-.714-.644 0-1.144.238-1.498.714-.36.482-.54 1.284-.54 2.406s.18 1.924.54 2.406c.354.476.854.714 1.498.714zm10.104 2.294c-1.302 0-2.404-.308-3.304-.924-.894-.616-1.342-1.49-1.342-2.622h2.898c0 .406.168.742.504 1.008.342.266.792.398 1.35.398.456 0 .824-.098 1.104-.294.286-.196.43-.462.43-.798 0-.378-.166-.658-.498-.84-.326-.188-.878-.394-1.656-.618-1.026-.294-1.832-.686-2.418-1.176-.58-.496-.87-1.168-.87-2.016 0-.994.398-1.786 1.192-2.376.8-.596 1.812-.894 3.036-.894 1.284 0 2.328.31 3.132.93.81.614 1.214 1.456 1.214 2.526h-2.88c0-.382-.146-.692-.438-.93-.286-.244-.67-.366-1.152-.366-.426 0-.77.092-1.032.276-.256.184-.384.432-.384.744 0 .354.152.618.456.792.31.168.832.358 1.566.57 1.044.294 1.876.688 2.496 1.182.62.488.93 1.162.93 2.022 0 1.024-.394 1.834-1.182 2.43-.788.59-1.824.886-3.108.886z"/>
    </svg>
  ),
  base: () => (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle fill="#0052FF" cx="16" cy="16" r="16"/>
      <path fill="#FFF" d="M16 26c5.523 0 10-4.477 10-10S21.523 6 16 6 6 10.477 6 16s4.477 10 10 10zm0-4.5a5.5 5.5 0 110-11 5.5 5.5 0 010 11z"/>
    </svg>
  ),
  avalanche: () => (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle fill="#E84142" cx="16" cy="16" r="16"/>
      <path fill="#FFF" d="M19.986 22.168h3.313c.609 0 .913-.304 1.087-.609.174-.304.174-.782 0-1.173l-6.4-11.2c-.26-.434-.608-.652-1.13-.652h-1.39c-.52 0-.87.218-1.13.652l-1.65 2.912 2.434 4.174c.26.434.608.652 1.13.652h1.39c.52 0 .87-.218 1.13-.652l1.912-3.302c.173-.304.173-.782 0-1.173-.174-.39-.478-.608-1.087-.608h-.695l-1.39 2.39-2.433-4.174-3.302 5.78c-.173.304-.173.782 0 1.173.173.304.478.609 1.086.609h6.125l-.39.695-1.565-.001c-.608 0-.912.218-1.086.608-.173.39-.173.869 0 1.173l.65 1.13c.173.304.477.608 1.086.608.608 0 .912-.304 1.086-.608.173-.304.173-.783 0-1.173l-.39-.652 1.564 1.041z"/>
    </svg>
  ),
  solana: () => (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <defs>
        <linearGradient id="solana-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00FFA3"/>
          <stop offset="100%" stopColor="#DC1FFF"/>
        </linearGradient>
      </defs>
      <circle fill="url(#solana-grad)" cx="16" cy="16" r="16"/>
      <path fill="#FFF" d="M9.925 17.747a.638.638 0 01.453-.188h12.919c.285 0 .428.346.226.548l-2.448 2.448a.638.638 0 01-.453.188H7.703c-.285 0-.428-.346-.226-.548l2.448-2.448zm0-6.292a.638.638 0 01.453-.188h12.919c.285 0 .428.346.226.548l-2.448 2.448a.638.638 0 01-.453.188H7.703c-.285 0-.428-.346-.226-.548l2.448-2.448zm10.697 3.098a.638.638 0 00-.453-.188H7.25c-.285 0-.428.346-.226.548l2.448 2.448a.638.638 0 00.453.188h12.919c.285 0 .428-.346.226-.548l-2.448-2.448z"/>
    </svg>
  ),
  ton: () => (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <defs>
        <linearGradient id="ton-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0088CC"/>
          <stop offset="100%" stopColor="#29B6F6"/>
        </linearGradient>
      </defs>
      <circle fill="url(#ton-grad)" cx="16" cy="16" r="16"/>
      <path fill="#FFF" d="M16 6l-8 5v10l8 5 8-5V11l-8-5zm0 2.5l5.5 3.438v6.875L16 22.25l-5.5-3.438v-6.875L16 8.5z"/>
      <path fill="#FFF" fillOpacity="0.5" d="M16 8.5v13.75l5.5-3.438v-6.875z"/>
    </svg>
  ),
  bitcoin: () => (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle fill="#F7931A" cx="16" cy="16" r="16"/>
      <path fill="#FFF" d="M22.5 14.25c.313-2.094-1.281-3.219-3.469-3.969l.719-2.875-1.719-.438-.688 2.781c-.469-.125-.938-.219-1.406-.313l.688-2.781-1.719-.438-.688 2.875c-.375-.094-.75-.188-1.125-.281l-2.344-.594-.469 1.844s1.281.313 1.25.313c.688.188.813.656.781 1.031l-.781 3.156c.063.031.125.063.188.094l-.188-.031-1.094 4.375c-.094.219-.313.531-.781.406.031.031-1.25-.313-1.25-.313L8 20.626l2.219.563c.406.125.813.219 1.219.344l-.688 2.875 1.719.438.688-2.875c.469.125.938.25 1.406.344l-.688 2.875 1.719.438.688-2.875c2.875.563 5.031.313 5.938-2.281.719-2.094-.031-3.313-1.563-4.094 1.125-.25 1.969-1 2.188-2.531zm-3.906 5.469c-.5 2.094-4 .969-5.125.688l.906-3.688c1.125.281 4.75.844 4.219 3zm.531-5.531c-.469 1.906-3.375.938-4.313.688l.844-3.344c.938.25 3.938.688 3.469 2.656z"/>
    </svg>
  ),
  lightning: () => (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <defs>
        <linearGradient id="ln-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F7931A"/>
          <stop offset="100%" stopColor="#FFD93D"/>
        </linearGradient>
      </defs>
      <circle fill="url(#ln-grad)" cx="16" cy="16" r="16"/>
      <path fill="#FFF" d="M18.75 6L11 17h4.5L14 26l8.5-12h-5L18.75 6z"/>
    </svg>
  ),
  tron: () => (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <circle fill="#FF0013" cx="16" cy="16" r="16"/>
      <path fill="#FFF" d="M22.5 10l-10.5 3.5L8 26l14.5-16z"/>
      <path fill="#FFF" fillOpacity="0.5" d="M22.5 10L12 13.5l4.5 4.5 6-8z"/>
    </svg>
  ),
  zcash: () => (
    <svg viewBox="0 0 32 32" className="w-full h-full">
      <defs>
        <linearGradient id="zec-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F4B728"/>
          <stop offset="100%" stopColor="#E8A914"/>
        </linearGradient>
      </defs>
      <circle fill="url(#zec-grad)" cx="16" cy="16" r="16"/>
      <path fill="#231F20" d="M16 6C10.477 6 6 10.477 6 16s4.477 10 10 10 10-4.477 10-10S21.523 6 16 6zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z"/>
      <path fill="#231F20" d="M15 11h2v2h-2zm0 8h2v2h-2zm-3-6h8v1.5l-5.5 3H20v1.5h-8v-1.5l5.5-3H12z"/>
    </svg>
  ),
};

// Chain configurations with all details
const CHAINS = {
  // EVM Mainnets
  ethereum: { id: 1, name: 'Ethereum', symbol: 'ETH', type: 'mainnet', color: '#627EEA', fees: '~$5-50', speed: '12s' },
  polygon: { id: 137, name: 'Polygon', symbol: 'MATIC', type: 'mainnet', color: '#8247E5', fees: '~$0.01', speed: '2s', recommended: true },
  bsc: { id: 56, name: 'BNB Chain', symbol: 'BNB', type: 'mainnet', color: '#F3BA2F', fees: '~$0.10', speed: '3s' },
  arbitrum: { id: 42161, name: 'Arbitrum', symbol: 'ETH', type: 'mainnet', color: '#28A0F0', fees: '~$0.10', speed: '0.3s', recommended: true },
  optimism: { id: 10, name: 'Optimism', symbol: 'ETH', type: 'mainnet', color: '#FF0420', fees: '~$0.10', speed: '2s' },
  base: { id: 8453, name: 'Base', symbol: 'ETH', type: 'mainnet', color: '#0052FF', fees: '~$0.01', speed: '2s', recommended: true },
  avalanche: { id: 43114, name: 'Avalanche', symbol: 'AVAX', type: 'mainnet', color: '#E84142', fees: '~$0.10', speed: '1s' },

  // Non-EVM
  solana: { id: 'solana', name: 'Solana', symbol: 'SOL', type: 'mainnet', color: '#14F195', fees: '~$0.0001', speed: '0.4s', category: 'non-evm' },
  ton: { id: 'ton', name: 'TON', symbol: 'TON', type: 'mainnet', color: '#0088CC', fees: '~$0.025', speed: '5s', category: 'non-evm' },
  bitcoin: { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC', type: 'mainnet', color: '#F7931A', fees: '~$1-10', speed: '10m', category: 'non-evm' },
  lightning: { id: 'lightning', name: 'Lightning', symbol: 'BTC', type: 'mainnet', color: '#FFD93D', fees: '~$0.001', speed: 'Instant', category: 'non-evm', recommended: true },
  tron: { id: 'tron', name: 'TRON', symbol: 'TRX', type: 'mainnet', color: '#FF0013', fees: '~$0.01', speed: '3s', category: 'non-evm' },
  zcash: { id: 'zcash', name: 'Zcash', symbol: 'ZEC', type: 'mainnet', color: '#F4B728', fees: '~$0.001', speed: '75s', category: 'non-evm', privacy: true },
};

export default function ChainSelector({
  selectedChain,
  onChainSelect,
  showAll = false,
  size = 'default', // 'sm' | 'default' | 'lg'
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);

  const selected = selectedChain ? CHAINS[selectedChain] : null;
  const ChainLogo = selectedChain ? ChainLogos[selectedChain] : null;

  const sizeClasses = {
    sm: 'h-8 text-sm',
    default: 'h-10',
    lg: 'h-12 text-lg',
  };

  const logoSizes = {
    sm: 'w-5 h-5',
    default: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  // Group chains by category
  const evmChains = Object.entries(CHAINS).filter(([_, c]) => !c.category);
  const nonEvmChains = Object.entries(CHAINS).filter(([_, c]) => c.category === 'non-evm');

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <motion.button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-3 px-4 rounded-xl border-2
          bg-dark-card/50 border-dark-border hover:border-white/20
          transition-all duration-200 ${sizeClasses[size]}
        `}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        {ChainLogo ? (
          <div className={logoSizes[size]}>
            <ChainLogo />
          </div>
        ) : (
          <Globe className={`${logoSizes[size]} text-gray-400`} />
        )}
        <span className="text-white font-medium">
          {selected?.name || 'Select Chain'}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Content */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-80 max-h-[400px] overflow-y-auto z-50 rounded-2xl border border-dark-border bg-dark-elevated/95 backdrop-blur-xl shadow-2xl"
            >
              {/* EVM Chains */}
              <div className="p-3 border-b border-dark-border">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                  EVM Networks
                </p>
                <div className="space-y-1">
                  {evmChains.map(([key, chain]) => {
                    const Logo = ChainLogos[key];
                    const isSelected = selectedChain === key;

                    return (
                      <motion.button
                        key={key}
                        type="button"
                        onClick={() => {
                          onChainSelect(key);
                          setIsOpen(false);
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                          transition-all duration-150
                          ${isSelected
                            ? 'bg-brand-purple/20 border border-brand-purple/40'
                            : 'hover:bg-white/5'
                          }
                        `}
                        whileHover={{ x: 4 }}
                      >
                        <div className="w-8 h-8 flex-shrink-0">
                          {Logo && <Logo />}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{chain.name}</span>
                            {chain.recommended && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-success-muted/20 text-success-muted rounded">
                                LOW FEE
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{chain.symbol}</span>
                            <span>•</span>
                            <span>{chain.fees}</span>
                            <span>•</span>
                            <span>{chain.speed}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-success-muted" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Non-EVM Chains */}
              <div className="p-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
                  Other Networks
                </p>
                <div className="space-y-1">
                  {nonEvmChains.map(([key, chain]) => {
                    const Logo = ChainLogos[key];
                    const isSelected = selectedChain === key;

                    return (
                      <motion.button
                        key={key}
                        type="button"
                        onClick={() => {
                          onChainSelect(key);
                          setIsOpen(false);
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                          transition-all duration-150
                          ${isSelected
                            ? 'bg-brand-purple/20 border border-brand-purple/40'
                            : 'hover:bg-white/5'
                          }
                        `}
                        whileHover={{ x: 4 }}
                      >
                        <div className="w-8 h-8 flex-shrink-0">
                          {Logo && <Logo />}
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-white">{chain.name}</span>
                            {chain.recommended && (
                              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-success-muted/20 text-success-muted rounded flex items-center gap-1">
                                <Zap className="w-3 h-3" />
                                FAST
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span>{chain.symbol}</span>
                            <span>•</span>
                            <span>{chain.fees}</span>
                            <span>•</span>
                            <span>{chain.speed}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-success-muted" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Export chain logos for use elsewhere
export { ChainLogos, CHAINS };
