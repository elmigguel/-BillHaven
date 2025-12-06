/**
 * Terms of Service - BillHaven Software Platform
 *
 * CRITICAL: This page establishes BillHaven as a SOFTWARE PROVIDER,
 * not a financial institution or exchange.
 */

import { motion } from 'framer-motion'
import {
  Shield,
  FileText,
  Users,
  AlertTriangle,
  Scale,
  Globe,
  Lock,
  Wallet,
  Server,
  ArrowLeft
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

const LAST_UPDATED = '2025-12-05'
const VERSION = '2.0'

const sections = [
  {
    id: 'platform-nature',
    title: '1. Nature of the Platform',
    icon: Server,
    content: [
      {
        heading: '1.1 Software Provider',
        text: `BillHaven is a SOFTWARE PLATFORM that provides peer-to-peer communication and coordination tools. BillHaven is NOT a cryptocurrency exchange, money transmitter, payment processor, or financial institution. We do not:

• Hold, custody, or control any user funds
• Execute trades or transfers on behalf of users
• Provide exchange or money transmission services
• Act as an intermediary in any financial transaction
• Provide financial, tax, legal, or investment advice`
      },
      {
        heading: '1.2 Peer-to-Peer Transactions',
        text: `All transactions on BillHaven occur directly between users on a peer-to-peer basis. The platform merely provides:

• A matching service to connect bill posters with crypto holders
• Communication tools for users to coordinate transactions
• Smart contract interfaces for users to interact with blockchain networks
• Documentation generation tools for record-keeping purposes

Users retain full control of their funds at all times through their own non-custodial wallets.`
      },
      {
        heading: '1.3 Smart Contract Interaction',
        text: `When users interact with smart contracts through our platform:

• The smart contract is deployed on a decentralized blockchain
• BillHaven does not control the smart contract execution
• Users interact directly with the blockchain using their own wallets
• All blockchain transactions are irreversible by design
• BillHaven cannot reverse, modify, or cancel blockchain transactions`
      }
    ]
  },
  {
    id: 'user-responsibilities',
    title: '2. User Responsibilities',
    icon: Users,
    content: [
      {
        heading: '2.1 Self-Custody',
        text: `Users are solely responsible for:

• Managing their own cryptocurrency wallets
• Securing their private keys and seed phrases
• Verifying all transaction details before signing
• Understanding the implications of blockchain transactions`
      },
      {
        heading: '2.2 Compliance',
        text: `Users must:

• Comply with all applicable laws in their jurisdiction
• Ensure they are legally permitted to use cryptocurrency
• Report any tax obligations arising from transactions
• Not use the platform for illegal activities
• Verify the legitimacy of counterparties before trading`
      },
      {
        heading: '2.3 Due Diligence',
        text: `Users acknowledge that:

• They must conduct their own due diligence on counterparties
• BillHaven does not verify the identity of users
• Reputation scores are informational only and not guarantees
• All trades carry inherent risk of loss
• Users trade at their own risk`
      }
    ]
  },
  {
    id: 'no-financial-services',
    title: '3. No Financial Services',
    icon: Wallet,
    content: [
      {
        heading: '3.1 Not Financial Advice',
        text: `Nothing on this platform constitutes:

• Financial advice
• Investment advice
• Tax advice
• Legal advice

All information provided is for educational and informational purposes only. Users should consult qualified professionals for specific advice.`
      },
      {
        heading: '3.2 Not a Custodian',
        text: `BillHaven NEVER takes custody of user funds:

• We do not hold cryptocurrency on behalf of users
• We do not operate wallets on behalf of users
• All funds remain in users' own non-custodial wallets
• Smart contract escrow is controlled by blockchain code, not BillHaven`
      },
      {
        heading: '3.3 Not an Exchange',
        text: `BillHaven is NOT a cryptocurrency exchange:

• We do not match orders in an order book
• We do not set or determine exchange rates
• We do not provide liquidity
• We do not profit from spreads between buy/sell prices
• Users set their own rates and terms`
      }
    ]
  },
  {
    id: 'fees',
    title: '4. Platform Fees',
    icon: FileText,
    content: [
      {
        heading: '4.1 Service Fees',
        text: `BillHaven charges fees for use of the software platform:

• Platform usage fee: Percentage of transaction value
• Withdrawal fee: Flat fee per withdrawal request
• Premium subscription fees: Monthly/yearly subscription
• Document generation fee: Per document created

These fees are for SOFTWARE SERVICES, not financial services.`
      },
      {
        heading: '4.2 Fee Purpose',
        text: `Fees collected are used for:

• Platform maintenance and development
• Server infrastructure and hosting
• Customer support operations
• Security and fraud prevention
• SAFU insurance fund contributions`
      }
    ]
  },
  {
    id: 'disputes',
    title: '5. Dispute Resolution',
    icon: Scale,
    content: [
      {
        heading: '5.1 Mediation Service',
        text: `BillHaven offers an OPTIONAL dispute mediation service:

• This is a communication facilitation service only
• BillHaven does not have authority to force outcomes
• Users may choose to accept or reject mediation suggestions
• For disputes involving funds in smart contract escrow, the outcome is determined by blockchain rules
• BillHaven's mediation is advisory, not binding`
      },
      {
        heading: '5.2 SAFU Fund',
        text: `The Secure Asset Fund for Users (SAFU):

• Is an INSURANCE FUND, not a guarantee
• Provides coverage up to specified limits
• Is subject to eligibility requirements
• Coverage decisions are made on a case-by-case basis
• Is funded by a portion of platform fees`
      }
    ]
  },
  {
    id: 'risks',
    title: '6. Risk Acknowledgment',
    icon: AlertTriangle,
    content: [
      {
        heading: '6.1 Cryptocurrency Risks',
        text: `Users acknowledge the following risks:

• Cryptocurrency prices are highly volatile
• Transactions on blockchain are irreversible
• Smart contracts may contain bugs or vulnerabilities
• Network congestion can delay transactions
• Regulatory changes may affect cryptocurrency use
• Complete loss of funds is possible`
      },
      {
        heading: '6.2 P2P Trading Risks',
        text: `Peer-to-peer trading carries additional risks:

• Counterparty may fail to complete their obligation
• Payment reversals (chargebacks) may occur
• Fraud and scam attempts exist
• Identity of counterparty cannot be verified
• Disputes may not be resolvable`
      },
      {
        heading: '6.3 Platform Risks',
        text: `Using BillHaven carries platform risks:

• Service may be interrupted without notice
• Features may be modified or removed
• Account access may be restricted
• Data may be lost due to technical issues
• Platform may cease operations`
      }
    ]
  },
  {
    id: 'jurisdiction',
    title: '7. Jurisdiction & Availability',
    icon: Globe,
    content: [
      {
        heading: '7.1 Geographic Restrictions',
        text: `BillHaven software may not be available in all jurisdictions:

• Users are responsible for compliance with local laws
• Some features may be restricted in certain regions
• Access from prohibited jurisdictions is not permitted
• VPN use to circumvent restrictions is prohibited`
      },
      {
        heading: '7.2 Governing Law',
        text: `These terms are governed by the laws of the jurisdiction where BillHaven B.V. is incorporated. Any disputes shall be resolved through arbitration.`
      }
    ]
  },
  {
    id: 'privacy',
    title: '8. Privacy & Data',
    icon: Lock,
    content: [
      {
        heading: '8.1 Minimal Data Collection',
        text: `BillHaven collects minimal user data:

• Wallet addresses (public blockchain data)
• Transaction history on the platform
• Communication records for dispute resolution
• Usage analytics for platform improvement`
      },
      {
        heading: '8.2 No KYC',
        text: `BillHaven does NOT require Know Your Customer (KYC) verification:

• No identity documents are collected
• No personal information is required
• Users authenticate via wallet signature only
• This is consistent with our role as a software provider`
      }
    ]
  },
  {
    id: 'liability',
    title: '9. Limitation of Liability',
    icon: Shield,
    content: [
      {
        heading: '9.1 No Warranty',
        text: `THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND:

• No warranty of merchantability
• No warranty of fitness for a particular purpose
• No warranty of non-infringement
• No warranty of accuracy or completeness`
      },
      {
        heading: '9.2 Limitation of Damages',
        text: `TO THE MAXIMUM EXTENT PERMITTED BY LAW:

• BillHaven is not liable for any direct, indirect, incidental, special, consequential, or punitive damages
• BillHaven is not liable for loss of profits, data, or cryptocurrency
• Total liability is limited to fees paid in the last 12 months
• Users waive all claims arising from use of the platform`
      }
    ]
  },
  {
    id: 'tax-responsibilities',
    title: '10. Tax Responsibilities & Documentation',
    icon: FileText,
    content: [
      {
        heading: '10.1 User Tax Obligations',
        text: `Users are solely responsible for their own tax obligations:

• Determining the tax treatment of transactions in their jurisdiction
• Reporting income, gains, and deductions to relevant tax authorities
• Maintaining records for tax compliance purposes
• Seeking professional tax advice for specific situations

BillHaven does NOT provide tax advice and makes no representations about the tax treatment of any transaction.`
      },
      {
        heading: '10.2 Invoice Factoring Documentation',
        text: `For invoice factoring transactions, BillHaven provides documentation tools:

• Invoice Purchase Agreements
• Ownership Transfer Certificates
• Payment Receipts
• Annual Transaction Summaries

These documents are provided for RECORD-KEEPING purposes only. The tax deductibility of invoice factoring fees or purchased invoices depends on:

• Your jurisdiction (USA, EU, UK, etc.)
• Your business structure
• The nature of the underlying transaction
• Your individual circumstances

Invoice factoring fees MAY be tax-deductible as ordinary business expenses in many jurisdictions. However, tax treatment varies. ALWAYS consult a qualified tax professional.`
      },
      {
        heading: '10.3 No Tax Guarantees',
        text: `BillHaven expressly disclaims any guarantees regarding tax benefits:

• We do NOT guarantee any tax deduction or benefit
• We do NOT calculate potential tax savings
• We do NOT provide tax planning advice
• We do NOT act as a tax advisor or accountant

Any statements about potential tax benefits are general information only and should not be relied upon as tax advice.`
      },
      {
        heading: '10.4 Professional Consultation Required',
        text: `Before claiming any tax deductions related to BillHaven transactions:

• Consult with a qualified tax professional (CPA, tax attorney, or accountant)
• Review the specific tax laws in your jurisdiction
• Maintain proper documentation and records
• Ensure compliance with all applicable tax regulations

Tax laws are complex and vary by jurisdiction. What is deductible in one country may not be deductible in another.`
      }
    ]
  }
]

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <Link to="/">
          <Button variant="ghost" className="mb-6 text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </Link>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="w-16 h-16 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <FileText className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Terms of Service</h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            BillHaven Software Platform - User Agreement
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm text-slate-500">
            <span>Version {VERSION}</span>
            <span>•</span>
            <span>Last Updated: {LAST_UPDATED}</span>
          </div>
        </motion.div>

        {/* Important Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-6 mb-8"
        >
          <div className="flex items-start gap-4">
            <AlertTriangle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-amber-400 font-semibold mb-2">Important Notice</h3>
              <p className="text-amber-200/80 text-sm leading-relaxed">
                By using BillHaven, you acknowledge that you have read, understood, and agree to these
                Terms of Service. BillHaven is a <strong>software platform</strong> that facilitates
                peer-to-peer transactions. We are <strong>NOT</strong> a cryptocurrency exchange, money
                transmitter, or financial institution. You are solely responsible for your transactions
                and compliance with applicable laws.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Software Provider Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-xl p-6 mb-8"
        >
          <div className="flex items-center gap-4">
            <Server className="h-8 w-8 text-emerald-400" />
            <div>
              <h3 className="text-emerald-400 font-bold text-lg">Software Provider Classification</h3>
              <p className="text-slate-300 text-sm mt-1">
                BillHaven operates as a software provider offering peer-to-peer communication and
                coordination tools. We do not hold custody of funds, execute transactions, or provide
                financial services. All transactions occur directly between users using their own
                non-custodial wallets.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Table of Contents */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 mb-8"
        >
          <h2 className="text-white font-semibold mb-4">Table of Contents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {sections.map((section, index) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                className="text-slate-400 hover:text-emerald-400 text-sm transition-colors flex items-center gap-2"
              >
                <section.icon className="h-4 w-4" />
                {section.title}
              </a>
            ))}
          </div>
        </motion.div>

        {/* Sections */}
        <div className="space-y-8">
          {sections.map((section, sectionIndex) => (
            <motion.div
              key={section.id}
              id={section.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * sectionIndex }}
              className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden"
            >
              <div className="bg-slate-800/50 p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-emerald-600/20 to-teal-600/20 rounded-lg flex items-center justify-center">
                  <section.icon className="h-5 w-5 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold text-white">{section.title}</h2>
              </div>

              <div className="p-6 space-y-6">
                {section.content.map((item, itemIndex) => (
                  <div key={itemIndex}>
                    <h3 className="text-emerald-400 font-semibold mb-3">{item.heading}</h3>
                    <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">
                      {item.text}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Acceptance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
            <Shield className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Acceptance of Terms</h2>
            <p className="text-slate-400 max-w-2xl mx-auto mb-6">
              By connecting your wallet and using the BillHaven platform, you confirm that you have
              read, understood, and agree to be bound by these Terms of Service. If you do not agree
              to these terms, please do not use the platform.
            </p>
            <Link to="/">
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                I Understand - Continue to Platform
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>BillHaven B.V. - Software Platform Provider</p>
          <p className="mt-1">
            Questions? Contact us at{' '}
            <a href="mailto:legal@billhaven.com" className="text-emerald-400 hover:underline">
              legal@billhaven.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
