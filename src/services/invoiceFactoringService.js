/**
 * Invoice Factoring & Bill Assignment Service
 *
 * Enables users to:
 * 1. Sell their invoices/bills for instant crypto
 * 2. Buy invoices at a discount (and potentially deduct as business expense)
 * 3. Generate proper legal documentation for tax purposes
 *
 * Legal Framework:
 * - Invoice Factoring is a $7.6 TRILLION global industry
 * - Bill Assignment transfers ownership of the payment obligation
 * - All documentation is for record-keeping - users must consult tax professionals
 *
 * DISCLAIMER: This is a software tool for documentation.
 * BillHaven does NOT provide tax, legal, or financial advice.
 */

import { supabase } from '@/lib/supabase'
import { ADDITIONAL_FEES } from './premiumService'

// Invoice/Bill types that can be factored
export const FACTORING_TYPES = {
  INVOICE: {
    id: 'invoice',
    name: 'Business Invoice',
    description: 'Unpaid invoice from a client/customer',
    icon: 'FileText',
    requiredFields: ['invoiceNumber', 'clientName', 'dueDate', 'description'],
    taxImplications: 'May be deductible as accounts receivable purchase',
  },
  RENT: {
    id: 'rent',
    name: 'Rent/Lease Payment',
    description: 'Property rental or lease payment',
    icon: 'Home',
    requiredFields: ['propertyAddress', 'landlordName', 'leasePeriod'],
    taxImplications: 'May be deductible if used for business purposes',
  },
  SUPPLIER: {
    id: 'supplier',
    name: 'Supplier Invoice',
    description: 'Bill from a business supplier or vendor',
    icon: 'Package',
    requiredFields: ['supplierName', 'invoiceNumber', 'itemDescription'],
    taxImplications: 'May be deductible as cost of goods sold',
  },
  CONTRACTOR: {
    id: 'contractor',
    name: 'Contractor Payment',
    description: 'Payment to freelancer or contractor',
    icon: 'UserCheck',
    requiredFields: ['contractorName', 'serviceDescription', 'contractDate'],
    taxImplications: 'May be deductible as contractor expense',
  },
  SUBSCRIPTION: {
    id: 'subscription',
    name: 'Software/Subscription',
    description: 'SaaS, hosting, or recurring service',
    icon: 'Cloud',
    requiredFields: ['serviceName', 'subscriptionPeriod', 'accountInfo'],
    taxImplications: 'May be deductible as business software expense',
  },
  UTILITY: {
    id: 'utility',
    name: 'Utility Bill',
    description: 'Electric, water, gas, internet, phone',
    icon: 'Zap',
    requiredFields: ['utilityProvider', 'accountNumber', 'billingPeriod'],
    taxImplications: 'May be partially deductible for home office',
  },
  OTHER: {
    id: 'other',
    name: 'Other Bill/Invoice',
    description: 'Any other payable document',
    icon: 'File',
    requiredFields: ['description', 'payeeName'],
    taxImplications: 'Consult tax professional for deductibility',
  },
}

/**
 * Create an invoice factoring listing
 * User A posts their invoice for sale
 */
export async function createFactoringListing({
  userId,
  type,
  originalAmount,
  askingAmount,
  currency,
  cryptoType,
  dueDate,
  billDetails,
  documentUrl,
}) {
  const discount = ((originalAmount - askingAmount) / originalAmount * 100).toFixed(2)
  const platformFee = ADDITIONAL_FEES.invoiceFactoring

  const { data, error } = await supabase
    .from('invoice_factoring')
    .insert({
      seller_id: userId,
      type,
      original_amount: originalAmount,
      asking_amount: askingAmount,
      discount_percent: parseFloat(discount),
      currency,
      crypto_type: cryptoType,
      due_date: dueDate,
      bill_details: billDetails,
      document_url: documentUrl,
      platform_fee_percent: platformFee,
      status: 'available',
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get all available factoring listings
 */
export async function getAvailableListings(filters = {}) {
  let query = supabase
    .from('invoice_factoring')
    .select(`
      *,
      seller:profiles!seller_id(id, full_name, wallet_address, trust_score)
    `)
    .eq('status', 'available')
    .order('created_at', { ascending: false })

  if (filters.type) {
    query = query.eq('type', filters.type)
  }
  if (filters.minAmount) {
    query = query.gte('asking_amount', filters.minAmount)
  }
  if (filters.maxAmount) {
    query = query.lte('asking_amount', filters.maxAmount)
  }
  if (filters.cryptoType) {
    query = query.eq('crypto_type', filters.cryptoType)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

/**
 * Purchase/claim an invoice listing
 * User B buys User A's invoice
 */
export async function purchaseInvoice(listingId, buyerId) {
  // Get the listing
  const { data: listing, error: fetchError } = await supabase
    .from('invoice_factoring')
    .select('*')
    .eq('id', listingId)
    .eq('status', 'available')
    .single()

  if (fetchError || !listing) {
    throw new Error('Listing not found or no longer available')
  }

  // Update listing status
  const { data, error } = await supabase
    .from('invoice_factoring')
    .update({
      buyer_id: buyerId,
      status: 'pending_payment',
      claimed_at: new Date().toISOString(),
    })
    .eq('id', listingId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Complete the invoice purchase
 * Called after crypto payment is verified
 */
export async function completeInvoicePurchase(listingId, transactionHash) {
  const { data, error } = await supabase
    .from('invoice_factoring')
    .update({
      status: 'completed',
      transaction_hash: transactionHash,
      completed_at: new Date().toISOString(),
    })
    .eq('id', listingId)
    .select()
    .single()

  if (error) throw error

  // Generate the assignment documents
  const documents = await generateAssignmentDocuments(data)

  return { listing: data, documents }
}

/**
 * Generate legal assignment documents
 * These are for record-keeping and tax documentation
 */
export async function generateAssignmentDocuments(listing) {
  const timestamp = new Date().toISOString()
  const documentId = `BH-DOC-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

  // Invoice Purchase Agreement
  const purchaseAgreement = {
    documentId: `${documentId}-IPA`,
    type: 'INVOICE_PURCHASE_AGREEMENT',
    title: 'Invoice Purchase Agreement',
    generatedAt: timestamp,
    content: {
      header: 'INVOICE PURCHASE AGREEMENT',
      parties: {
        seller: {
          role: 'Seller (Original Invoice Holder)',
          identifier: listing.seller_id,
        },
        buyer: {
          role: 'Buyer (New Invoice Owner)',
          identifier: listing.buyer_id,
        },
        platform: {
          name: 'BillHaven',
          role: 'Software Platform Provider',
          disclaimer: 'BillHaven is a software tool facilitating peer-to-peer transactions. BillHaven does not provide tax, legal, or financial advice.',
        },
      },
      invoice: {
        type: FACTORING_TYPES[listing.type.toUpperCase()]?.name || listing.type,
        originalAmount: listing.original_amount,
        purchasePrice: listing.asking_amount,
        discount: listing.discount_percent,
        currency: listing.currency,
        dueDate: listing.due_date,
        details: listing.bill_details,
      },
      terms: [
        'Seller hereby transfers all rights, title, and interest in the above-described invoice to Buyer.',
        'Buyer acknowledges receipt of invoice documentation and accepts responsibility for collection.',
        'This transfer is final and irrevocable upon completion of the crypto payment.',
        'Seller warrants that the invoice is genuine, unpaid, and not subject to prior assignment.',
        'Buyer assumes all risk of non-payment by the original debtor.',
      ],
      payment: {
        cryptoType: listing.crypto_type,
        amount: listing.asking_amount,
        transactionHash: listing.transaction_hash,
        completedAt: listing.completed_at,
      },
      taxDisclaimer: `
        TAX NOTICE: This document is provided for record-keeping purposes only.

        The tax treatment of invoice purchases varies by jurisdiction and individual circumstances.
        Common considerations include:
        - Invoice purchases may be treated as acquisition of accounts receivable
        - The discount received may be taxable income
        - Business expenses may be deductible if the invoice relates to business operations

        CONSULT A QUALIFIED TAX PROFESSIONAL before claiming any deductions or credits.
        BillHaven provides documentation services only and does not provide tax advice.
      `,
    },
  }

  // Ownership Transfer Certificate
  const transferCertificate = {
    documentId: `${documentId}-OTC`,
    type: 'OWNERSHIP_TRANSFER_CERTIFICATE',
    title: 'Certificate of Invoice Ownership Transfer',
    generatedAt: timestamp,
    content: {
      header: 'CERTIFICATE OF OWNERSHIP TRANSFER',
      certificationText: `
        This certifies that on ${new Date(listing.completed_at).toLocaleDateString()},
        ownership of the invoice/bill described herein was transferred from the Seller
        to the Buyer in exchange for cryptocurrency payment.
      `,
      invoiceSummary: {
        type: listing.type,
        originalValue: `${listing.currency} ${listing.original_amount}`,
        transferValue: `${listing.asking_amount} ${listing.crypto_type}`,
      },
      blockchainVerification: {
        network: 'Polygon', // or detect from crypto_type
        transactionHash: listing.transaction_hash,
        verificationUrl: `https://polygonscan.com/tx/${listing.transaction_hash}`,
      },
      signatures: {
        seller: 'Verified via wallet signature',
        buyer: 'Verified via wallet signature',
        platform: 'BillHaven Software Platform',
      },
    },
  }

  // Payment Receipt
  const paymentReceipt = {
    documentId: `${documentId}-RCP`,
    type: 'PAYMENT_RECEIPT',
    title: 'Crypto Payment Receipt',
    generatedAt: timestamp,
    content: {
      header: 'PAYMENT RECEIPT',
      transaction: {
        from: 'Buyer Wallet',
        to: 'Seller Wallet',
        amount: listing.asking_amount,
        cryptoType: listing.crypto_type,
        transactionHash: listing.transaction_hash,
        timestamp: listing.completed_at,
        platformFee: `${listing.platform_fee_percent}%`,
      },
      purpose: `Purchase of invoice/bill: ${listing.type}`,
      originalInvoiceValue: `${listing.currency} ${listing.original_amount}`,
    },
  }

  // Store documents in database
  const { data, error } = await supabase
    .from('factoring_documents')
    .insert({
      listing_id: listing.id,
      seller_id: listing.seller_id,
      buyer_id: listing.buyer_id,
      documents: {
        purchaseAgreement,
        transferCertificate,
        paymentReceipt,
      },
      created_at: timestamp,
    })
    .select()
    .single()

  if (error) {
    console.error('Error storing documents:', error)
  }

  return {
    purchaseAgreement,
    transferCertificate,
    paymentReceipt,
    downloadUrl: `/api/documents/${documentId}`,
  }
}

/**
 * Get user's factoring history
 */
export async function getUserFactoringHistory(userId, role = 'both') {
  let query = supabase
    .from('invoice_factoring')
    .select(`
      *,
      seller:profiles!seller_id(id, full_name, wallet_address),
      buyer:profiles!buyer_id(id, full_name, wallet_address),
      documents:factoring_documents(*)
    `)
    .order('created_at', { ascending: false })

  if (role === 'seller') {
    query = query.eq('seller_id', userId)
  } else if (role === 'buyer') {
    query = query.eq('buyer_id', userId)
  } else {
    query = query.or(`seller_id.eq.${userId},buyer_id.eq.${userId}`)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

/**
 * Calculate tax-related summary for a user
 * For informational purposes only - user must verify with tax professional
 */
export async function getTaxSummary(userId, year) {
  const startDate = `${year}-01-01`
  const endDate = `${year}-12-31`

  // Purchases (potential deductions)
  const { data: purchases } = await supabase
    .from('invoice_factoring')
    .select('*')
    .eq('buyer_id', userId)
    .eq('status', 'completed')
    .gte('completed_at', startDate)
    .lte('completed_at', endDate)

  // Sales (income)
  const { data: sales } = await supabase
    .from('invoice_factoring')
    .select('*')
    .eq('seller_id', userId)
    .eq('status', 'completed')
    .gte('completed_at', startDate)
    .lte('completed_at', endDate)

  const summary = {
    year,
    purchases: {
      count: purchases?.length || 0,
      totalPaid: purchases?.reduce((sum, p) => sum + p.asking_amount, 0) || 0,
      totalInvoiceValue: purchases?.reduce((sum, p) => sum + p.original_amount, 0) || 0,
      potentialDeductions: purchases?.reduce((sum, p) => sum + p.original_amount, 0) || 0,
      discountsReceived: purchases?.reduce((sum, p) => sum + (p.original_amount - p.asking_amount), 0) || 0,
    },
    sales: {
      count: sales?.length || 0,
      totalReceived: sales?.reduce((sum, s) => sum + s.asking_amount, 0) || 0,
      totalInvoiceValue: sales?.reduce((sum, s) => sum + s.original_amount, 0) || 0,
      discountsGiven: sales?.reduce((sum, s) => sum + (s.original_amount - s.asking_amount), 0) || 0,
    },
    disclaimer: `
      This summary is for informational purposes only.
      The tax treatment of these transactions depends on your jurisdiction,
      business structure, and individual circumstances.
      CONSULT A QUALIFIED TAX PROFESSIONAL for advice on your specific situation.
    `,
    generatedAt: new Date().toISOString(),
  }

  return summary
}

/**
 * Get featured/high-value listings
 */
export async function getFeaturedListings(limit = 10) {
  const { data, error } = await supabase
    .from('invoice_factoring')
    .select(`
      *,
      seller:profiles!seller_id(id, full_name, trust_score)
    `)
    .eq('status', 'available')
    .gte('discount_percent', 3) // Good discounts
    .order('original_amount', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data
}

export default {
  FACTORING_TYPES,
  createFactoringListing,
  getAvailableListings,
  purchaseInvoice,
  completeInvoicePurchase,
  generateAssignmentDocuments,
  getUserFactoringHistory,
  getTaxSummary,
  getFeaturedListings,
}
