import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Receipt,
  Wallet,
  Shield,
  Zap,
  ArrowRight,
  DollarSign,
  Users,
  Globe
} from 'lucide-react';

const MotionButton = motion(Button);

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-gray-900"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-500 to-emerald-400">
              Bill Haven
            </span>
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            Pay bills for others and receive cryptocurrency back.
            Earn money by paying bills!
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link to={createPageUrl('PublicBills')}>
              <MotionButton
                size="lg"
                className="bg-indigo-600 hover:bg-indigo-700 text-lg px-8 py-6 shadow-lg hover:shadow-indigo-500/50 transition-shadow duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <Globe className="w-5 h-5 mr-2" />
                View Available Bills
                <ArrowRight className="w-5 h-5 ml-2" />
              </MotionButton>
            </Link>
            <Link to={createPageUrl('Dashboard')}>
              <MotionButton
                size="lg"
                variant="outline"
                className="border-indigo-500 text-indigo-400 hover:bg-indigo-950 hover:border-indigo-400 text-lg px-8 py-6 shadow-lg transition-all duration-300"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15 }}
              >
                <Receipt className="w-5 h-5 mr-2" />
                Submit a Bill
              </MotionButton>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* How it Works */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.h2
          className="text-3xl font-bold text-center text-white mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.5 }}
        >
          How does it work?
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              icon: Receipt,
              bg: 'bg-indigo-600',
              title: '1. Submit a Bill',
              description: 'Upload your bill and specify how much crypto you want to receive',
              delay: 0
            },
            {
              icon: Users,
              bg: 'bg-emerald-600',
              title: '2. Someone Pays',
              description: 'Another user pays your bill and receives crypto in return',
              delay: 0.1
            },
            {
              icon: Wallet,
              bg: 'bg-pink-600',
              title: '3. Receive Crypto',
              description: 'The payer receives crypto in their wallet after verification',
              delay: 0.2
            }
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: item.delay, ease: [0.16, 1, 0.3, 1] }}
            >
              <Card className="bg-gray-800 border-gray-700 h-full hover:border-indigo-500/50 hover:shadow-lg hover:shadow-indigo-500/10 transition-all duration-300">
                <CardContent className="p-6 text-center">
                  <motion.div
                    className={`w-16 h-16 ${item.bg} rounded-full flex items-center justify-center mx-auto mb-4`}
                    initial={{ scale: 0, rotate: -180 }}
                    whileInView={{ scale: 1, rotate: 0 }}
                    viewport={{ once: true }}
                    transition={{
                      duration: 0.6,
                      delay: item.delay + 0.2,
                      type: 'spring',
                      stiffness: 200,
                      damping: 20
                    }}
                  >
                    <item.icon className="w-8 h-8 text-white" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-gray-400">{item.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Features */}
      <div className="bg-gray-800/50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            className="text-3xl font-bold text-center text-white mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.5 }}
          >
            Why Bill Haven?
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, color: 'text-indigo-400', title: 'Safe & Reliable', desc: 'All transactions are verified', delay: 0 },
              { icon: Zap, color: 'text-emerald-400', title: 'Fast Payments', desc: 'Receive crypto instantly', delay: 0.1 },
              { icon: DollarSign, color: 'text-indigo-400', title: 'Low Fees', desc: 'Competitive platform costs', delay: 0.2 },
              { icon: Globe, color: 'text-cyan-400', title: 'Worldwide', desc: 'Pay bills anywhere in the world', delay: 0.3 }
            ].map((feature, index) => (
              <motion.div
                key={index}
                className="text-center p-6"
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.4,
                  delay: feature.delay,
                  type: 'spring',
                  stiffness: 200,
                  damping: 20
                }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  whileInView={{ scale: 1, rotate: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: feature.delay + 0.1,
                    type: 'spring',
                    stiffness: 200
                  }}
                >
                  <feature.icon className={`w-12 h-12 ${feature.color} mx-auto mb-4`} />
                </motion.div>
                <h3 className="font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-400">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <motion.h2
          className="text-3xl font-bold text-white mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Ready to get started?
        </motion.h2>
        <motion.p
          className="text-gray-400 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          Join thousands of users already benefiting from Bill Haven
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <Link to={createPageUrl('PublicBills')}>
            <MotionButton
              size="lg"
              className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-lg px-12 py-6 shadow-xl hover:shadow-indigo-500/50 transition-shadow duration-300"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              Start Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </MotionButton>
          </Link>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-500 text-sm">
          <p>© 2024 Bill Haven. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}