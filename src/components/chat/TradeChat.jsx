/**
 * TradeChat Component
 *
 * Real-time chat between buyer and seller during a trade.
 * Uses Supabase Realtime for instant messaging.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Image,
  X,
  MessageCircle,
  CheckCheck,
  Clock,
  AlertTriangle,
  Paperclip,
  Smile,
  ChevronDown,
  User,
  Shield
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  getMessages,
  sendMessage,
  subscribeToMessages,
  markMessagesAsRead,
  uploadPaymentProof,
  MESSAGE_TYPES,
  QUICK_REPLIES
} from '@/services/chatService'
import { useAuth } from '@/contexts/AuthContext'
import { formatDistanceToNow } from 'date-fns'

// Message bubble component
function MessageBubble({ message, isOwn, showAvatar }) {
  const isSystem = message.type === MESSAGE_TYPES.SYSTEM
  const isPaymentProof = message.type === MESSAGE_TYPES.PAYMENT_PROOF

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className="bg-slate-800/50 text-slate-400 text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
          <Shield className="h-3 w-3" />
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-end gap-2 mb-3 ${isOwn ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
          <User className="h-4 w-4 text-white" />
        </div>
      )}
      {!showAvatar && !isOwn && <div className="w-8" />}

      {/* Message content */}
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isOwn
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-br-md'
              : 'bg-slate-800 text-slate-100 rounded-bl-md'
          }`}
        >
          {isPaymentProof ? (
            <div className="space-y-2">
              <span className="text-xs font-medium opacity-80">Payment Proof</span>
              <img
                src={message.content}
                alt="Payment proof"
                className="rounded-lg max-w-full cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => window.open(message.content, '_blank')}
              />
            </div>
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
          )}
        </div>

        {/* Timestamp and status */}
        <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
          <span className="text-[10px] text-slate-500">
            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </span>
          {isOwn && (
            message.read ? (
              <CheckCheck className="h-3 w-3 text-emerald-500" />
            ) : (
              <Clock className="h-3 w-3 text-slate-500" />
            )
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Quick replies bar
function QuickRepliesBar({ onSelect, disabled }) {
  const [expanded, setExpanded] = useState(false)
  const quickReplies = Object.entries(QUICK_REPLIES)

  return (
    <div className="border-t border-slate-800 p-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300 transition-colors"
      >
        <Smile className="h-3.5 w-3.5" />
        Quick replies
        <ChevronDown className={`h-3 w-3 transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap gap-1.5 mt-2">
              {quickReplies.map(([key, text]) => (
                <button
                  key={key}
                  onClick={() => {
                    onSelect(text)
                    setExpanded(false)
                  }}
                  disabled={disabled}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-full transition-colors disabled:opacity-50"
                >
                  {text.length > 30 ? text.substring(0, 30) + '...' : text}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Main TradeChat component
export default function TradeChat({
  roomId,
  billId,
  counterparty,
  tradeStatus,
  onClose,
  minimized = false,
  onToggleMinimize
}) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const inputRef = useRef(null)

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  // Load messages
  useEffect(() => {
    if (!roomId) return

    const loadMessages = async () => {
      try {
        setLoading(true)
        const data = await getMessages(roomId)
        setMessages(data || [])

        // Mark as read
        if (user?.id) {
          await markMessagesAsRead(roomId, user.id)
        }
      } catch (err) {
        console.error('Error loading messages:', err)
        setError('Failed to load messages')
      } finally {
        setLoading(false)
      }
    }

    loadMessages()
  }, [roomId, user?.id])

  // Subscribe to new messages
  useEffect(() => {
    if (!roomId) return

    const unsubscribe = subscribeToMessages(roomId, async (newMsg) => {
      setMessages(prev => [...prev, newMsg])

      // Mark as read if from other user
      if (newMsg.sender_id !== user?.id) {
        await markMessagesAsRead(roomId, user?.id)
      }
    })

    return () => unsubscribe()
  }, [roomId, user?.id])

  // Auto-scroll on new messages
  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Send message
  const handleSend = async (e) => {
    e?.preventDefault()
    if (!newMessage.trim() || sending || !user?.id) return

    try {
      setSending(true)
      await sendMessage(roomId, user.id, newMessage.trim())
      setNewMessage('')
      inputRef.current?.focus()
    } catch (err) {
      console.error('Error sending message:', err)
      setError('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  // Handle quick reply
  const handleQuickReply = (text) => {
    setNewMessage(text)
    inputRef.current?.focus()
  }

  // Upload payment proof
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !user?.id) return

    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB')
      return
    }

    try {
      setUploading(true)
      await uploadPaymentProof(roomId, user.id, file)
    } catch (err) {
      console.error('Error uploading:', err)
      setError('Failed to upload image')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  // Minimized view
  if (minimized) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={onToggleMinimize}
        className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform z-50"
      >
        <MessageCircle className="h-6 w-6" />
        {messages.filter(m => !m.read && m.sender_id !== user?.id).length > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
            {messages.filter(m => !m.read && m.sender_id !== user?.id).length}
          </span>
        )}
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 right-4 w-96 h-[500px] bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 flex flex-col overflow-hidden z-50"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <User className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">
              {counterparty?.full_name || 'Trader'}
            </h3>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white/80 text-xs">Online</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-white/10 text-white border-white/20 text-xs">
            Bill #{billId?.slice(0, 8)}
          </Badge>
          <button
            onClick={onToggleMinimize}
            className="text-white/80 hover:text-white transition-colors"
          >
            <ChevronDown className="h-5 w-5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Trade status banner */}
      {tradeStatus && (
        <div className={`px-4 py-2 text-xs font-medium flex items-center justify-center gap-2 ${
          tradeStatus === 'awaiting_payment' ? 'bg-yellow-500/20 text-yellow-400' :
          tradeStatus === 'payment_sent' ? 'bg-blue-500/20 text-blue-400' :
          tradeStatus === 'completed' ? 'bg-green-500/20 text-green-400' :
          tradeStatus === 'disputed' ? 'bg-red-500/20 text-red-400' :
          'bg-slate-800 text-slate-400'
        }`}>
          {tradeStatus === 'awaiting_payment' && (
            <>
              <Clock className="h-3 w-3" />
              Waiting for payment
            </>
          )}
          {tradeStatus === 'payment_sent' && (
            <>
              <CheckCheck className="h-3 w-3" />
              Payment sent - awaiting confirmation
            </>
          )}
          {tradeStatus === 'completed' && (
            <>
              <CheckCheck className="h-3 w-3" />
              Trade completed
            </>
          )}
          {tradeStatus === 'disputed' && (
            <>
              <AlertTriangle className="h-3 w-3" />
              Trade under dispute
            </>
          )}
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500">
            <MessageCircle className="h-12 w-12 mb-3 opacity-50" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs mt-1">Send a message to start the conversation</p>
          </div>
        ) : (
          <>
            {messages.map((msg, index) => {
              const prevMsg = messages[index - 1]
              const showAvatar = !prevMsg || prevMsg.sender_id !== msg.sender_id
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isOwn={msg.sender_id === user?.id}
                  showAvatar={showAvatar}
                />
              )
            })}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mx-4 mb-2 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2"
          >
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-xs text-red-400">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400 hover:text-red-300"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick replies */}
      <QuickRepliesBar onSelect={handleQuickReply} disabled={sending} />

      {/* Input area */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800">
        <div className="flex items-center gap-2">
          {/* File upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 text-slate-400 hover:text-emerald-400 transition-colors disabled:opacity-50"
            title="Upload payment proof"
          >
            {uploading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-emerald-500 border-t-transparent" />
            ) : (
              <Paperclip className="h-5 w-5" />
            )}
          </button>

          {/* Message input */}
          <Input
            ref={inputRef}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-800 border-slate-700 text-slate-100 placeholder:text-slate-500"
            disabled={sending}
          />

          {/* Send button */}
          <Button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="bg-emerald-600 hover:bg-emerald-700 px-3"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}

// Floating chat button for use on bill pages
export function TradeChatButton({ roomId, billId, counterparty, tradeStatus, unreadCount = 0 }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  if (!roomId) return null

  if (!isOpen) {
    return (
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 w-14 h-14 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform z-50"
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </motion.button>
    )
  }

  return (
    <TradeChat
      roomId={roomId}
      billId={billId}
      counterparty={counterparty}
      tradeStatus={tradeStatus}
      minimized={isMinimized}
      onToggleMinimize={() => setIsMinimized(!isMinimized)}
      onClose={() => setIsOpen(false)}
    />
  )
}
