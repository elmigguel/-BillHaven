import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { WalletProvider } from './contexts/WalletContext';
import { TonWalletProvider } from './contexts/TonWalletContext';
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
};

window.createPageUrl = (pageName) => pageUrlMap[pageName] || '/';

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <WalletProvider>
            <TonWalletProvider>
              <Routes>
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
              </Routes>
            </TonWalletProvider>
          </WalletProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}