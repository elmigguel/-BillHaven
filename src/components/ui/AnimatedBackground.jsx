/**
 * AnimatedBackground - Premium animated dark background with depth
 * Creates that "looking deep into it" effect like Uniswap/Phantom
 */

import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedBackground({
  variant = 'default', // 'default' | 'subtle' | 'intense'
  children,
  className = '',
}) {
  const variants = {
    subtle: {
      blob1: { scale: [1, 1.1, 1], opacity: [0.1, 0.15, 0.1] },
      blob2: { scale: [1.1, 1, 1.1], opacity: [0.08, 0.12, 0.08] },
      blob3: { scale: [1, 1.15, 1], opacity: [0.05, 0.1, 0.05] },
    },
    default: {
      blob1: { scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] },
      blob2: { scale: [1.2, 1, 1.2], opacity: [0.1, 0.18, 0.1] },
      blob3: { scale: [1, 1.25, 1], opacity: [0.08, 0.15, 0.08] },
    },
    intense: {
      blob1: { scale: [1, 1.3, 1], opacity: [0.2, 0.35, 0.2] },
      blob2: { scale: [1.3, 1, 1.3], opacity: [0.15, 0.25, 0.15] },
      blob3: { scale: [1, 1.4, 1], opacity: [0.1, 0.2, 0.1] },
    },
  };

  const config = variants[variant];

  return (
    <div className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* Base gradient */}
      <div className="absolute inset-0 bg-dark-primary" />

      {/* Noise texture overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Grid pattern for structure */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Primary gradient blob - top left */}
      <motion.div
        className="absolute -top-1/2 -left-1/2 w-full h-full"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(0,82,255,0.3) 0%, transparent 70%)',
        }}
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
          ...config.blob1,
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Secondary gradient blob - center right */}
      <motion.div
        className="absolute -bottom-1/4 -right-1/4 w-3/4 h-3/4"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(127,132,246,0.25) 0%, transparent 70%)',
        }}
        animate={{
          x: [0, -80, 0],
          y: [0, -60, 0],
          ...config.blob2,
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Accent blob - bottom left */}
      <motion.div
        className="absolute bottom-0 left-1/4 w-1/2 h-1/2"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(16,185,129,0.2) 0%, transparent 70%)',
        }}
        animate={{
          x: [0, 60, 0],
          y: [0, -40, 0],
          ...config.blob3,
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Pink/magenta accent - top right */}
      <motion.div
        className="absolute top-1/4 right-1/4 w-96 h-96"
        style={{
          background: 'radial-gradient(circle at center, rgba(255,0,122,0.1) 0%, transparent 60%)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.08, 0.15, 0.08],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Cyan accent - center */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px]"
        style={{
          background: 'radial-gradient(circle at center, rgba(0,212,255,0.08) 0%, transparent 60%)',
        }}
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'linear',
        }}
      />

      {/* Vignette effect for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 30%, rgba(10,11,13,0.4) 100%)',
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
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 5 + Math.random() * 5,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
