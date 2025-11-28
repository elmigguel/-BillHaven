import React, { useState, createContext, useContext } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from './contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Wallet, Settings, LogOut, Globe, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import InstallPrompt from './components/pwa/InstallPrompt';

// Wallet Context voor gebruik in andere componenten
export const WalletContext = createContext({
  connectedWallet: null,
  walletAddress: '',
  connectMetaMask: () => {},
  connectPhantom: () => {},
  disconnectWallet: () => {}
});

export default function Layout({ children }) {
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [walletAddress, setWalletAddress] = useState('');
  const { user, profile, signOut, isAdmin } = useAuth();

  const connectMetaMask = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
        setConnectedWallet('metamask');
      } catch (error) {
        alert('MetaMask connectie geweigerd');
      }
    } else {
      window.open('https://metamask.io/download/', '_blank');
    }
  };

  const connectPhantom = async () => {
    if (typeof window.solana !== 'undefined' && window.solana.isPhantom) {
      try {
        const response = await window.solana.connect();
        setWalletAddress(response.publicKey.toString());
        setConnectedWallet('phantom');
      } catch (error) {
        alert('Phantom connectie geweigerd');
      }
    } else {
      window.open('https://phantom.app/', '_blank');
    }
  };

  const connectCoinbase = async () => {
    if (typeof window.ethereum !== 'undefined' && window.ethereum.isCoinbaseWallet) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
        setConnectedWallet('coinbase');
      } catch (error) {
        alert('Coinbase Wallet connectie geweigerd');
      }
    } else {
      window.open('https://www.coinbase.com/wallet', '_blank');
    }
  };

  const disconnectWallet = () => {
    setConnectedWallet(null);
    setWalletAddress('');
  };

  const shortenAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Top Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2">
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400">
                Bill Haven
              </span>
            </Link>

            <div className="flex items-center gap-3">
              {/* Public Bills Link */}
              <Link to={createPageUrl('PublicBills')}>
                <Button variant="ghost" className="text-gray-300 hover:bg-gray-700">
                  <Globe className="w-4 h-4 mr-2" />
                  Publieke Bills
                </Button>
              </Link>

              {/* Wallet Connect */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    className={`${connectedWallet ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    {connectedWallet ? shortenAddress(walletAddress) : 'Connect Wallet'}
                    <ChevronDown className="w-4 h-4 ml-2" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700 w-56">
                  {connectedWallet ? (
                    <>
                      <div className="px-3 py-2 text-xs text-gray-400">
                        Verbonden met {connectedWallet}
                      </div>
                      <div className="px-3 py-2 font-mono text-xs text-emerald-400 break-all">
                        {walletAddress}
                      </div>
                      <DropdownMenuSeparator className="bg-gray-700" />
                      <DropdownMenuItem 
                        className="text-red-400 focus:bg-gray-700 cursor-pointer"
                        onClick={disconnectWallet}
                      >
                        Wallet Loskoppelen
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <>
                      <DropdownMenuItem 
                        className="text-gray-300 focus:bg-gray-700 cursor-pointer"
                        onClick={connectMetaMask}
                      >
                        <img src="https://upload.wikimedia.org/wikipedia/commons/3/36/MetaMask_Fox.svg" className="w-5 h-5 mr-2" alt="MetaMask" />
                        MetaMask
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-gray-300 focus:bg-gray-700 cursor-pointer"
                        onClick={connectPhantom}
                      >
                        <img src="https://phantom.app/img/phantom-logo.svg" className="w-5 h-5 mr-2" alt="Phantom" />
                        Phantom (Solana)
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-gray-300 focus:bg-gray-700 cursor-pointer"
                        onClick={connectCoinbase}
                      >
                        <img src="https://www.coinbase.com/img/favicon/favicon-256.png" className="w-5 h-5 mr-2" alt="Coinbase" />
                        Coinbase Wallet
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="text-gray-300 hover:bg-gray-700">
                      {profile?.full_name || user?.email}
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                    {isAdmin() && (
                      <DropdownMenuItem className="text-gray-300 focus:bg-gray-700" asChild>
                        <Link to={createPageUrl('Settings')}>
                          <Settings className="w-4 h-4 mr-2" />
                          Instellingen
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      className="text-red-400 focus:bg-gray-700 cursor-pointer"
                      onClick={() => signOut()}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Uitloggen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    Inloggen
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <WalletContext.Provider value={{
        connectedWallet,
        walletAddress,
        connectMetaMask,
        connectPhantom,
        connectCoinbase,
        disconnectWallet
      }}>
        {children}
      </WalletContext.Provider>

      <InstallPrompt />
    </div>
  );
}

export const useWallet = () => useContext(WalletContext);