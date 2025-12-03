import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  Gift,
  Share2,
  Copy,
  Check,
  TrendingUp,
  DollarSign,
  Award,
  Zap,
  LogIn,
  Home
} from 'lucide-react';

export default function Referral() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalReferrals: 0,
    activeReferrals: 0,
    discountedTransactionsRemaining: 0,
    volumeRemaining: 10000,
    totalSaved: 0
  });
  const [referralHistory, setReferralHistory] = useState([]);

  useEffect(() => {
    if (user) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get or create referral code
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Profile error:', profileError);
        // Generate a temporary code for display
        setReferralCode(generateReferralCode());
      } else if (!profile?.referral_code) {
        // Generate referral code if doesn't exist
        const newCode = generateReferralCode();
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ referral_code: newCode })
          .eq('id', user.id);

        if (!updateError) {
          setReferralCode(newCode);
        } else {
          setReferralCode(generateReferralCode());
        }
      } else {
        setReferralCode(profile.referral_code);
      }

      // Load referral stats (mock data for now - replace with actual DB queries)
      setStats({
        totalReferrals: 5,
        activeReferrals: 3,
        discountedTransactionsRemaining: 9,
        volumeRemaining: 8500,
        totalSaved: 245.50
      });

      // Load referral history (mock data)
      setReferralHistory([
        { id: 1, username: 'user***', status: 'Active', date: '2024-11-15', firstTransaction: 750 },
        { id: 2, username: 'trad***', status: 'Active', date: '2024-11-10', firstTransaction: 1200 },
        { id: 3, username: 'cryp***', status: 'Active', date: '2024-11-05', firstTransaction: 550 },
        { id: 4, username: 'btc_***', status: 'Pending', date: '2024-11-20', firstTransaction: 0 },
        { id: 5, username: 'eth_***', status: 'Pending', date: '2024-11-22', firstTransaction: 0 },
      ]);

    } catch (err) {
      console.error('Error loading referral data:', err);
      setReferralCode(generateReferralCode());
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      // Fallback: create temporary textarea
      const textArea = document.createElement('textarea');
      textArea.value = referralCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareOnTwitter = () => {
    const text = `Join BillHaven with my referral code ${referralCode} and get 50% off fees! 🚀 #BillHaven #Crypto`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const shareViaEmail = () => {
    const subject = 'Join BillHaven and Save 50% on Fees!';
    const body = `Hey! I'm using BillHaven for secure P2P crypto transactions.\n\nUse my referral code: ${referralCode}\n\nYou'll get 50% off fees on your first 3 transactions (up to $10K)!\n\nCheck it out: ${window.location.origin}`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const shareViaWhatsApp = () => {
    const text = `Join BillHaven with my referral code ${referralCode} and get 50% off fees! ${window.location.origin}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost" className="mb-6 text-gray-300 hover:bg-white/5">
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        {/* Hero Banner */}
        <motion.div
          className="mb-8 bg-gradient-to-r from-purple-900/50 via-indigo-900/50 to-emerald-900/50 rounded-2xl p-8 border border-purple-700/50 relative overflow-hidden backdrop-blur-sm"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-emerald-600/10"></div>
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
              <div className="p-4 bg-gradient-to-br from-purple-600 to-emerald-600 rounded-2xl shadow-lg shadow-purple-500/25">
                <Gift className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-white to-emerald-300">
                  UP TO 50% OFF FEES!
                </h1>
                <p className="text-lg text-purple-200 mt-2">
                  Share the love and earn together
                </p>
              </div>
            </div>
            <p className="text-gray-300 mb-4 max-w-2xl">
              Get 50% off fees for you and your friends on their next 3 transactions.
              The more you refer, the more you save!
            </p>
            <div className="flex items-center gap-2 text-emerald-400">
              <Zap className="w-5 h-5" />
              <span className="font-semibold">Limited time offer - Start referring today!</span>
            </div>
          </div>
        </motion.div>

        {/* How It Works */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="bg-dark-card/80 border-dark-border backdrop-blur-sm hover:border-purple-600/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-purple-500/25">
                    1
                  </div>
                  <h3 className="text-lg font-semibold text-white">Share Your Code</h3>
                </div>
                <p className="text-gray-400">
                  Share your unique referral code with friends via Twitter, WhatsApp, or email.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-dark-card/80 border-dark-border backdrop-blur-sm hover:border-indigo-600/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-indigo-500/25">
                    2
                  </div>
                  <h3 className="text-lg font-semibold text-white">Friend Completes Transaction</h3>
                </div>
                <p className="text-gray-400">
                  Your friend signs up and completes their first transaction of $500 or more.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-dark-card/80 border-dark-border backdrop-blur-sm hover:border-emerald-600/50 transition-colors">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center font-bold text-white text-xl shadow-lg shadow-emerald-500/25">
                    3
                  </div>
                  <h3 className="text-lg font-semibold text-white">Both Get 50% Off</h3>
                </div>
                <p className="text-gray-400">
                  You both get 50% off fees on your next 3 transactions (up to $10K total volume).
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Your Referral Code - Only show if logged in */}
        {user ? (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-2">
              <Share2 className="w-6 h-6 text-emerald-400" />
              Your Referral Code
            </h2>
            <Card className="bg-gradient-to-br from-dark-card to-dark-elevated border-purple-700/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-6">
                      <p className="text-gray-400 mb-2">Your unique referral code:</p>
                      <div className="inline-flex items-center gap-4 bg-dark-primary/50 px-8 py-4 rounded-xl border border-purple-600/50">
                        <span className="text-4xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-emerald-400">
                          {referralCode || 'LOADING...'}
                        </span>
                        <Button
                          onClick={copyToClipboard}
                          variant="outline"
                          size="sm"
                          className="border-purple-600 hover:bg-purple-600 hover:text-white"
                          disabled={!referralCode}
                        >
                          {copied ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap justify-center gap-3">
                      <Button
                        onClick={shareOnTwitter}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                        </svg>
                        Share on Twitter
                      </Button>

                      <Button
                        onClick={shareViaWhatsApp}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                        </svg>
                        Share on WhatsApp
                      </Button>

                      <Button
                        onClick={shareViaEmail}
                        className="bg-gray-700 hover:bg-gray-600 text-white"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Share via Email
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* Login CTA for non-authenticated users */
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-purple-900/30 to-emerald-900/30 border-purple-700/50 backdrop-blur-sm">
              <CardContent className="pt-8 pb-8">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-600 to-emerald-600 flex items-center justify-center">
                    <Gift className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Get Your Referral Code</h3>
                  <p className="text-gray-400 mb-6 max-w-md mx-auto">
                    Sign in to get your unique referral code and start earning 50% off fees with your friends!
                  </p>
                  <div className="flex justify-center gap-4">
                    <Link to="/login">
                      <Button className="bg-gradient-to-r from-purple-600 to-emerald-600 hover:from-purple-700 hover:to-emerald-700 text-white px-8">
                        <LogIn className="w-4 h-4 mr-2" />
                        Sign In
                      </Button>
                    </Link>
                    <Link to="/register">
                      <Button variant="outline" className="border-purple-600 text-purple-300 hover:bg-purple-600/20">
                        Create Account
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Referral Stats Dashboard - Only for logged-in users */}
        {user && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-purple-400" />
              Your Stats
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="bg-gradient-to-br from-purple-900/80 to-purple-800/80 border-purple-700/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Users className="w-5 h-5 text-purple-300" />
                    <p className="text-purple-200 text-sm">Total Referrals</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.totalReferrals}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-indigo-900/80 to-indigo-800/80 border-indigo-700/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Award className="w-5 h-5 text-indigo-300" />
                    <p className="text-indigo-200 text-sm">Active Referrals</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.activeReferrals}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-900/80 to-emerald-800/80 border-emerald-700/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-emerald-300" />
                    <p className="text-emerald-200 text-sm">Discounts Left</p>
                  </div>
                  <p className="text-3xl font-bold text-white">{stats.discountedTransactionsRemaining}/9</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-cyan-900/80 to-cyan-800/80 border-cyan-700/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <DollarSign className="w-5 h-5 text-cyan-300" />
                    <p className="text-cyan-200 text-sm">Volume Remaining</p>
                  </div>
                  <p className="text-3xl font-bold text-white">${stats.volumeRemaining.toLocaleString()}</p>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-900/80 to-orange-900/80 border-yellow-700/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-2">
                    <Gift className="w-5 h-5 text-yellow-300" />
                    <p className="text-yellow-200 text-sm">Total Saved</p>
                  </div>
                  <p className="text-3xl font-bold text-white">${stats.totalSaved.toFixed(2)}</p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {/* Referral History - Only for logged-in users */}
        {user && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h2 className="text-2xl font-bold text-gray-100 mb-6 flex items-center gap-2">
              <Users className="w-6 h-6 text-emerald-400" />
              Referral History
            </h2>
            <Card className="bg-dark-card/80 border-dark-border backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-dark-border">
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">User</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Status</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">Date Joined</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-semibold">First Transaction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {referralHistory.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="text-center py-8 text-gray-500">
                            No referrals yet. Start sharing your code!
                          </td>
                        </tr>
                      ) : (
                        referralHistory.map((ref) => (
                          <tr key={ref.id} className="border-b border-dark-border hover:bg-white/5">
                            <td className="py-3 px-4 text-white">{ref.username}</td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                                ref.status === 'Active'
                                  ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700/50'
                                  : 'bg-yellow-900/50 text-yellow-300 border border-yellow-700/50'
                              }`}>
                                {ref.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-gray-400">{ref.date}</td>
                            <td className="py-3 px-4 text-gray-400">
                              {ref.firstTransaction > 0
                                ? `$${ref.firstTransaction.toLocaleString()}`
                                : '-'}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Fine Print */}
        <motion.div
          className="bg-dark-card/80 rounded-xl border border-dark-border backdrop-blur-sm p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="text-xl font-bold text-gray-100 mb-4">Terms & Conditions</h3>
          <div className="space-y-2 text-gray-400 text-sm">
            <p className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">•</span>
              <span>50% discount applies to transactions under $10,000 ONLY</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">•</span>
              <span>Each successful referral grants 3 discounted transactions for both referrer and referred user</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">•</span>
              <span>$10,000 total volume cap across those 3 discounted transactions</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">•</span>
              <span>Referral activates when referred friend completes their first transaction of $500 or more</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">•</span>
              <span>Discount automatically applied at checkout for eligible transactions</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-purple-400 mt-1">•</span>
              <span>BillHaven reserves the right to modify or terminate the referral program at any time</span>
            </p>
          </div>
        </motion.div>

        {/* CTA - Different for logged in vs not */}
        <motion.div
          className="mt-8 p-6 bg-gradient-to-r from-purple-900/50 to-emerald-900/50 rounded-xl border border-purple-700/50 backdrop-blur-sm"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="text-lg font-bold text-white mb-2">Start Saving Today</h3>
          <p className="text-purple-200 mb-4">
            {user
              ? 'Share your referral code and unlock massive savings for you and your friends!'
              : 'Create an account to get your unique referral code and start saving on fees!'
            }
          </p>
          {user ? (
            <Button
              onClick={copyToClipboard}
              className="bg-white text-purple-900 hover:bg-gray-100"
              disabled={!referralCode}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Code Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Referral Code
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-4">
              <Link to="/register">
                <Button className="bg-white text-purple-900 hover:bg-gray-100">
                  Create Free Account
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="outline" className="border-white/30 text-white hover:bg-white/10">
                  Sign In
                </Button>
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
