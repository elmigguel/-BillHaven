import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { WalletProvider } from './contexts/WalletContext';
import { TonWalletProvider } from './contexts/TonWalletContext';
import { SolanaWalletProvider } from './contexts/SolanaWalletContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './Layout.jsx';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import SubmitBill from './pages/SubmitBill';
import MyBills from './pages/MyBills';
import ReviewBills from './pages/ReviewBills';
import FeeStructure from './pages/FeeStructure';
import PublicBills from './pages/PublicBills';
import Settings from './pages/Settings';
import DisputeAdmin from './pages/DisputeAdmin';
import Referral from './pages/Referral';
import Support from './pages/Support';
import Premium from './pages/Premium';
import Trust from './pages/Trust';
import Terms from './pages/Terms';
import InvoiceFactoring from './pages/InvoiceFactoring';
import Quests from './components/gamification/Quests';

// Mock createPageUrl function
const pageUrlMap = {
  Home: '/',
  Login: '/login',
  Signup: '/signup',
  Dashboard: '/dashboard',
  SubmitBill: '/submit-bill',
  MyBills: '/my-bills',
  ReviewBills: '/review-bills',
  FeeStructure: '/fee-structure',
  PublicBills: '/public-bills',
  Settings: '/settings',
  DisputeAdmin: '/dispute-admin',
  Referral: '/referral',
  Support: '/support',
  Premium: '/premium',
  Trust: '/trust',
  Terms: '/terms',
  InvoiceFactoring: '/invoice-factoring',
  Quests: '/quests',
};

window.createPageUrl = (pageName) => pageUrlMap[pageName] || '/';

// Animated Routes wrapper component
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public routes */}
        <Route path={window.createPageUrl('Home')} element={<Layout><Home /></Layout>} />
        <Route path={window.createPageUrl('Login')} element={<Login />} />
        <Route path={window.createPageUrl('Signup')} element={<Signup />} />
        <Route path={window.createPageUrl('FeeStructure')} element={<Layout><FeeStructure /></Layout>} />

        {/* Protected routes */}
        <Route
          path={window.createPageUrl('Dashboard')}
          element={
            <ProtectedRoute>
              <Layout><Dashboard /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={window.createPageUrl('SubmitBill')}
          element={
            <ProtectedRoute>
              <Layout><SubmitBill /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={window.createPageUrl('MyBills')}
          element={
            <ProtectedRoute>
              <Layout><MyBills /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={window.createPageUrl('ReviewBills')}
          element={
            <ProtectedRoute requireAdmin={true}>
              <Layout><ReviewBills /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={window.createPageUrl('PublicBills')}
          element={
            <ProtectedRoute>
              <Layout><PublicBills /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={window.createPageUrl('Settings')}
          element={
            <ProtectedRoute requireAdmin={true}>
              <Layout><Settings /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={window.createPageUrl('DisputeAdmin')}
          element={
            <ProtectedRoute requireAdmin={true}>
              <Layout><DisputeAdmin /></Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path={window.createPageUrl('Referral')}
          element={
            <ProtectedRoute>
              <Layout><Referral /></Layout>
            </ProtectedRoute>
          }
        />

        {/* Public support page */}
        <Route
          path="/support"
          element={<Layout><Support /></Layout>}
        />

        {/* Premium page (public, can view without login) */}
        <Route
          path={window.createPageUrl('Premium')}
          element={<Layout><Premium /></Layout>}
        />

        {/* Trust dashboard (public) */}
        <Route
          path={window.createPageUrl('Trust')}
          element={<Layout><Trust /></Layout>}
        />

        {/* Terms of Service (public) */}
        <Route
          path={window.createPageUrl('Terms')}
          element={<Layout><Terms /></Layout>}
        />

        {/* Invoice Factoring Marketplace (public, but actions need login) */}
        <Route
          path={window.createPageUrl('InvoiceFactoring')}
          element={<Layout><InvoiceFactoring /></Layout>}
        />

        {/* Quests page (protected) */}
        <Route
          path={window.createPageUrl('Quests')}
          element={
            <ProtectedRoute>
              <Layout><Quests /></Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

// Wallet Error Fallback - shows when a wallet provider fails
function WalletErrorFallback({ walletName, children }) {
  return (
    <React.Fragment>
      {children}
    </React.Fragment>
  );
}

// Safe wrapper for wallet providers - isolates errors
function SafeWalletProvider({ Provider, name, children }) {
  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => {
        console.warn(`${name} provider failed:`, error);
        return <WalletErrorFallback walletName={name}>{children}</WalletErrorFallback>;
      }}
    >
      <Provider>{children}</Provider>
    </ErrorBoundary>
  );
}

// Loading component shown during provider initialization
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="text-white text-xl mb-4">Loading BillHaven...</div>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
      </div>
    </div>
  );
}

export default function App() {
  console.log('✅ App component rendering...')
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <React.Suspense fallback={<LoadingScreen />}>
              <ErrorBoundary>
                <WalletProvider>
                <ErrorBoundary>
                  <TonWalletProvider>
                    <ErrorBoundary>
                        <SolanaWalletProvider network="mainnet" autoConnect={false}>
                          <AnimatedRoutes />
                        </SolanaWalletProvider>
                      </ErrorBoundary>
                    </TonWalletProvider>
                  </ErrorBoundary>
                </WalletProvider>
              </ErrorBoundary>
            </React.Suspense>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}