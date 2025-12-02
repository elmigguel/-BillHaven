/**
 * TrustBadge Component
 *
 * Displays user trust level with visual badge, progress bar, and benefits.
 * Part of the Progressive Trust System for BillHaven.
 *
 * Features:
 * - Visual badge with level icon
 * - Progress bar to next level
 * - Current benefits display
 * - Hover tooltip with details
 */

import React, { useState, useEffect } from 'react';
import {
  TrustLevel,
  TRUST_LEVEL_CONFIG,
  HOLD_PERIODS,
  formatHoldPeriod,
  getLevelProgress
} from '../../services/trustScoreService';

// Icons for each trust level
const LEVEL_ICONS = {
  [TrustLevel.NEW_USER]: '🌱',
  [TrustLevel.VERIFIED]: '✓',
  [TrustLevel.TRUSTED]: '⭐',
  [TrustLevel.POWER_USER]: '👑'
};

// Badge colors
const BADGE_COLORS = {
  [TrustLevel.NEW_USER]: {
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: '#667eea',
    text: '#fff'
  },
  [TrustLevel.VERIFIED]: {
    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
    border: '#11998e',
    text: '#fff'
  },
  [TrustLevel.TRUSTED]: {
    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    border: '#f093fb',
    text: '#fff'
  },
  [TrustLevel.POWER_USER]: {
    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    border: '#FFD700',
    text: '#000'
  }
};

// Styles
const styles = {
  container: {
    position: 'relative',
    display: 'inline-block'
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    border: '2px solid'
  },
  badgeIcon: {
    fontSize: '16px'
  },
  badgeText: {
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tooltip: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginTop: '8px',
    background: '#1a1a2e',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '16px',
    minWidth: '280px',
    zIndex: 1000,
    boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
  },
  tooltipHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '12px',
    paddingBottom: '12px',
    borderBottom: '1px solid #333'
  },
  tooltipIcon: {
    fontSize: '32px'
  },
  tooltipTitle: {
    color: '#fff',
    margin: 0,
    fontSize: '18px',
    fontWeight: '600'
  },
  tooltipScore: {
    color: '#888',
    margin: 0,
    fontSize: '13px'
  },
  progressSection: {
    marginBottom: '16px'
  },
  progressLabel: {
    display: 'flex',
    justifyContent: 'space-between',
    color: '#888',
    fontSize: '12px',
    marginBottom: '6px'
  },
  progressBar: {
    height: '8px',
    background: '#333',
    borderRadius: '4px',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 0.3s ease'
  },
  benefitsSection: {
    marginBottom: '0'
  },
  benefitsTitle: {
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    marginBottom: '8px'
  },
  benefitsList: {
    listStyle: 'none',
    padding: 0,
    margin: 0
  },
  benefitItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    color: '#aaa',
    fontSize: '12px',
    marginBottom: '6px'
  },
  benefitIcon: {
    color: '#4ade80',
    fontSize: '14px'
  },
  // Compact badge variant
  compactBadge: {
    padding: '3px 8px',
    fontSize: '11px',
    gap: '4px'
  },
  compactIcon: {
    fontSize: '12px'
  },
  // Large badge variant
  largeBadge: {
    padding: '10px 20px',
    fontSize: '16px',
    gap: '8px',
    borderRadius: '25px'
  },
  largeIcon: {
    fontSize: '24px'
  }
};

/**
 * Get benefits for a trust level
 */
function getBenefits(level) {
  const benefits = [];
  const config = TRUST_LEVEL_CONFIG[level];

  // Hold period benefits
  const idealHold = HOLD_PERIODS.IDEAL[level];
  const cryptoHold = HOLD_PERIODS.CRYPTO_NATIVE[level];
  const cardHold = HOLD_PERIODS.CREDIT_CARD[level];

  if (idealHold === 0) {
    benefits.push('Instant release for iDEAL payments');
  } else {
    benefits.push(`${formatHoldPeriod(idealHold)} hold for iDEAL`);
  }

  if (cryptoHold === 0) {
    benefits.push('Instant release for crypto');
  } else {
    benefits.push(`${formatHoldPeriod(cryptoHold)} hold for crypto`);
  }

  benefits.push(`${formatHoldPeriod(cardHold)} hold for credit cards`);

  // Level-specific perks
  if (level === TrustLevel.VERIFIED) {
    benefits.push('Access to higher limits');
    benefits.push('Priority support');
  } else if (level === TrustLevel.TRUSTED) {
    benefits.push('Reduced platform fees');
    benefits.push('Early access to features');
  } else if (level === TrustLevel.POWER_USER) {
    benefits.push('VIP support channel');
    benefits.push('Custom payment terms');
    benefits.push('Lowest platform fees');
  }

  return benefits;
}

/**
 * TrustBadge Component
 */
export default function TrustBadge({
  trustProfile,
  size = 'default',
  showTooltip = true,
  onClick
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [showTip, setShowTip] = useState(false);

  // Default to NEW_USER if no profile
  const level = trustProfile?.level || TrustLevel.NEW_USER;
  const score = trustProfile?.score || 0;
  const config = TRUST_LEVEL_CONFIG[level];
  const colors = BADGE_COLORS[level];
  const icon = LEVEL_ICONS[level];

  // Calculate progress to next level
  const progress = getLevelProgress(score);

  // Get benefits
  const benefits = getBenefits(level);

  // Handle hover
  useEffect(() => {
    if (isHovered && showTooltip) {
      const timer = setTimeout(() => setShowTip(true), 300);
      return () => clearTimeout(timer);
    } else {
      setShowTip(false);
    }
  }, [isHovered, showTooltip]);

  // Get size-specific styles
  const getSizeStyles = () => {
    if (size === 'compact') {
      return {
        badge: styles.compactBadge,
        icon: styles.compactIcon
      };
    }
    if (size === 'large') {
      return {
        badge: styles.largeBadge,
        icon: styles.largeIcon
      };
    }
    return { badge: {}, icon: {} };
  };

  const sizeStyles = getSizeStyles();

  return (
    <div
      style={styles.container}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badge */}
      <div
        style={{
          ...styles.badge,
          ...sizeStyles.badge,
          background: colors.background,
          borderColor: colors.border,
          color: colors.text,
          transform: isHovered ? 'scale(1.05)' : 'scale(1)'
        }}
        onClick={onClick}
        role="button"
        tabIndex={0}
        aria-label={`Trust level: ${config.name}`}
      >
        <span style={{ ...styles.badgeIcon, ...sizeStyles.icon }}>
          {icon}
        </span>
        <span style={styles.badgeText}>
          {config.name}
        </span>
      </div>

      {/* Tooltip */}
      {showTip && showTooltip && (
        <div style={styles.tooltip}>
          {/* Header */}
          <div style={styles.tooltipHeader}>
            <span style={styles.tooltipIcon}>{icon}</span>
            <div>
              <h4 style={styles.tooltipTitle}>{config.name}</h4>
              <p style={styles.tooltipScore}>
                Trust Score: {score} points
              </p>
            </div>
          </div>

          {/* Progress to next level */}
          {progress.nextLevel && (
            <div style={styles.progressSection}>
              <div style={styles.progressLabel}>
                <span>Progress to {TRUST_LEVEL_CONFIG[progress.nextLevel].name}</span>
                <span>{Math.round(progress.progress)}%</span>
              </div>
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${progress.progress}%`,
                    background: BADGE_COLORS[progress.nextLevel].background
                  }}
                />
              </div>
              <div style={{ ...styles.progressLabel, marginTop: '4px' }}>
                <span>{progress.pointsToNext} points needed</span>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div style={styles.benefitsSection}>
            <div style={styles.benefitsTitle}>Your Benefits:</div>
            <ul style={styles.benefitsList}>
              {benefits.map((benefit, index) => (
                <li key={index} style={styles.benefitItem}>
                  <span style={styles.benefitIcon}>✓</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * TrustProgress Component
 * Shows detailed progress with actions to increase trust
 */
export function TrustProgress({ trustProfile, onAction }) {
  const level = trustProfile?.level || TrustLevel.NEW_USER;
  const score = trustProfile?.score || 0;
  const config = TRUST_LEVEL_CONFIG[level];
  const progress = getLevelProgress(score);

  const actions = [
    {
      id: 'complete_kyc',
      title: 'Complete KYC Verification',
      points: 50,
      icon: '🆔',
      completed: trustProfile?.kycVerified
    },
    {
      id: 'add_2fa',
      title: 'Enable Two-Factor Auth',
      points: 25,
      icon: '🔐',
      completed: trustProfile?.twoFactorEnabled
    },
    {
      id: 'verify_email',
      title: 'Verify Email Address',
      points: 10,
      icon: '📧',
      completed: trustProfile?.emailVerified
    },
    {
      id: 'first_trade',
      title: 'Complete First Trade',
      points: 10,
      icon: '💱',
      completed: (trustProfile?.completedTrades || 0) > 0
    }
  ];

  const progressStyles = {
    container: {
      background: '#1a1a2e',
      borderRadius: '16px',
      padding: '24px',
      border: '1px solid #333'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '24px'
    },
    title: {
      color: '#fff',
      fontSize: '20px',
      fontWeight: '600',
      margin: 0
    },
    progressContainer: {
      marginBottom: '24px'
    },
    progressInfo: {
      display: 'flex',
      justifyContent: 'space-between',
      marginBottom: '8px',
      color: '#888',
      fontSize: '14px'
    },
    progressBar: {
      height: '12px',
      background: '#333',
      borderRadius: '6px',
      overflow: 'hidden'
    },
    progressFill: {
      height: '100%',
      background: BADGE_COLORS[level].background,
      borderRadius: '6px',
      transition: 'width 0.5s ease'
    },
    actionsTitle: {
      color: '#fff',
      fontSize: '16px',
      fontWeight: '600',
      marginBottom: '16px'
    },
    actionsList: {
      display: 'flex',
      flexDirection: 'column',
      gap: '12px'
    },
    actionItem: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '12px 16px',
      background: '#252540',
      borderRadius: '10px',
      cursor: 'pointer',
      transition: 'all 0.2s ease'
    },
    actionItemCompleted: {
      opacity: 0.6,
      cursor: 'default'
    },
    actionLeft: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px'
    },
    actionIcon: {
      fontSize: '24px'
    },
    actionTitle: {
      color: '#fff',
      fontSize: '14px',
      fontWeight: '500'
    },
    actionPoints: {
      color: '#4ade80',
      fontSize: '13px',
      fontWeight: '600'
    },
    actionStatus: {
      fontSize: '18px'
    }
  };

  return (
    <div style={progressStyles.container}>
      {/* Header */}
      <div style={progressStyles.header}>
        <h3 style={progressStyles.title}>Trust Level Progress</h3>
        <TrustBadge trustProfile={trustProfile} showTooltip={false} />
      </div>

      {/* Progress Bar */}
      <div style={progressStyles.progressContainer}>
        <div style={progressStyles.progressInfo}>
          <span>Score: {score} points</span>
          {progress.nextLevel && (
            <span>
              {progress.pointsToNext} points to {TRUST_LEVEL_CONFIG[progress.nextLevel].name}
            </span>
          )}
          {!progress.nextLevel && (
            <span>Maximum level reached!</span>
          )}
        </div>
        <div style={progressStyles.progressBar}>
          <div
            style={{
              ...progressStyles.progressFill,
              width: progress.nextLevel ? `${progress.progress}%` : '100%'
            }}
          />
        </div>
      </div>

      {/* Actions to increase trust */}
      <div style={progressStyles.actionsTitle}>
        Earn More Trust Points:
      </div>
      <div style={progressStyles.actionsList}>
        {actions.map((action) => (
          <div
            key={action.id}
            style={{
              ...progressStyles.actionItem,
              ...(action.completed ? progressStyles.actionItemCompleted : {})
            }}
            onClick={() => !action.completed && onAction?.(action.id)}
          >
            <div style={progressStyles.actionLeft}>
              <span style={progressStyles.actionIcon}>{action.icon}</span>
              <div>
                <div style={progressStyles.actionTitle}>{action.title}</div>
                <div style={progressStyles.actionPoints}>+{action.points} points</div>
              </div>
            </div>
            <span style={progressStyles.actionStatus}>
              {action.completed ? '✅' : '→'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * HoldPeriodDisplay Component
 * Shows expected hold period for a specific payment method
 */
export function HoldPeriodDisplay({ trustProfile, paymentMethod }) {
  const level = trustProfile?.level || TrustLevel.NEW_USER;

  // Get hold period for this payment method and trust level
  const holdSeconds = HOLD_PERIODS[paymentMethod]?.[level] ?? HOLD_PERIODS.CRYPTO_NATIVE[level];
  const holdText = formatHoldPeriod(holdSeconds);

  const displayStyles = {
    container: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 16px',
      background: holdSeconds === 0 ? 'rgba(74, 222, 128, 0.1)' : 'rgba(251, 191, 36, 0.1)',
      border: `1px solid ${holdSeconds === 0 ? 'rgba(74, 222, 128, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
      borderRadius: '8px'
    },
    icon: {
      fontSize: '16px'
    },
    text: {
      color: holdSeconds === 0 ? '#4ade80' : '#fbbf24',
      fontSize: '14px',
      fontWeight: '500'
    }
  };

  return (
    <div style={displayStyles.container}>
      <span style={displayStyles.icon}>
        {holdSeconds === 0 ? '⚡' : '⏱️'}
      </span>
      <span style={displayStyles.text}>
        {holdSeconds === 0 ? 'Instant Release' : `${holdText} hold period`}
      </span>
    </div>
  );
}
