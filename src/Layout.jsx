import React from 'react'
import { Link } from 'react-router-dom'
import { createPageUrl } from '@/utils'
import { useAuth } from './contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Settings, LogOut, Globe, ChevronDown } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import InstallPrompt from './components/pwa/InstallPrompt'
import ConnectWalletButton from './components/wallet/ConnectWalletButton'

export default function Layout({ children }) {
  const { user, profile, signOut, isAdmin } = useAuth()

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

                {/* Wallet Connect - New Component */}
                <ConnectWalletButton />

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

      {children}

      <InstallPrompt />
    </div>
  )
}
