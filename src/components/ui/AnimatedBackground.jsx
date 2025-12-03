/**
 * AnimatedBackground - Premium deep space background with stars
 * Creates immersive depth effect like Linear.app, Vercel, Stripe
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

// Generate random stars with consistent positions (seeded by index)
const generateStars = (count, seed = 0) => {
  const stars = [];
  for (let i = 0; i < count; i++) {
    const seedVal = (i + seed) * 9999;
    stars.push({
      id: i,
      x: ((seedVal * 7) % 100),
      y: ((seedVal * 13) % 100),
      size: 0.5 + ((seedVal * 17) % 100) / 100 * 2,
      opacity: 0.3 + ((seedVal * 23) % 100) / 100 * 0.7,
      delay: ((seedVal * 31) % 100) / 100 * 5,
      duration: 2 + ((seedVal * 37) % 100) / 100 * 4,
    });
  }
  return stars;
};

// Star layer component with parallax
const StarLayer = ({ stars, speed = 1, baseOpacity = 0.5, blur = 0 }) => (
  <div
    className="absolute inset-0 overflow-hidden"
    style={{ filter: blur > 0 ? `blur(${blur}px)` : 'none' }}
  >
    {stars.map((star) => (
      <motion.div
        key={star.id}
        className="absolute rounded-full bg-white"
        style={{
          left: `${star.x}%`,
          top: `${star.y}%`,
          width: star.size,
          height: star.size,
        }}
        animate={{
          opacity: [star.opacity * baseOpacity, star.opacity * baseOpacity * 0.3, star.opacity * baseOpacity],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: star.duration / speed,
          repeat: Infinity,
          delay: star.delay,
          ease: 'easeInOut',
        }}
      />
    ))}
  </div>
);

// Shooting star component - positions passed as props to avoid re-render issues
const ShootingStar = ({ delay = 0, startX = 50, startY = 15, repeatDelay = 10 }) => (
  <motion.div
    className="absolute w-[100px] h-[1px] bg-gradient-to-r from-transparent via-white to-transparent"
    style={{
      left: `${startX}%`,
      top: `${startY}%`,
      rotate: 45,
    }}
    initial={{ opacity: 0, x: -100, y: -100 }}
    animate={{
      opacity: [0, 1, 0],
      x: [0, 200],
      y: [0, 200],
    }}
    transition={{
      duration: 1.5,
      delay: delay,
      repeat: Infinity,
      repeatDelay: repeatDelay,
      ease: 'easeOut',
    }}
  />
);

export default function AnimatedBackground({
  variant = 'default', // 'default' | 'subtle' | 'intense'
  children,
  className = '',
}) {
  // Generate star layers with memoization
  const farStars = useMemo(() => generateStars(80, 1), []);
  const midStars = useMemo(() => generateStars(50, 2), []);
  const nearStars = useMemo(() => generateStars(30, 3), []);
  const brightStars = useMemo(() => generateStars(15, 4), []);

  const variants = {
    subtle: {
      starsOpacity: 0.4,
      blobOpacity: 0.08,
      nebulaOpacity: 0.05,
    },
    default: {
      starsOpacity: 0.6,
      blobOpacity: 0.12,
      nebulaOpacity: 0.08,
    },
    intense: {
      starsOpacity: 0.8,
      blobOpacity: 0.18,
      nebulaOpacity: 0.12,
    },
  };

  const config = variants[variant];

  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* Deep space gradient base */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 50% 0%, rgba(17, 24, 39, 1) 0%, rgba(10, 11, 13, 1) 50%),
            linear-gradient(180deg, rgba(10, 11, 13, 1) 0%, rgba(5, 5, 8, 1) 100%)
          `,
        }}
      />

      {/* Distant nebula glow - purple/blue */}
      <motion.div
        className="absolute -top-1/3 -left-1/4 w-[120%] h-[80%]"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(88, 28, 135, 0.15) 0%, transparent 60%)',
          filter: 'blur(60px)',
        }}
        animate={{
          opacity: [config.nebulaOpacity, config.nebulaOpacity * 1.5, config.nebulaOpacity],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Distant nebula glow - blue/cyan */}
      <motion.div
        className="absolute top-1/3 -right-1/4 w-[80%] h-[60%]"
        style={{
          background: 'radial-gradient(ellipse at 70% 50%, rgba(6, 78, 140, 0.12) 0%, transparent 55%)',
          filter: 'blur(80px)',
        }}
        animate={{
          opacity: [config.nebulaOpacity * 0.8, config.nebulaOpacity * 1.2, config.nebulaOpacity * 0.8],
          x: [0, 30, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Emerald accent nebula */}
      <motion.div
        className="absolute bottom-0 left-1/4 w-[60%] h-[40%]"
        style={{
          background: 'radial-gradient(ellipse at 40% 80%, rgba(16, 185, 129, 0.08) 0%, transparent 50%)',
          filter: 'blur(100px)',
        }}
        animate={{
          opacity: [config.nebulaOpacity * 0.5, config.nebulaOpacity, config.nebulaOpacity * 0.5],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Star field layers with parallax depth */}
      <div className="absolute inset-0" style={{ opacity: config.starsOpacity }}>
        {/* Far stars - smallest, slowest, slightly blurred for depth */}
        <StarLayer stars={farStars} speed={0.5} baseOpacity={0.4} blur={0.5} />

        {/* Mid-distance stars */}
        <StarLayer stars={midStars} speed={0.8} baseOpacity={0.6} blur={0} />

        {/* Near stars - largest, fastest */}
        <StarLayer stars={nearStars} speed={1.2} baseOpacity={0.8} blur={0} />

        {/* Bright prominent stars */}
        <StarLayer stars={brightStars} speed={0.6} baseOpacity={1} blur={0} />
      </div>

      {/* Shooting stars - fixed positions to prevent re-render jitter */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <ShootingStar delay={2} startX={35} startY={10} repeatDelay={12} />
        <ShootingStar delay={8} startX={65} startY={20} repeatDelay={18} />
        <ShootingStar delay={15} startX={45} startY={5} repeatDelay={15} />
      </div>

      {/* Subtle noise texture for film grain effect */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Central glow - focus point */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.03) 0%, transparent 50%)',
        }}
      />

      {/* Vignette for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Simpler animated mesh for cards/sections
export function AnimatedMesh({ className = '' }) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      <motion.div
        className="absolute -inset-1/2"
        style={{
          background: `
            radial-gradient(at 40% 20%, rgba(0,82,255,0.15) 0px, transparent 50%),
            radial-gradient(at 80% 0%, rgba(0,212,255,0.1) 0px, transparent 50%),
            radial-gradient(at 0% 50%, rgba(127,132,246,0.1) 0px, transparent 50%),
            radial-gradient(at 80% 50%, rgba(255,0,122,0.08) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(16,185,129,0.1) 0px, transparent 50%)
          `,
        }}
        animate={{
          rotate: [0, 360],
        }}
        transition={{
          duration: 60,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}

// Floating particles effect
export function FloatingParticles({ count = 20 }) {
  const particles = useMemo(() => {
    return [...Array(count)].map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      duration: 5 + Math.random() * 5,
      delay: Math.random() * 5,
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute w-1 h-1 bg-white/20 rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Glowing orb for special sections
export function GlowingOrb({ color = 'blue', size = 400, className = '' }) {
  const colors = {
    blue: 'rgba(59, 130, 246, 0.15)',
    purple: 'rgba(139, 92, 246, 0.15)',
    emerald: 'rgba(16, 185, 129, 0.12)',
    cyan: 'rgba(6, 182, 212, 0.12)',
  };

  return (
    <motion.div
      className={`absolute rounded-full pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle at center, ${colors[color]} 0%, transparent 70%)`,
        filter: 'blur(40px)',
      }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.8, 1, 0.8],
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}
