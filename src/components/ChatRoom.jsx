import { useState, useEffect, useRef } from 'react'
import { useChat } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'
import Message from './Message'
import MessageInput from './MessageInput'
import TypingIndicator from './TypingIndicator'
import JoinRequestsModal from './JoinRequestsModal'
import { HiUsers, HiInformationCircle, HiUserGroup, HiUserAdd, HiKey, HiClipboardCopy } from 'react-icons/hi'
import { formatDistanceToNow } from 'date-fns'
import { requestNotificationPermission, showNotification, playNotificationSound, updatePageTitle } from '../utils/notifications'
import { toast } from 'react-toastify'

const ChatRoom = () => {
  const { currentRoom, messages, loadingMessages, activeUsers } = useChat()
  const { currentUser } = useAuth()
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const [showInfo, setShowInfo] = useState(false)
  const [showActiveUsers, setShowActiveUsers] = useState(false)
  const [showJoinRequests, setShowJoinRequests] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const prevMessagesLength = useRef(messages.length)
  const shouldAutoScroll = useRef(true)

  const isAdmin = currentRoom?.admins?.includes(currentUser?.uid)

  const copyInviteCode = () => {
    if (currentRoom?.inviteCode) {
      navigator.clipboard.writeText(currentRoom.inviteCode)
      toast.success('Invite code copied to clipboard!')
    }
  }

  // Request notification permission on mount
  useEffect(() => {
    requestNotificationPermission()
  }, [])

  // Handle notifications for new messages
  useEffect(() => {
    if (messages.length > prevMessagesLength.current && prevMessagesLength.current > 0) {
      const newMessage = messages[messages.length - 1]
      
      // Don't notify for own messages or system messages
      if (newMessage.userId !== currentUser.uid && newMessage.type !== 'system') {
        // Show desktop notification
        showNotification(
          `${newMessage.userName} in ${currentRoom.name}`,
          {
            body: newMessage.text.substring(0, 100),
            tag: 'chat-message',
            requireInteraction: false
          }
        )
        
        // Play sound
        playNotificationSound()
        
        // Update unread count if tab is hidden
        if (document.hidden) {
          setUnreadCount(prev => prev + 1)
        }
      }
    }
    prevMessagesLength.current = messages.length
  }, [messages, currentUser.uid, currentRoom.name])

  // Update page title with unread count
  useEffect(() => {
    updatePageTitle(unreadCount)
  }, [unreadCount])

  // Reset unread count when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setUnreadCount(0)
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [])

  useEffect(() => {
    if (messages.length > prevMessagesLength.current) {
      const lastMessage = messages[messages.length - 1]
      // Always scroll if it's user's own message
      if (lastMessage?.userId === currentUser?.uid) {
        // Use requestAnimationFrame for smooth instant scroll
        requestAnimationFrame(() => {
          if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'nearest' })
          }
        })
      } else if (shouldAutoScroll.current) {
        // Only scroll for others' messages if user is at bottom
        scrollToBottom()
      }
    }
    prevMessagesLength.current = messages.length
  }, [messages, currentUser?.uid])

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'instant', block: 'nearest' })
    }
  }

  // Track if user is at bottom of scroll
  const handleScroll = (e) => {
    const container = e.target
    const isAtBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100
    shouldAutoScroll.current = isAtBottom
  }

  if (!currentRoom) {
    return null
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-white">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">{currentRoom.name}</h2>
            {currentRoom.description && (
              <p className="text-sm text-blue-100">{currentRoom.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button 
                onClick={() => setShowJoinRequests(true)} 
                className="p-2 hover:bg-white/20 rounded-lg transition-colors relative"
                title="Join Requests"
              >
                <HiUserAdd className="w-6 h-6" />
              </button>
            )}
            <button onClick={() => setShowActiveUsers(!showActiveUsers)} className="p-2 hover:bg-white/20 rounded-lg transition-colors relative">
              <HiUserGroup className="w-6 h-6" />
              {activeUsers.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {activeUsers.length}
                </span>
              )}
            </button>
            <button onClick={() => setShowInfo(!showInfo)} className="p-2 hover:bg-white/20 rounded-lg transition-colors">
              <HiInformationCircle className="w-6 h-6" />
            </button>
          </div>
        </div>
        {showActiveUsers && (
          <div className="mt-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm animate-slide-up">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <HiUserGroup className="w-5 h-5" />
              Active Users ({activeUsers.length})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {activeUsers.map(user => (
                <div key={user.id} className="flex items-center gap-2 text-sm">
                  {user.userPhoto ? (
                    <img src={user.userPhoto} alt={user.userName} className="w-8 h-8 rounded-full border-2 border-white" />
                  ) : (
                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold">
                      {user.userName?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <span className="font-medium">{user.userName}</span>
                  <span className="w-2 h-2 bg-green-400 rounded-full ml-auto"></span>
                </div>
              ))}
            </div>
          </div>
        )}
        {showInfo && (
          <div className="mt-4 p-4 bg-white/10 rounded-lg backdrop-blur-sm animate-slide-up">
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <HiUsers className="w-4 h-4" />
                <span>Created by: {currentRoom.createdByName}</span>
              </div>
              {currentRoom.createdAt && (
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Created {formatDistanceToNow(currentRoom.createdAt.toDate(), { addSuffix: true })}</span>
                </div>
              )}
              {currentRoom.inviteCode && (
                <div className="border-t border-white/20 pt-3 mt-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HiKey className="w-4 h-4" />
                      <span>Invite Code:</span>
                    </div>
                    <button
                      onClick={copyInviteCode}
                      className="flex items-center gap-2 px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                    >
                      <span className="font-mono font-bold tracking-wider">{currentRoom.inviteCode}</span>
                      <HiClipboardCopy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-white/70 mt-2">
                    Share this code with people you want to invite
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto scrollbar-thin bg-gradient-to-b from-gray-50 to-white p-4">
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-500 text-sm">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block p-6 bg-blue-50 rounded-full mb-4">
                <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No messages yet</h3>
              <p className="text-gray-600">Be the first to start the conversation!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isOwnMessage = message.userId === currentUser.uid
              const showAvatar = index === 0 || messages[index - 1].userId !== message.userId
              return (
                <Message key={message.id} message={message} isOwnMessage={isOwnMessage} showAvatar={showAvatar} />
              )
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
        <TypingIndicator />
      </div>

      <MessageInput />

      {/* Join Requests Modal */}
      {showJoinRequests && isAdmin && (
        <JoinRequestsModal room={currentRoom} onClose={() => setShowJoinRequests(false)} />
      )}
    </div>
  )
}

export default ChatRoom
