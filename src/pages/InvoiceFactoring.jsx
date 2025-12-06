import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import {
  FileText, Home, Package, UserCheck, Cloud, Zap, File,
  DollarSign, Percent, Calendar, Upload, Search, Filter,
  ChevronDown, ChevronUp, CheckCircle, Clock, AlertCircle,
  Download, Eye, ShoppingCart, TrendingUp, Shield, Info
} from 'lucide-react';
import {
  FACTORING_TYPES,
  createFactoringListing,
  getAvailableListings,
  purchaseInvoice,
  generateAssignmentDocuments,
  getUserFactoringHistory,
  getTaxSummary,
  getFeaturedListings
} from '../services/invoiceFactoringService';

const iconMap = {
  FileText, Home, Package, UserCheck, Cloud, Zap, File
};

export default function InvoiceFactoring() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('marketplace');
  const [listings, setListings] = useState([]);
  const [myListings, setMyListings] = useState([]);
  const [myPurchases, setMyPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [filters, setFilters] = useState({ type: 'all', minDiscount: 0 });

  // Create listing form state
  const [createForm, setCreateForm] = useState({
    type: 'invoice',
    originalAmount: '',
    askingAmount: '',
    currency: 'USD',
    cryptoType: 'USDC',
    dueDate: '',
    description: '',
    documentUrl: ''
  });

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const marketplaceData = await getAvailableListings({ status: 'available' });
      setListings(marketplaceData || []);

      if (user) {
        const historyData = await getUserFactoringHistory(user.id, 'both');
        // Split into listings (seller) and purchases (buyer)
        const sellerListings = historyData?.filter(item => item.seller_id === user.id) || [];
        const buyerPurchases = historyData?.filter(item => item.buyer_id === user.id) || [];
        setMyListings(sellerListings);
        setMyPurchases(buyerPurchases);
      }
    } catch (err) {
      console.error('Failed to load factoring data:', err);
    }
    setLoading(false);
  };

  const handleCreateListing = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      await createFactoringListing({
        userId: user.id,
        type: createForm.type,
        originalAmount: parseFloat(createForm.originalAmount),
        askingAmount: parseFloat(createForm.askingAmount),
        currency: createForm.currency,
        cryptoType: createForm.cryptoType,
        dueDate: createForm.dueDate,
        billDetails: { description: createForm.description },
        documentUrl: createForm.documentUrl
      });
      setShowCreateModal(false);
      setCreateForm({
        type: 'invoice',
        originalAmount: '',
        askingAmount: '',
        currency: 'USD',
        cryptoType: 'USDC',
        dueDate: '',
        description: '',
        documentUrl: ''
      });
      loadData();
    } catch (err) {
      console.error('Failed to create listing:', err);
    }
  };

  const handlePurchase = async (listing) => {
    if (!user) return;
    try {
      await purchaseInvoice(listing.id, user.id);
      loadData();
      setSelectedListing(null);
    } catch (err) {
      console.error('Failed to purchase invoice:', err);
    }
  };

  const getIcon = (iconName) => {
    const Icon = iconMap[iconName] || FileText;
    return <Icon className="w-5 h-5" />;
  };

  const filteredListings = listings.filter(listing => {
    if (filters.type !== 'all' && listing.type !== filters.type) return false;
    if (listing.discount_percent < filters.minDiscount) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900/20 to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">
            Invoice Factoring Marketplace
          </h1>
          <p className="text-gray-400">
            Sell invoices for instant crypto or buy at a discount with full documentation
          </p>

          {/* Disclaimer Banner */}
          <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-200/80">
                <strong>Tax Disclaimer:</strong> Invoice factoring fees may be tax-deductible as business expenses.
                BillHaven provides documentation tools only. Always consult a qualified tax professional
                for advice specific to your situation.
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800/50 rounded-xl p-4 border border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <FileText className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Available Invoices</p>
                <p className="text-2xl font-bold text-white">{listings.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gray-800/50 rounded-xl p-4 border border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Avg Discount</p>
                <p className="text-2xl font-bold text-white">
                  {listings.length > 0
                    ? (listings.reduce((a, b) => a + (b.discount_percent || 0), 0) / listings.length).toFixed(1)
                    : 0}%
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gray-800/50 rounded-xl p-4 border border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <ShoppingCart className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">My Purchases</p>
                <p className="text-2xl font-bold text-white">{myPurchases.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gray-800/50 rounded-xl p-4 border border-gray-700"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-gray-400 text-sm">My Listings</p>
                <p className="text-2xl font-bold text-white">{myListings.length}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          {['marketplace', 'my-listings', 'my-purchases'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                activeTab === tab
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {tab === 'marketplace' && 'Marketplace'}
              {tab === 'my-listings' && 'My Listings'}
              {tab === 'my-purchases' && 'My Purchases'}
            </button>
          ))}

          {user && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="ml-auto px-6 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-medium hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              + Sell Invoice
            </button>
          )}
        </div>

        {/* Filters (Marketplace only) */}
        {activeTab === 'marketplace' && (
          <div className="flex flex-wrap gap-4 mb-6">
            <select
              value={filters.type}
              onChange={(e) => setFilters({ ...filters, type: e.target.value })}
              className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white"
            >
              <option value="all">All Types</option>
              {Object.values(FACTORING_TYPES).map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <span className="text-gray-400">Min Discount:</span>
              <input
                type="range"
                min="0"
                max="50"
                value={filters.minDiscount}
                onChange={(e) => setFilters({ ...filters, minDiscount: parseInt(e.target.value) })}
                className="w-24"
              />
              <span className="text-white">{filters.minDiscount}%</span>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeTab === 'marketplace' && filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onView={() => setSelectedListing(listing)}
                showBuy={!!user && listing.seller_id !== user.id}
              />
            ))}

            {activeTab === 'my-listings' && myListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onView={() => setSelectedListing(listing)}
                isOwner
              />
            ))}

            {activeTab === 'my-purchases' && myPurchases.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onView={() => setSelectedListing(listing)}
                isPurchased
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && (
          (activeTab === 'marketplace' && filteredListings.length === 0) ||
          (activeTab === 'my-listings' && myListings.length === 0) ||
          (activeTab === 'my-purchases' && myPurchases.length === 0)
        ) && (
          <div className="text-center py-20">
            <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              {activeTab === 'marketplace' && 'No invoices available'}
              {activeTab === 'my-listings' && 'You have no listings'}
              {activeTab === 'my-purchases' && 'No purchases yet'}
            </h3>
            <p className="text-gray-500">
              {activeTab === 'marketplace' && 'Be the first to list an invoice for sale!'}
              {activeTab === 'my-listings' && 'Create a listing to sell your invoices'}
              {activeTab === 'my-purchases' && 'Browse the marketplace to find invoices'}
            </p>
          </div>
        )}

        {/* Create Listing Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-gray-800 rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-2xl font-bold text-white mb-6">Sell Invoice</h2>

                <form onSubmit={handleCreateListing} className="space-y-4">
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Invoice Type</label>
                    <select
                      value={createForm.type}
                      onChange={(e) => setCreateForm({ ...createForm, type: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                    >
                      {Object.values(FACTORING_TYPES).map(type => (
                        <option key={type.id} value={type.id}>{type.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Original Amount</label>
                      <input
                        type="number"
                        value={createForm.originalAmount}
                        onChange={(e) => setCreateForm({ ...createForm, originalAmount: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                        placeholder="1000"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Asking Amount</label>
                      <input
                        type="number"
                        value={createForm.askingAmount}
                        onChange={(e) => setCreateForm({ ...createForm, askingAmount: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                        placeholder="950"
                        required
                      />
                    </div>
                  </div>

                  {createForm.originalAmount && createForm.askingAmount && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3 text-center">
                      <span className="text-green-400 font-medium">
                        {((1 - createForm.askingAmount / createForm.originalAmount) * 100).toFixed(1)}% discount for buyers
                      </span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Currency</label>
                      <select
                        value={createForm.currency}
                        onChange={(e) => setCreateForm({ ...createForm, currency: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                      >
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                        <option value="GBP">GBP</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-400 text-sm mb-2">Accept Crypto</label>
                      <select
                        value={createForm.cryptoType}
                        onChange={(e) => setCreateForm({ ...createForm, cryptoType: e.target.value })}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                      >
                        <option value="USDC">USDC</option>
                        <option value="USDT">USDT</option>
                        <option value="ETH">ETH</option>
                        <option value="MATIC">MATIC</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Due Date</label>
                    <input
                      type="date"
                      value={createForm.dueDate}
                      onChange={(e) => setCreateForm({ ...createForm, dueDate: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Description</label>
                    <textarea
                      value={createForm.description}
                      onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white h-24"
                      placeholder="Describe the invoice/bill..."
                      required
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 px-4 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all"
                    >
                      Create Listing
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Listing Detail Modal */}
        <AnimatePresence>
          {selectedListing && (
            <ListingDetailModal
              listing={selectedListing}
              onClose={() => setSelectedListing(null)}
              onPurchase={handlePurchase}
              user={user}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function ListingCard({ listing, onView, showBuy, isOwner, isPurchased }) {
  const typeInfo = FACTORING_TYPES[listing.type?.toUpperCase()] || FACTORING_TYPES.OTHER;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800/50 rounded-xl p-5 border border-gray-700 hover:border-purple-500/50 transition-all cursor-pointer"
      onClick={onView}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <FileText className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">{typeInfo.name}</h3>
            <p className="text-sm text-gray-400">{listing.currency || 'USD'}</p>
          </div>
        </div>
        {listing.status === 'available' && (
          <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
            Available
          </span>
        )}
        {listing.status === 'completed' && (
          <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
            Sold
          </span>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="text-gray-400">Original</span>
          <span className="text-white font-medium">
            ${parseFloat(listing.original_amount || 0).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Asking</span>
          <span className="text-green-400 font-medium">
            ${parseFloat(listing.asking_amount || 0).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Discount</span>
          <span className="text-purple-400 font-medium">
            {listing.discount_percent || 0}%
          </span>
        </div>
        {listing.due_date && (
          <div className="flex justify-between">
            <span className="text-gray-400">Due Date</span>
            <span className="text-white">
              {new Date(listing.due_date).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-gray-700">
        <button className="w-full py-2 bg-purple-600/20 text-purple-400 rounded-lg hover:bg-purple-600/30 transition-colors">
          View Details
        </button>
      </div>
    </motion.div>
  );
}

function ListingDetailModal({ listing, onClose, onPurchase, user }) {
  const typeInfo = FACTORING_TYPES[listing.type?.toUpperCase()] || FACTORING_TYPES.OTHER;
  const canBuy = user && listing.seller_id !== user.id && listing.status === 'available';
  const isPurchased = listing.buyer_id === user?.id;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-800 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-white">{typeInfo.name}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-700/50 rounded-xl p-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-400 text-sm">Original Amount</p>
                <p className="text-xl font-bold text-white">
                  ${parseFloat(listing.original_amount || 0).toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm">Asking Price</p>
                <p className="text-xl font-bold text-green-400">
                  ${parseFloat(listing.asking_amount || 0).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-400">Your Savings</span>
                <span className="text-purple-400 font-bold">
                  ${(listing.original_amount - listing.asking_amount).toLocaleString()} ({listing.discount_percent}%)
                </span>
              </div>
            </div>
          </div>

          <div className="bg-gray-700/50 rounded-xl p-4">
            <h3 className="font-semibold text-white mb-3">Invoice Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Type</span>
                <span className="text-white">{typeInfo.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Currency</span>
                <span className="text-white">{listing.currency || 'USD'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Accept</span>
                <span className="text-white">{listing.crypto_type || 'USDC'}</span>
              </div>
              {listing.due_date && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Due Date</span>
                  <span className="text-white">{new Date(listing.due_date).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>

          {listing.bill_details?.description && (
            <div className="bg-gray-700/50 rounded-xl p-4">
              <h3 className="font-semibold text-white mb-2">Description</h3>
              <p className="text-gray-300 text-sm">{listing.bill_details.description}</p>
            </div>
          )}

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-200/80">
                <strong>Tax Documentation:</strong> Upon purchase, you'll receive:
                <ul className="list-disc ml-4 mt-2 space-y-1">
                  <li>Invoice Purchase Agreement</li>
                  <li>Transfer Certificate</li>
                  <li>Payment Receipt</li>
                  <li>Tax Summary Document</li>
                </ul>
              </div>
            </div>
          </div>

          {isPurchased && (
            <div className="space-y-2">
              <h3 className="font-semibold text-white">Download Documents</h3>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-2 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                  <Download className="w-4 h-4" />
                  Agreement
                </button>
                <button className="flex items-center justify-center gap-2 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                  <Download className="w-4 h-4" />
                  Certificate
                </button>
                <button className="flex items-center justify-center gap-2 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                  <Download className="w-4 h-4" />
                  Receipt
                </button>
                <button className="flex items-center justify-center gap-2 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors">
                  <Download className="w-4 h-4" />
                  Tax Summary
                </button>
              </div>
            </div>
          )}

          {canBuy && (
            <button
              onClick={() => onPurchase(listing)}
              className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all"
            >
              Purchase Invoice for ${parseFloat(listing.asking_amount).toLocaleString()}
            </button>
          )}

          {!user && (
            <div className="text-center text-gray-400 py-4">
              <a href="/login" className="text-purple-400 hover:underline">Log in</a> to purchase invoices
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
