import { supabase } from '../lib/supabase'

export const billsApi = {
  // Get all bills
  async list(filters = {}) {
    let query = supabase
      .from('bills')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId)
    }

    if (filters.claimedBy) {
      query = query.eq('claimed_by', filters.claimedBy)
    }

    const { data, error } = await query

    if (error) throw error
    return data
  },

  // Get single bill
  async get(id) {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  },

  // Create new bill
  // SECURITY: ALL bills require manual approval - no auto-approval
  // Future: Trust scoring system for smart auto-approval
  async create(billData) {
    const { data: { user } } = await supabase.auth.getUser()

    // Validate bill data structure (no auto-approval)
    this.validateBillStructure(billData)

    const { data, error } = await supabase
      .from('bills')
      .insert([{
        ...billData,
        user_id: user.id,
        status: 'pending_approval' // ALL bills require manual review
      }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Basic validation - structure only, no auto-approval logic
  validateBillStructure(billData) {
    const errors = []

    const amount = parseFloat(billData.amount) || 0
    if (amount <= 0) {
      errors.push('Amount must be greater than 0')
    }
    if (amount > 999999999) {
      errors.push('Amount exceeds maximum limit')
    }

    if (!billData.payout_wallet || billData.payout_wallet.length < 10) {
      errors.push('Valid wallet address required')
    }

    if (!billData.title || billData.title.length < 3) {
      errors.push('Title must be at least 3 characters')
    }

    if (!billData.category || billData.category.length === 0) {
      errors.push('Category is required')
    }

    if (errors.length > 0) {
      const error = new Error(`Bill validation failed: ${errors.join(', ')}`)
      error.details = errors
      throw error
    }

    return true
  },

  // Update bill
  async update(id, updates) {
    const { data, error } = await supabase
      .from('bills')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Approve bill (admin only)
  async approve(id) {
    return this.update(id, { status: 'approved' })
  },

  // Reject bill (admin only)
  async reject(id) {
    return this.update(id, { status: 'rejected' })
  },

  // Claim bill
  async claim(id) {
    const { data: { user } } = await supabase.auth.getUser()

    return this.update(id, {
      status: 'claimed',
      claimed_by: user.id
    })
  },

  // Mark as paid (old - deprecated)
  async markPaid(id, paymentData) {
    return this.update(id, {
      status: 'paid',
      payment_tx_hash: paymentData.billTxHash,
      fee_tx_hash: paymentData.feeTxHash,
      payment_network: paymentData.network,
      payment_token: paymentData.token
    })
  },

  // ============ NIEUWE FLOW FUNCTIES ============

  // Payer claimt bill en voert wallet adres in
  async claimWithWallet(id, payerWalletAddress) {
    const { data: { user } } = await supabase.auth.getUser()

    return this.update(id, {
      status: 'claimed',
      claimed_by: user.id,
      claimed_at: new Date().toISOString(),
      payer_wallet_address: payerWalletAddress
    })
  },

  // Payer uploadt bewijs van fiat betaling
  async submitPaymentProof(id, proofUrl) {
    return this.update(id, {
      status: 'fiat_paid',
      fiat_payment_proof_url: proofUrl
    })
  },

  // Bill maker verifieert en stuurt crypto
  async confirmCryptoSent(id, txHash) {
    return this.update(id, {
      status: 'completed',
      crypto_tx_to_payer: txHash
    })
  },

  // Haal bills op die wachten op verificatie (voor bill maker)
  async getBillsAwaitingVerification() {
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'fiat_paid')
      .order('claimed_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Get my bills
  async getMyBills() {
    const { data: { user } } = await supabase.auth.getUser()
    return this.list({ userId: user.id })
  },

  // Get public bills (approved, not claimed)
  async getPublicBills() {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('status', 'approved')
      .is('claimed_by', null)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  },

  // ============ DISPUTE FUNCTIES ============

  // Raise a dispute
  async raiseDispute(id, reason) {
    return this.update(id, {
      disputed: true,
      dispute_reason: reason,
      disputed_at: new Date().toISOString()
    })
  },

  // Get all disputed bills (admin only)
  async getDisputedBills() {
    const { data, error } = await supabase
      .from('bills')
      .select('*')
      .eq('disputed', true)
      .order('disputed_at', { ascending: false })

    if (error) throw error
    return data
  },

  // Resolve dispute (admin only)
  async resolveDispute(id, releaseToPayer) {
    const newStatus = releaseToPayer ? 'completed' : 'approved'
    return this.update(id, {
      disputed: false,
      status: newStatus,
      dispute_resolved_at: new Date().toISOString(),
      dispute_resolution: releaseToPayer ? 'released_to_payer' : 'refunded_to_maker'
    })
  },

  // ============ ESCROW FUNCTIES ============

  // Update bill with escrow info after on-chain creation
  async updateWithEscrow(id, escrowBillId, escrowTxHash) {
    return this.update(id, {
      escrow_bill_id: escrowBillId,
      escrow_tx_hash: escrowTxHash
    })
  }
}
