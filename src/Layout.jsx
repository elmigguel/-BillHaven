/**
 * Layout - Premium app layout with professional header
 * Like Coinbase/Phantom level design
 */

import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { createPageUrl } from '@/utils'
import { useAuth } from './contexts/AuthContext'
import { Button } from '@/components/ui/button'
import BillHavenLogo from '@/components/ui/BillHavenLogo'
import AnimatedBackground from '@/components/ui/AnimatedBackground'
import {
  Settings,
  LogOut,
  Globe,
  ChevronDown,
  Home,
  LayoutDashboard,
  FileText,
  Send,
  DollarSign,
  Users,
  Menu,
  X
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import InstallPrompt from './components/pwa/InstallPrompt'
import ConnectWalletButton from './components/wallet/ConnectWalletButton'

// Navigation items
const NAV_ITEMS = [
  { name: 'Home', path: 'Home', icon: Home },
  { name: 'Dashboard', path: 'Dashboard', icon: LayoutDashboard, auth: true },
  { name: 'Public Bills', path: 'PublicBills', icon: Globe },
  { name: 'Submit Bill', path: 'SubmitBill', icon: Send, auth: true },
  { name: 'My Bills', path: 'MyBills', icon: FileText, auth: true },
  { name: 'Fees', path: 'FeeStructure', icon: DollarSign },
  { name: 'Referral', path: 'Referral', icon: Users },
]

export default function Layout({ children }) {
  const { user, profile, signOut, isAdmin } = useAuth()
  const location = useLocation()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  // Check if current path matches nav item
  const isActive = (path) => {
    const url = createPageUrl(path)
    return location.pathname === url
  }

  // Filter nav items based on auth
  const visibleNavItems = NAV_ITEMS.filter(item => !item.auth || user)

  return (
    <AnimatedBackground variant="subtle">
      {/* Premium Header */}
      <nav className="sticky top-0 z-50 border-b border-white/5">
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-dark-primary/80 backdrop-blur-xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Logo */}
            <Link to={createPageUrl('Home')} className="flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <BillHavenLogo size="default" />
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {visibleNavItems.slice(0, 5).map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)

                return (
                  <Link key={item.path} to={createPageUrl(item.path)}>
                    <motion.div
                      className={`
                        flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                        transition-all duration-200
                        ${active
                          ? 'bg-brand-purple/15 text-white border border-brand-purple/30'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }
                      `}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </motion.div>
                  </Link>
                )
              })}
            </div>

            {/* Right side - Wallet & User */}
            <div className="flex items-center gap-3">
              {/* Wallet Connect */}
              <div className="hidden sm:block">
                <ConnectWalletButton />
              </div>

              {/* User Menu */}
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="text-gray-300 hover:bg-white/5 hover:text-white rounded-xl"
                    >
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center text-white font-semibold text-sm mr-2">
                        {(profile?.full_name || user?.email)?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="hidden sm:inline max-w-[100px] truncate">
                        {profile?.full_name || user?.email?.split('@')[0]}
                      </span>
                      <ChevronDown className="w-4 h-4 ml-2 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-56 bg-dark-elevated/95 backdrop-blur-xl border-dark-border rounded-xl shadow-2xl"
                  >
                    <DropdownMenuLabel className="text-gray-400 font-normal">
                      <div className="flex flex-col">
                        <span className="font-semibold text-white">
                          {profile?.full_name || 'User'}
                        </span>
                        <span className="text-xs truncate">{user?.email}</span>
                      </div>
                    </DropdownMenuLabel>

                    <DropdownMenuSeparator className="bg-dark-border" />

                    {/* More Nav Items */}
                    {visibleNavItems.slice(5).map((item) => {
                      const Icon = item.icon
                      return (
                        <DropdownMenuItem key={item.path} className="text-gray-300 focus:bg-white/5 rounded-lg" asChild>
                          <Link to={createPageUrl(item.path)} className="flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {item.name}
                          </Link>
                        </DropdownMenuItem>
                      )
                    })}

                    {isAdmin() && (
                      <>
                        <DropdownMenuSeparator className="bg-dark-border" />
                        <DropdownMenuItem className="text-gray-300 focus:bg-white/5 rounded-lg" asChild>
                          <Link to={createPageUrl('Settings')} className="flex items-center gap-2">
                            <Settings className="w-4 h-4" />
                            Admin Settings
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator className="bg-dark-border" />

                    <DropdownMenuItem
                      className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer rounded-lg"
                      onClick={() => signOut()}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link to="/login">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button className="bg-gradient-to-r from-brand-blue to-brand-purple hover:from-brand-blue/90 hover:to-brand-purple/90 text-white rounded-xl shadow-lg shadow-brand-blue/20">
                      Sign In
                    </Button>
                  </motion.div>
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-gray-400 hover:text-white"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden border-t border-white/5 bg-dark-primary/95 backdrop-blur-xl"
          >
            <div className="px-4 py-4 space-y-2">
              {/* Mobile Wallet */}
              <div className="sm:hidden pb-3 border-b border-white/5">
                <ConnectWalletButton />
              </div>

              {/* Nav Items */}
              {visibleNavItems.map((item) => {
                const Icon = item.icon
                const active = isActive(item.path)

                return (
                  <Link
                    key={item.path}
                    to={createPageUrl(item.path)}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <div
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium
                        transition-all duration-200
                        ${active
                          ? 'bg-brand-purple/15 text-white border border-brand-purple/30'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }
                      `}
                    >
                      <Icon className="w-5 h-5" />
                      {item.name}
                    </div>
                  </Link>
                )
              })}
            </div>
          </motion.div>
        )}
      </nav>

      {/* Main Content */}
      <main className="relative">
        {children}
      </main>

      {/* PWA Install Prompt */}
      <InstallPrompt />
    </AnimatedBackground>
  )
}
