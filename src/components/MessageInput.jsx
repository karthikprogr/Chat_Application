import { useState, useRef, useEffect } from 'react'
import { useChat } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'
import { HiPaperAirplane, HiEmojiHappy, HiLockClosed } from 'react-icons/hi'
import { MdFormatBold, MdFormatItalic } from 'react-icons/md'
import EmojiPicker from './EmojiPicker'

const MessageInput = () => {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const { sendMessage, setTyping, currentRoom } = useChat()
  const { currentUser } = useAuth()
  const inputRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const emojiPickerRef = useRef(null)

  const isAdmin = currentRoom?.admins?.includes(currentUser?.uid)
  const canSendMessage = !currentRoom?.adminOnlyChat || isAdmin

  useEffect(() => {
    inputRef.current?.focus()
  }, [currentRoom])

  // Click outside to close emoji picker
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false)
      }
    }

    if (showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojiPicker])

  const handleChange = (e) => {
    const value = e.target.value
    setMessage(value)
    if (value.trim() && !isTyping) {
      setIsTyping(true)
      setTyping(true)
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      setTyping(false)
    }, 1000)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!message.trim() || !canSendMessage || isSending) return
    
    const messageToSend = message.trim()
    setMessage('') // Clear immediately for better UX
    setIsTyping(false)
    setTyping(false)
    setIsSending(true)
    
    try {
      await sendMessage(messageToSend)
      inputRef.current?.focus()
    } catch (error) {
      console.error('Failed to send message:', error)
      // Only restore message if it wasn't an admin-only restriction
      if (!error.message?.includes('Admin only')) {
        setMessage(messageToSend)
      }
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()
      handleSubmit(e)
    }
  }

  const insertFormatting = (format) => {
    const input = inputRef.current
    const start = input.selectionStart
    const end = input.selectionEnd
    const selectedText = message.substring(start, end)
    let formattedText = selectedText
    if (format === 'bold') {
      formattedText = `**${selectedText}**`
    } else if (format === 'italic') {
      formattedText = `*${selectedText}*`
    }
    const newMessage = message.substring(0, start) + formattedText + message.substring(end)
    setMessage(newMessage)
    setTimeout(() => {
      input.focus()
      input.setSelectionRange(start + formattedText.length, start + formattedText.length)
    }, 0)
  }

  const handleEmojiSelect = (emoji) => {
    const input = inputRef.current
    const start = input.selectionStart
    const end = input.selectionEnd
    const newMessage = message.substring(0, start) + emoji + message.substring(end)
    setMessage(newMessage)
    setTimeout(() => {
      input.focus()
      input.setSelectionRange(start + emoji.length, start + emoji.length)
    }, 0)
  }

  if (!canSendMessage) {
    return (
      <div className="border-t border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-center gap-2 text-gray-500">
          <HiLockClosed className="w-5 h-5" />
          <p className="text-sm">Only admins can send messages in this room</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border-t border-gray-800 bg-gray-900 p-4">
      <form onSubmit={handleSubmit} className="space-y-2">
        {/* Formatting toolbar */}
        <div className="flex items-center gap-2 px-2">
          <button
            type="button"
            onClick={() => insertFormatting('bold')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Bold (**text**)"
          >
            <MdFormatBold className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting('italic')}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Italic (*text*)"
          >
            <MdFormatItalic className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <span className="text-xs text-gray-500">
            Use **bold** or *italic* for formatting
          </span>
        </div>

        {/* Input area */}
        <div className="flex items-center gap-3">
          <div className="flex-1 relative" ref={emojiPickerRef}>
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleChange}
            onKeyPress={handleKeyPress}
            placeholder="Type a message"
            className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-700 text-white placeholder-gray-400 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-all scrollbar-thin"
            rows="1"
            style={{ minHeight: '48px', maxHeight: '120px', height: 'auto' }}
            onInput={(e) => {
              e.target.style.height = 'auto'
              e.target.style.height = e.target.scrollHeight + 'px'
            }}
          />
          <button 
            type="button" 
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="absolute right-4 bottom-3 text-gray-500 hover:text-gray-700 transition-colors" 
            title="Emojis"
          >
            <HiEmojiHappy className="w-6 h-6" />
          </button>
          {showEmojiPicker && (
            <EmojiPicker 
              onSelect={handleEmojiSelect}
              onClose={() => setShowEmojiPicker(false)}
            />
          )}
        </div>
        <button
          type="submit"
          disabled={!message.trim() || isSending}
          className="p-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex-shrink-0"
          title="Send message"
        >
          {isSending ? (
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <HiPaperAirplane className="w-5 h-5 transform rotate-90" />
          )}
        </button>
        </div>
      </form>
    </div>
  )
}

export default MessageInput
