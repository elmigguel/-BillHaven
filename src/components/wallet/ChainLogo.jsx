const ChainLogo = ({ chainId, className = 'w-4 h-4' }) => {
  const logos = {
    // EVM Mainnets
    1: <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 24l-6.7-4.2L12 0l6.7 19.8-6.7 4.2zM12 24V12" fill="#627EEA"/><path d="M12 0l-6.7 19.8L12 12V0z" fill="#4664C4"/><path d="M12 24l6.7-4.2L12 12v12z" fill="#627EEA"/><path d="M5.3 19.8l6.7-7.8-6.7 7.8z" fill="#4664C4"/><path d="M12 12l6.7 7.8-6.7-7.8z" fill="#627EEA"/></svg>, // Ethereum
    137: <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 6.5l-5.5-4-5.5 4-4 5.5 4 5.5 5.5 4 5.5-4 4-5.5-4-5.5z" fill="#8247E5"/></svg>, // Polygon
    56: <svg className={className} viewBox="0 0 24 24" fill="#F0B90B" xmlns="http://www.w3.org/2000/svg"><path d="M12 18.2l-3.6-3.6 1.4-1.4 2.2 2.2 2.2-2.2 1.4 1.4-3.6 3.6zM12 5.8l-3.6 3.6-1.4-1.4 5-5 5 5-1.4 1.4-3.6-3.6zM6 10.2l-2.2 2.2 1.4 1.4L9 10.2 6 7.2 4.6 8.6l1.4 1.6zM18 10.2l-3-3-1.4 1.4 3 3-1.8 1.8 1.4 1.4 2.2-2.2zM12 13.4l-2.2-2.2-1.4 1.4 3.6 3.6 3.6-3.6-1.4-1.4-2.2 2.2z"/></svg>, // BSC
    42161: <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17.4 12.4c-1 .6-2 .9-3.2.9-1.4 0-2.6-.5-3.4-1.4-.8-1-1.2-2.2-1.2-3.6 0-1.4.4-2.6 1.2-3.6.8-.9 2-1.4 3.4-1.4 1.2 0 2.2.3 3.2.9l.7-1.7c-1-.6-2.3-1-3.9-1-1.9 0-3.5.6-4.7 1.8-1.2 1.2-1.8 2.8-1.8 4.6s.6 3.4 1.8 4.6c1.2 1.2 2.8 1.8 4.7 1.8 1.6 0 2.9-.4 3.9-1l-.7-1.7z" fill="#28A0F0"/><path d="M22.5 7.3h-2.1v10.1h2.1V7.3z" fill="#28A0F0"/><path d="M11.5 12c0 2.2-1.4 3.5-3.6 3.5H5.4V7.3h2.5c2.2 0 3.6 1.3 3.6 3.5v1.2zm-2.1.6c0-1-.6-1.6-1.5-1.6H7.5v3.2h.4c.9 0 1.5-.6 1.5-1.6v0z" fill="#96BEDC"/></svg>, // Arbitrum
    10: <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" fill="#FF0420"/><path d="M15.5 8.5l-3 3-3-3-2 2 5 5 5-5-2-2z" fill="#fff"/></svg>, // Optimism
    8453: <svg className={className} viewBox="0 0 24 24" fill="#0052FF" xmlns="http://www.w3.org/2000/svg"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm-1-5h2v2h-2v-2zm0-4h2v2h-2V9z"/></svg>, // Base
    // EVM Testnets - use mainnet logo often
    80002: <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16.5 6.5l-5.5-4-5.5 4-4 5.5 4 5.5 5.5 4 5.5-4 4-5.5-4-5.5z" fill="#A46DFD"/></svg>, // Polygon Amoy (lighter purple)
    11155111: <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 24l-6.7-4.2L12 0l6.7 19.8-6.7 4.2zM12 24V12" fill="#AAB5F5"/><path d="M12 0l-6.7 19.8L12 12V0z" fill="#8997E3"/><path d="M12 24l6.7-4.2L12 12v12z" fill="#AAB5F5"/><path d="M5.3 19.8l6.7-7.8-6.7 7.8z" fill="#8997E3"/><path d="M12 12l6.7 7.8-6.7-7.8z" fill="#AAB5F5"/></svg>, // Sepolia (lighter blue)
    97: <svg className={className} viewBox="0 0 24 24" fill="#F0B90B" xmlns="http://www.w3.org/2000/svg" opacity="0.6"><path d="M12 18.2l-3.6-3.6 1.4-1.4 2.2 2.2 2.2-2.2 1.4 1.4-3.6 3.6zM12 5.8l-3.6 3.6-1.4-1.4 5-5 5 5-1.4 1.4-3.6-3.6zM6 10.2l-2.2 2.2 1.4 1.4L9 10.2 6 7.2 4.6 8.6l1.4 1.6zM18 10.2l-3-3-1.4 1.4 3 3-1.8 1.8 1.4 1.4 2.2-2.2zM12 13.4l-2.2-2.2-1.4 1.4 3.6 3.6 3.6-3.6-1.4-1.4-2.2 2.2z"/></svg>, // BSC Testnet (faded)
    421614: <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" opacity="0.6"><path d="M17.4 12.4c-1 .6-2 .9-3.2.9-1.4 0-2.6-.5-3.4-1.4-.8-1-1.2-2.2-1.2-3.6 0-1.4.4-2.6 1.2-3.6.8-.9 2-1.4 3.4-1.4 1.2 0 2.2.3 3.2.9l.7-1.7c-1-.6-2.3-1-3.9-1-1.9 0-3.5.6-4.7 1.8-1.2 1.2-1.8 2.8-1.8 4.6s.6 3.4 1.8 4.6c1.2 1.2 2.8 1.8 4.7 1.8 1.6 0 2.9-.4 3.9-1l-.7-1.7z" fill="#28A0F0"/><path d="M22.5 7.3h-2.1v10.1h2.1V7.3z" fill="#28A0F0"/><path d="M11.5 12c0 2.2-1.4 3.5-3.6 3.5H5.4V7.3h2.5c2.2 0 3.6 1.3 3.6 3.5v1.2zm-2.1.6c0-1-.6-1.6-1.5-1.6H7.5v3.2h.4c.9 0 1.5-.6 1.5-1.6v0z" fill="#96BEDC"/></svg>, // Arbitrum Sepolia (faded)
    84532: <svg className={className} viewBox="0 0 24 24" fill="#0052FF" xmlns="http://www.w3.org/2000/svg" opacity="0.6"><path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8zm-1-5h2v2h-2v-2zm0-4h2v2h-2V9z"/></svg>, // Base Sepolia (faded)
    // Non-EVM
    'ton-mainnet': <svg className={className} viewBox="0 0 24 24" fill="#0098EA" xmlns="http://www.w3.org/2000/svg"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z"/><path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>, // TON
    'ton-testnet': <svg className={className} viewBox="0 0 24 24" fill="#0098EA" xmlns="http://www.w3.org/2000/svg" opacity="0.6"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z"/><path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/></svg>, // TON Testnet (faded)
    'evm': <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l-6.5 11.5h13L12 2zM5.5 14.5l6.5 4 6.5-4-3.25-6h-6.5l-3.25 6z"/></svg>, // Generic EVM
  };

  const selectedLogo = logos[chainId];

  if (!selectedLogo) {
    return logos['evm']; // Fallback for any unknown EVM chain
  }

  return selectedLogo;
};

export default ChainLogo;
