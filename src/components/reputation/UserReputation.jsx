/**
 * UserReputation - Trust profile display component
 * Shows trust score, badges, reviews, and trade history
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Star,
  Clock,
  TrendingUp,
  Award,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Minus,
  ChevronDown,
  ExternalLink
} from 'lucide-react'
import {
  getUserReputation,
  getUserReviews,
  TRUST_LEVELS,
  VERIFICATION_BADGES
} from '@/services/reputationService'

// Trust score ring colors
const getTrustColor = (score) => {
  if (score >= 80) return 'text-green-400 stroke-green-400'
  if (score >= 60) return 'text-blue-400 stroke-blue-400'
  if (score >= 40) return 'text-yellow-400 stroke-yellow-400'
  if (score >= 20) return 'text-orange-400 stroke-orange-400'
  return 'text-gray-400 stroke-gray-400'
}

// Trust score ring component
function TrustScoreRing({ score, size = 80 }) {
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className="stroke-gray-700"
        />
        {/* Progress circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          className={getTrustColor(score)}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-xl font-bold ${getTrustColor(score).split(' ')[0]}`}>
          {score}
        </span>
      </div>
    </div>
  )
}

// Badge display component
function BadgeDisplay({ badges = [] }) {
  if (badges.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {badges.map((badgeId) => {
        const badge = VERIFICATION_BADGES[badgeId]
        if (!badge) return null

        return (
          <motion.div
            key={badgeId}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-dark-elevated border border-dark-border"
            title={badge.description}
          >
            <span>{badge.icon}</span>
            <span className="text-xs font-medium text-gray-300">{badge.name}</span>
          </motion.div>
        )
      })}
    </div>
  )
}

// Review item component
function ReviewItem({ review }) {
  const ratingIcon = review.rating === 3 ? (
    <ThumbsUp className="w-4 h-4 text-green-400" />
  ) : review.rating === 1 ? (
    <ThumbsDown className="w-4 h-4 text-red-400" />
  ) : (
    <Minus className="w-4 h-4 text-gray-400" />
  )

  const ratingColor = review.rating === 3 ? 'border-green-500/30 bg-green-500/5' :
                      review.rating === 1 ? 'border-red-500/30 bg-red-500/5' :
                      'border-gray-500/30 bg-gray-500/5'

  const reviewerName = review.reviewer?.profiles?.full_name ||
                       review.reviewer?.profiles?.wallet_address?.slice(0, 8) + '...' ||
                       'Anonymous'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-4 rounded-xl border ${ratingColor}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          {ratingIcon}
          <span className="font-medium text-white">{reviewerName}</span>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(review.created_at).toLocaleDateString()}
        </span>
      </div>
      {review.comment && (
        <p className="text-sm text-gray-400">{review.comment}</p>
      )}
    </motion.div>
  )
}

// Main reputation card component
export default function UserReputation({ userId, compact = false }) {
  const [reputation, setReputation] = useState(null)
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [showReviews, setShowReviews] = useState(false)

  useEffect(() => {
    if (userId) {
      loadReputation()
    }
  }, [userId])

  const loadReputation = async () => {
    try {
      const [rep, revs] = await Promise.all([
        getUserReputation(userId),
        getUserReviews(userId, 5)
      ])
      setReputation(rep)
      setReviews(revs)
    } catch (error) {
      console.error('Error loading reputation:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`animate-pulse bg-dark-card rounded-xl ${compact ? 'p-3' : 'p-6'}`}>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-dark-elevated" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-dark-elevated rounded w-24" />
            <div className="h-3 bg-dark-elevated rounded w-32" />
          </div>
        </div>
      </div>
    )
  }

  if (!reputation) return null

  // Compact version for bill cards
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <TrustScoreRing score={reputation.trust_score} size={40} />
        <div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-medium text-white">
              {reputation.trustLevel.icon} {reputation.trustLevel.name}
            </span>
          </div>
          <div className="text-xs text-gray-500">
            {reputation.completed_trades} trades • {reputation.positiveRate.toFixed(0)}% positive
          </div>
        </div>
      </div>
    )
  }

  // Full version
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-card border border-dark-border rounded-2xl p-6"
    >
      {/* Header */}
      <div className="flex items-start gap-6 mb-6">
        <TrustScoreRing score={reputation.trust_score} size={80} />

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">{reputation.trustLevel.icon}</span>
            <h3 className="text-xl font-bold text-white">
              {reputation.trustLevel.name}
            </h3>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <div className="flex items-center gap-1 text-gray-500 text-sm mb-1">
                <TrendingUp className="w-4 h-4" />
                Trades
              </div>
              <span className="text-lg font-bold text-white">
                {reputation.completed_trades}
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1 text-gray-500 text-sm mb-1">
                <ThumbsUp className="w-4 h-4" />
                Positive
              </div>
              <span className="text-lg font-bold text-green-400">
                {reputation.positiveRate.toFixed(0)}%
              </span>
            </div>
            <div>
              <div className="flex items-center gap-1 text-gray-500 text-sm mb-1">
                <Clock className="w-4 h-4" />
                Response
              </div>
              <span className="text-lg font-bold text-white">
                {reputation.avg_response_time
                  ? `${Math.round(reputation.avg_response_time / 60)}m`
                  : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      {reputation.badges && reputation.badges.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Award className="w-4 h-4 text-brand-purple" />
            <span className="text-sm font-medium text-gray-300">Verification Badges</span>
          </div>
          <BadgeDisplay badges={reputation.badges} />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-dark-elevated mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            ${(reputation.total_volume || 0).toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">Total Volume</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {reputation.positive_reviews || 0}
          </div>
          <div className="text-xs text-gray-500">Positive Reviews</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">
            {reputation.negative_reviews || 0}
          </div>
          <div className="text-xs text-gray-500">Negative Reviews</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-white">
            {reputation.dispute_count || 0}
          </div>
          <div className="text-xs text-gray-500">Disputes</div>
        </div>
      </div>

      {/* Reviews Section */}
      <div>
        <button
          onClick={() => setShowReviews(!showReviews)}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-full"
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm font-medium">
            Reviews ({reputation.totalReviews})
          </span>
          <ChevronDown className={`w-4 h-4 ml-auto transition-transform ${showReviews ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showReviews && reviews.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mt-4 space-y-3 overflow-hidden"
            >
              {reviews.map((review) => (
                <ReviewItem key={review.id} review={review} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// Mini trust badge for bill cards
export function TrustBadge({ userId, size = 'sm' }) {
  const [reputation, setReputation] = useState(null)

  useEffect(() => {
    if (userId) {
      getUserReputation(userId).then(setReputation)
    }
  }, [userId])

  if (!reputation) return null

  const sizes = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
  }

  const trustColor = reputation.trust_score >= 80 ? 'bg-green-500/20 border-green-500/30 text-green-400' :
                     reputation.trust_score >= 60 ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' :
                     reputation.trust_score >= 40 ? 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400' :
                     'bg-gray-500/20 border-gray-500/30 text-gray-400'

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border ${trustColor} ${sizes[size]}`}>
      <Shield className="w-3 h-3" />
      <span>{reputation.trust_score}</span>
      <span className="opacity-70">{reputation.trustLevel.icon}</span>
    </span>
  )
}

// Review submission modal
export function SubmitReviewModal({ isOpen, onClose, billId, reviewedUserId, onSubmit }) {
  const [rating, setRating] = useState(3) // 1=negative, 2=neutral, 3=positive
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (submitting) return
    setSubmitting(true)
    try {
      await onSubmit(rating, comment)
      onClose()
    } catch (error) {
      console.error('Error submitting review:', error)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-dark-card border border-dark-border rounded-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold text-white mb-4">Leave a Review</h3>

        {/* Rating Selection */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setRating(3)}
            className={`flex-1 p-4 rounded-xl border transition-colors ${
              rating === 3
                ? 'bg-green-500/20 border-green-500/50 text-green-400'
                : 'bg-dark-elevated border-dark-border text-gray-400 hover:border-green-500/30'
            }`}
          >
            <ThumbsUp className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm">Positive</span>
          </button>
          <button
            onClick={() => setRating(2)}
            className={`flex-1 p-4 rounded-xl border transition-colors ${
              rating === 2
                ? 'bg-gray-500/20 border-gray-500/50 text-gray-300'
                : 'bg-dark-elevated border-dark-border text-gray-400 hover:border-gray-500/30'
            }`}
          >
            <Minus className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm">Neutral</span>
          </button>
          <button
            onClick={() => setRating(1)}
            className={`flex-1 p-4 rounded-xl border transition-colors ${
              rating === 1
                ? 'bg-red-500/20 border-red-500/50 text-red-400'
                : 'bg-dark-elevated border-dark-border text-gray-400 hover:border-red-500/30'
            }`}
          >
            <ThumbsDown className="w-6 h-6 mx-auto mb-2" />
            <span className="text-sm">Negative</span>
          </button>
        </div>

        {/* Comment */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a comment (optional)"
          className="w-full p-4 rounded-xl bg-dark-elevated border border-dark-border text-white placeholder:text-gray-500 focus:border-brand-purple focus:outline-none resize-none"
          rows={3}
        />

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-dark-elevated text-gray-300 hover:bg-dark-border transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-brand-blue to-brand-purple text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}
