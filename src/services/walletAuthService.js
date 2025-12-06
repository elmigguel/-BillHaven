/**
 * Wallet Authentication Service - WALLET-ONLY LOGIN
 * No email, no password, no registration forms!
 *
 * Flow:
 * 1. User connects wallet
 * 2. Sign message "Login to BillHaven: [timestamp]"
 * 3. Verify signature and create/login user in Supabase
 * 4. User is authenticated based on wallet address
 */

import { supabase } from '@/lib/supabase'
import { ethers } from 'ethers'

// Generate a unique message for signing
export const generateLoginMessage = (walletAddress, timestamp = Date.now()) => {
  return `Welcome to BillHaven!

Sign this message to verify your wallet and log in.

Wallet: ${walletAddress}
Timestamp: ${timestamp}
Nonce: ${Math.random().toString(36).substring(7)}

This request will not trigger a blockchain transaction or cost any gas fees.`
}

/**
 * Sign message with connected wallet
 */
export async function signLoginMessage(signer, walletAddress) {
  if (!signer || !walletAddress) {
    throw new Error('Wallet not connected')
  }

  const timestamp = Date.now()
  const message = generateLoginMessage(walletAddress, timestamp)

  try {
    const signature = await signer.signMessage(message)
    return {
      message,
      signature,
      timestamp,
      walletAddress: walletAddress.toLowerCase()
    }
  } catch (error) {
    if (error.code === 4001 || error.code === 'ACTION_REJECTED') {
      throw new Error('Signature rejected by user')
    }
    throw new Error(`Failed to sign message: ${error.message}`)
  }
}

/**
 * Verify signature (client-side verification)
 * In production, this should be done server-side
 */
export function verifySignature(message, signature, expectedAddress) {
  try {
    const recoveredAddress = ethers.verifyMessage(message, signature)
    return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase()
  } catch (error) {
    console.error('Signature verification failed:', error)
    return false
  }
}

/**
 * Login or create user with wallet
 * Uses wallet address as unique identifier
 */
export async function walletLogin(walletAddress, signature, message) {
  const normalizedAddress = walletAddress.toLowerCase()

  // Verify signature first
  if (!verifySignature(message, signature, normalizedAddress)) {
    throw new Error('Invalid signature')
  }

  // Check if user exists with this wallet
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id, wallet_address')
    .eq('wallet_address', normalizedAddress)
    .single()

  if (existingProfile) {
    // User exists - login via Supabase
    // Use the wallet address as email identifier (deterministic)
    const walletEmail = `${normalizedAddress}@wallet.billhaven.app`
    // Use a deterministic password from signature (first 32 chars)
    const walletPassword = ethers.keccak256(ethers.toUtf8Bytes(signature)).slice(0, 34)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: walletEmail,
      password: walletPassword
    })

    if (error) {
      // If login fails, might need to update password
      console.log('Login failed, trying to update auth...')
      throw new Error('Please reconnect wallet and sign again')
    }

    return { data, isNewUser: false }
  }

  // New user - create account
  const walletEmail = `${normalizedAddress}@wallet.billhaven.app`
  const walletPassword = ethers.keccak256(ethers.toUtf8Bytes(signature)).slice(0, 34)

  const { data, error } = await supabase.auth.signUp({
    email: walletEmail,
    password: walletPassword,
    options: {
      data: {
        wallet_address: normalizedAddress,
        auth_type: 'wallet',
        full_name: `User ${normalizedAddress.slice(0, 8)}`,
      }
    }
  })

  if (error) {
    // User might already exist with this email, try login
    const loginResult = await supabase.auth.signInWithPassword({
      email: walletEmail,
      password: walletPassword
    })

    if (loginResult.error) {
      throw new Error(`Auth failed: ${loginResult.error.message}`)
    }

    return { data: loginResult.data, isNewUser: false }
  }

  // Update profile with wallet address
  if (data.user) {
    await supabase
      .from('profiles')
      .update({ wallet_address: normalizedAddress })
      .eq('id', data.user.id)
  }

  return { data, isNewUser: true }
}

/**
 * Link wallet to existing account
 */
export async function linkWalletToAccount(userId, walletAddress, signature, message) {
  const normalizedAddress = walletAddress.toLowerCase()

  // Verify signature
  if (!verifySignature(message, signature, normalizedAddress)) {
    throw new Error('Invalid signature')
  }

  // Check if wallet already linked to another account
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('wallet_address', normalizedAddress)
    .neq('id', userId)
    .single()

  if (existingProfile) {
    throw new Error('Wallet already linked to another account')
  }

  // Update profile with wallet
  const { data, error } = await supabase
    .from('profiles')
    .update({ wallet_address: normalizedAddress })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Check if wallet is registered
 */
export async function isWalletRegistered(walletAddress) {
  const normalizedAddress = walletAddress.toLowerCase()

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('wallet_address', normalizedAddress)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error checking wallet:', error)
    return false
  }

  return !!data
}

/**
 * Get user by wallet address
 */
export async function getUserByWallet(walletAddress) {
  const normalizedAddress = walletAddress.toLowerCase()

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('wallet_address', normalizedAddress)
    .single()

  if (error) return null
  return data
}

export default {
  generateLoginMessage,
  signLoginMessage,
  verifySignature,
  walletLogin,
  linkWalletToAccount,
  isWalletRegistered,
  getUserByWallet
}
