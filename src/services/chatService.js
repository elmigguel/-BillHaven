/**
 * In-App Chat Service for BillHaven
 *
 * Real-time messaging between buyers and sellers during trades.
 * Uses Supabase Realtime for instant message delivery.
 *
 * Features:
 * - Real-time messaging via Supabase Realtime
 * - Message history stored per trade
 * - Auto-moderation with profanity filter
 * - Dispute evidence collection
 * - Read receipts
 * - Typing indicators
 */

import { supabase } from '@/lib/supabase'

// Profanity filter (basic - can be expanded)
const BLOCKED_WORDS = [
  'scam', 'scammer', 'fuck', 'shit', 'bitch', 'asshole',
  // Add more as needed
]

// Message types
export const MESSAGE_TYPES = {
  TEXT: 'text',
  SYSTEM: 'system',
  IMAGE: 'image',
  PAYMENT_PROOF: 'payment_proof',
  DISPUTE: 'dispute',
}

/**
 * Create or get chat room for a trade
 */
export async function getOrCreateChatRoom(billId, makerId, payerId) {
  // Check if room exists
  const { data: existingRoom } = await supabase
    .from('chat_rooms')
    .select('*')
    .eq('bill_id', billId)
    .single()

  if (existingRoom) {
    return existingRoom
  }

  // Create new room
  const { data, error } = await supabase
    .from('chat_rooms')
    .insert({
      bill_id: billId,
      maker_id: makerId,
      payer_id: payerId,
      status: 'active',
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Send a message in a chat room
 */
export async function sendMessage(roomId, senderId, content, type = MESSAGE_TYPES.TEXT) {
  // Basic profanity filter
  let filteredContent = content
  if (type === MESSAGE_TYPES.TEXT) {
    filteredContent = filterProfanity(content)
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      room_id: roomId,
      sender_id: senderId,
      content: filteredContent,
      type,
      created_at: new Date().toISOString(),
      read: false,
    })
    .select(`
      *,
      sender:profiles!sender_id(id, full_name, wallet_address)
    `)
    .single()

  if (error) throw error
  return data
}

/**
 * Get messages for a chat room
 */
export async function getMessages(roomId, limit = 100, before = null) {
  let query = supabase
    .from('chat_messages')
    .select(`
      *,
      sender:profiles!sender_id(id, full_name, wallet_address)
    `)
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (before) {
    query = query.lt('created_at', before)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

/**
 * Subscribe to real-time messages
 */
export function subscribeToMessages(roomId, callback) {
  const channel = supabase
    .channel(`room:${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `room_id=eq.${roomId}`,
      },
      (payload) => {
        callback(payload.new)
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(roomId, userId) {
  const { error } = await supabase
    .from('chat_messages')
    .update({ read: true })
    .eq('room_id', roomId)
    .neq('sender_id', userId)
    .eq('read', false)

  if (error) throw error
}

/**
 * Get unread message count for user
 */
export async function getUnreadCount(userId) {
  const { data: rooms } = await supabase
    .from('chat_rooms')
    .select('id')
    .or(`maker_id.eq.${userId},payer_id.eq.${userId}`)
    .eq('status', 'active')

  if (!rooms || rooms.length === 0) return 0

  const roomIds = rooms.map(r => r.id)

  const { count, error } = await supabase
    .from('chat_messages')
    .select('*', { count: 'exact', head: true })
    .in('room_id', roomIds)
    .neq('sender_id', userId)
    .eq('read', false)

  if (error) return 0
  return count || 0
}

/**
 * Send system message (for trade updates)
 */
export async function sendSystemMessage(roomId, content) {
  return sendMessage(roomId, null, content, MESSAGE_TYPES.SYSTEM)
}

/**
 * Upload payment proof image
 */
export async function uploadPaymentProof(roomId, senderId, file) {
  const fileExt = file.name.split('.').pop()
  const fileName = `${roomId}/${Date.now()}.${fileExt}`

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('chat-attachments')
    .upload(fileName, file)

  if (uploadError) throw uploadError

  const { data: { publicUrl } } = supabase.storage
    .from('chat-attachments')
    .getPublicUrl(fileName)

  // Send message with image
  return sendMessage(roomId, senderId, publicUrl, MESSAGE_TYPES.PAYMENT_PROOF)
}

/**
 * Get all active chats for a user
 */
export async function getUserChats(userId) {
  const { data, error } = await supabase
    .from('chat_rooms')
    .select(`
      *,
      bill:bills(*),
      maker:profiles!maker_id(id, full_name, wallet_address),
      payer:profiles!payer_id(id, full_name, wallet_address),
      last_message:chat_messages(content, created_at, sender_id)
    `)
    .or(`maker_id.eq.${userId},payer_id.eq.${userId}`)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })

  if (error) throw error

  // Get unread counts for each room
  const chatsWithUnread = await Promise.all(
    (data || []).map(async (chat) => {
      const { count } = await supabase
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', chat.id)
        .neq('sender_id', userId)
        .eq('read', false)

      return {
        ...chat,
        unreadCount: count || 0,
      }
    })
  )

  return chatsWithUnread
}

/**
 * Close chat room (after trade completes)
 */
export async function closeChatRoom(roomId, reason = 'trade_completed') {
  await sendSystemMessage(roomId, `Chat closed: ${reason}`)

  const { error } = await supabase
    .from('chat_rooms')
    .update({
      status: 'closed',
      closed_at: new Date().toISOString(),
      close_reason: reason,
    })
    .eq('id', roomId)

  if (error) throw error
}

/**
 * Archive chat for dispute evidence
 */
export async function archiveChatForDispute(roomId, disputeId) {
  const messages = await getMessages(roomId, 1000)

  const { error } = await supabase
    .from('dispute_evidence')
    .insert({
      dispute_id: disputeId,
      room_id: roomId,
      messages: messages,
      archived_at: new Date().toISOString(),
    })

  if (error) throw error
  return messages
}

/**
 * Filter profanity from messages
 */
function filterProfanity(text) {
  let filtered = text
  BLOCKED_WORDS.forEach(word => {
    const regex = new RegExp(word, 'gi')
    filtered = filtered.replace(regex, '*'.repeat(word.length))
  })
  return filtered
}

/**
 * Quick reply templates
 */
export const QUICK_REPLIES = {
  GREETING: "Hi! I'm ready to trade. Let's proceed.",
  PAYMENT_SENT: "I've sent the payment. Please check and confirm.",
  PAYMENT_RECEIVED: "Payment received! Releasing crypto now.",
  NEED_MORE_TIME: "I need a bit more time. Please wait.",
  SEND_PROOF: "Please send payment proof (screenshot).",
  THANK_YOU: "Thank you for the trade! 🙏",
  ISSUE: "I'm having an issue. Can we discuss?",
}

/**
 * Report a message
 */
export async function reportMessage(messageId, reporterId, reason) {
  const { error } = await supabase
    .from('message_reports')
    .insert({
      message_id: messageId,
      reporter_id: reporterId,
      reason,
      created_at: new Date().toISOString(),
    })

  if (error) throw error
}

export default {
  MESSAGE_TYPES,
  QUICK_REPLIES,
  getOrCreateChatRoom,
  sendMessage,
  getMessages,
  subscribeToMessages,
  markMessagesAsRead,
  getUnreadCount,
  sendSystemMessage,
  uploadPaymentProof,
  getUserChats,
  closeChatRoom,
  archiveChatForDispute,
  reportMessage,
}
