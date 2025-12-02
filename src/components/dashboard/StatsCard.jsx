import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from "@/components/ui/card";

const MotionCard = motion(Card);

export default function StatsCard({ title, value, icon: Icon, color, subtitle, index = 0 }) {
  return (
    <MotionCard
      className="border border-gray-700 shadow-lg bg-gray-800"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1]
      }}
      whileHover={{
        y: -4,
        boxShadow: '0 20px 25px -5px rgba(99, 102, 241, 0.15), 0 10px 10px -5px rgba(99, 102, 241, 0.1)',
        transition: { duration: 0.15 }
      }}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <motion.p
              className="text-sm font-medium text-gray-400 mb-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: index * 0.1 + 0.1 }}
            >
              {title}
            </motion.p>
            <motion.p
              className="text-3xl font-bold text-gray-100"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: index * 0.1 + 0.15,
                duration: 0.3,
                type: 'spring',
                stiffness: 300,
                damping: 25
              }}
            >
              {value}
            </motion.p>
            {subtitle && (
              <motion.p
                className="text-xs text-gray-500 mt-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.2 }}
              >
                {subtitle}
              </motion.p>
            )}
          </div>
          <motion.div
            className={`p-3 rounded-xl ${color} bg-opacity-20`}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              delay: index * 0.1 + 0.2,
              duration: 0.4,
              type: 'spring',
              stiffness: 300,
              damping: 20
            }}
          >
            <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
          </motion.div>
        </div>
      </CardContent>
    </MotionCard>
  );
}