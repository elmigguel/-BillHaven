/**
 * Mollie Payment Webhook Handler
 *
 * This Supabase Edge Function receives payment notifications from Mollie
 * and verifies payments for auto-release.
 *
 * Flow:
 * 1. Mollie sends webhook when payment status changes
 * 2. This function verifies the payment with Mollie API
 * 3. If payment is successful, sign verification message
 * 4. Submit signed message to smart contract (or return to frontend)
 *
 * Deploy:
 *   supabase functions deploy mollie-webhook
 *
 * Environment Variables Required:
 *   MOLLIE_API_KEY - Your Mollie API key
 *   ORACLE_PRIVATE_KEY - Private key for signing verification messages
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_ANON_KEY - Your Supabase anon key
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { ethers } from 'https://esm.sh/ethers@6.9.0';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Payment status mapping
const MOLLIE_STATUS = {
  paid: 'paid',
  pending: 'pending',
  open: 'open',
  canceled: 'canceled',
  expired: 'expired',
  failed: 'failed',
};

interface MolliePayment {
  id: string;
  status: string;
  amount: {
    value: string;
    currency: string;
  };
  description: string;
  metadata: {
    billId?: string;
    payerAddress?: string;
    makerAddress?: string;
    paymentReference?: string;
  };
  paidAt?: string;
  method?: string;
}

interface VerificationResult {
  billId: number;
  payerAddress: string;
  makerAddress: string;
  fiatAmount: number;
  paymentReference: string;
  timestamp: number;
  signature: string;
  verified: boolean;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const MOLLIE_API_KEY = Deno.env.get('MOLLIE_API_KEY');
    const ORACLE_PRIVATE_KEY = Deno.env.get('ORACLE_PRIVATE_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

    if (!MOLLIE_API_KEY || !ORACLE_PRIVATE_KEY) {
      throw new Error('Missing required environment variables');
    }

    // Parse webhook payload
    const formData = await req.formData();
    const paymentId = formData.get('id') as string;

    if (!paymentId) {
      return new Response(
        JSON.stringify({ error: 'Missing payment ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing Mollie webhook for payment: ${paymentId}`);

    // Fetch payment details from Mollie
    const mollieResponse = await fetch(`https://api.mollie.com/v2/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${MOLLIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!mollieResponse.ok) {
      throw new Error(`Mollie API error: ${mollieResponse.status}`);
    }

    const payment: MolliePayment = await mollieResponse.json();
    console.log(`Payment status: ${payment.status}`);

    // Only process paid payments
    if (payment.status !== MOLLIE_STATUS.paid) {
      console.log(`Payment not paid, status: ${payment.status}`);
      return new Response(
        JSON.stringify({
          received: true,
          status: payment.status,
          message: 'Payment not yet paid'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract metadata
    const metadata = payment.metadata;
    if (!metadata?.billId || !metadata?.payerAddress || !metadata?.makerAddress) {
      console.error('Missing metadata in payment:', metadata);
      return new Response(
        JSON.stringify({ error: 'Missing metadata in payment' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const billId = parseInt(metadata.billId);
    const payerAddress = metadata.payerAddress;
    const makerAddress = metadata.makerAddress;
    const paymentReference = metadata.paymentReference || '';
    const fiatAmount = Math.round(parseFloat(payment.amount.value) * 100); // Convert to cents
    const timestamp = Math.floor(Date.now() / 1000);

    console.log(`Verified payment: Bill #${billId}, Amount: ${fiatAmount} cents`);

    // Create oracle wallet for signing
    const oracleWallet = new ethers.Wallet(ORACLE_PRIVATE_KEY);

    // Create message hash (must match contract's hash)
    const paymentRefHash = ethers.keccak256(ethers.toUtf8Bytes(paymentReference));
    const messageHash = ethers.solidityPackedKeccak256(
      ['uint256', 'address', 'address', 'uint256', 'bytes32', 'uint256'],
      [billId, payerAddress, makerAddress, fiatAmount, paymentRefHash, timestamp]
    );

    // Sign the message
    const signature = await oracleWallet.signMessage(ethers.getBytes(messageHash));

    console.log(`Signed verification for bill #${billId}`);

    // Store verification in Supabase for audit trail
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

      await supabase.from('payment_verifications').insert({
        bill_id: billId,
        mollie_payment_id: paymentId,
        payer_address: payerAddress,
        maker_address: makerAddress,
        fiat_amount: fiatAmount,
        payment_reference: paymentReference,
        payment_method: payment.method,
        timestamp: timestamp,
        signature: signature,
        verified_at: new Date().toISOString(),
        status: 'verified'
      });

      // Update bill status in bills table
      await supabase.from('bills').update({
        payment_verified: true,
        payment_verified_at: new Date().toISOString(),
        mollie_payment_id: paymentId,
        oracle_signature: signature
      }).eq('escrow_bill_id', billId);
    }

    // Return verification data
    const result: VerificationResult = {
      billId,
      payerAddress,
      makerAddress,
      fiatAmount,
      paymentReference: paymentRefHash,
      timestamp,
      signature,
      verified: true
    };

    console.log(`Verification complete for bill #${billId}`);

    return new Response(
      JSON.stringify({
        success: true,
        verification: result,
        message: 'Payment verified. Submit signature to smart contract to complete verification.'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
