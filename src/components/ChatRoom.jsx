import { useState, useEffect, useRef } from 'react'
import { useChat } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'
import Message from './Message'
import MessageInput from './MessageInput'
import TypingIndicator from './TypingIndicator'
import JoinRequestsModal from './JoinRequestsModal'
import RoomSettingsModal from './RoomSettingsModal'
import { HiUsers, HiInformationCircle, HiUserGroup, HiUserAdd, HiKey, HiClipboardCopy, HiSearch, HiDotsVertical, HiX, HiCog, HiLogout } from 'react-icons/hi'
import { formatDistanceToNow } from 'date-fns'
import { requestNotificationPermission, showNotification, playNotificationSound, updatePageTitle } from '../utils/notifications'
import { toast } from 'react-toastify'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'

const ChatRoom = () => {
  const { currentRoom, messages, loadingMessages, activeUsers, leaveRoom } = useChat()
  const { currentUser } = useAuth()
  const messagesEndRef = useRef(null)
  const messagesContainerRef = useRef(null)
  const activeUsersRef = useRef(null)
  const groupInfoRef = useRef(null)
  const settingsMenuRef = useRef(null)
  const settingsButtonRef = useRef(null)
  const [showInfo, setShowInfo] = useState(false)
  const [showActiveUsers, setShowActiveUsers] = useState(false)
  const [showJoinRequests, setShowJoinRequests] = useState(false)
  const [showRoomSettings, setShowRoomSettings] = useState(false)
  const [showSettingsMenu, setShowSettingsMenu] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [memberNames, setMemberNames] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const prevMessagesLength = useRef(messages.length)
  const shouldAutoScroll = useRef(true)

  const isAdmin = currentRoom?.admins?.includes(currentUser?.uid)

  // Fetch member names
  useEffect(() => {
    const fetchMemberNames = async () => {
      if (!currentRoom?.members || currentRoom.members.length === 0) {
        setMemberNames([])
        return
      }
      
      try {
        const usersRef = collection(db, 'users')
        const usersSnapshot = await getDocs(usersRef)
        const names = usersSnapshot.docs
          .filter(doc => currentRoom.members.includes(doc.id))
          .map(doc => doc.data().displayName || 'Unknown')
          .slice(0, 3) // Show only first 3 members
        
        setMemberNames(names)
      } catch (error) {
        console.error('Error fetching member names:', error)
      }
    }
    
    fetchMemberNames()
  }, [currentRoom?.id, currentRoom?.members])

  const copyInviteCode = () => {
    if (currentRoom?.inviteCode) {
      navigator.clipboard.writeText(currentRoom.inviteCode)
      toast.success('Invite code copied to clipboard!')
    }
  }

  const handleLeaveRoom = async () => {
    if (!currentRoom?.id) return
    
    const confirmLeave = window.confirm(
      `Are you sure you want to leave "${currentRoom.name}"? You'll need an invite code to rejoin if it's a private room.`
    )
    
    if (confirmLeave) {
      try {
        await leaveRoom(currentRoom.id)
        toast.success(`You left ${currentRoom.name}`)
        setShowSettingsMenu(false)
      } catch (error) {
        console.error('Error leaving room:', error)
        toast.error(error.message || 'Failed to leave room')
      }
    }
  }

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }
    
    const results = messages.filter(msg => 
      msg.text && msg.text.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setSearchResults(results)
    
    if (results.length === 0) {
      toast.info('No messages found')
    } else {
      toast.success(`Found ${results.length} message(s)`)
    }
  }

  const scrollToMessage = (messageId) => {
    const messageElement = document.getElementById(`message-${messageId}`)
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      messageElement.classList.add('highlight-message')
      setTimeout(() => messageElement.classList.remove('highlight-message'), 2000)
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

  // Close Active Users and Group Info when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is outside Active Users panel
      if (showActiveUsers && activeUsersRef.current && !activeUsersRef.current.contains(event.target)) {
        // Don't close if clicking on the settings menu button area
        const isSettingsMenuClick = event.target.closest('.settings-menu') || event.target.closest('button[title="Settings"]')
        if (!isSettingsMenuClick) {
          setShowActiveUsers(false)
        }
      }
      // Check if click is outside Group Info panel
      if (showInfo && groupInfoRef.current && !groupInfoRef.current.contains(event.target)) {
        // Don't close if clicking on the settings menu button area
        const isSettingsMenuClick = event.target.closest('.settings-menu') || event.target.closest('button[title="Settings"]')
        if (!isSettingsMenuClick) {
          setShowInfo(false)
        }
      }
      // Check if click is outside Settings Menu
      if (showSettingsMenu && settingsMenuRef.current && !settingsMenuRef.current.contains(event.target) && 
          settingsButtonRef.current && !settingsButtonRef.current.contains(event.target)) {
        setShowSettingsMenu(false)
      }
    }

    if (showActiveUsers || showInfo || showSettingsMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showActiveUsers, showInfo, showSettingsMenu])

  useEffect(() => {
    if (messages.length > prevMessagesLength.current && prevMessagesLength.current > 0) {
      const lastMessage = messages[messages.length - 1]
      // Always scroll if it's user's own message - multiple attempts for reliability
      if (lastMessage?.userId === currentUser?.uid) {
        const scrollToEnd = () => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
          }
        }
        // Immediate scroll
        scrollToEnd()
        // Backup scroll with requestAnimationFrame
        requestAnimationFrame(scrollToEnd)
        // Final backup with timeout
        setTimeout(scrollToEnd, 50)
      } else if (shouldAutoScroll.current) {
        // Only scroll for others' messages if user is at bottom
        scrollToBottom()
      }
    }
    prevMessagesLength.current = messages.length
  }, [messages, currentUser?.uid])

  // Scroll to bottom on initial load and room change
  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      // Multiple scroll attempts to ensure it works
      const scrollToEnd = () => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
        }
      }
      // Immediate scroll
      scrollToEnd()
      // Multiple backup scrolls with increasing delays
      const timer1 = setTimeout(scrollToEnd, 50)
      const timer2 = setTimeout(scrollToEnd, 150)
      const timer3 = setTimeout(scrollToEnd, 300)
      const timer4 = setTimeout(scrollToEnd, 500)
      
      return () => {
        clearTimeout(timer1)
        clearTimeout(timer2)
        clearTimeout(timer3)
        clearTimeout(timer4)
      }
    }
  }, [currentRoom?.id, messages.length])

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
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
    <div className="flex-1 flex flex-col h-full bg-gray-900">
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4 shadow-md border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">{currentRoom.name}</h2>
            {memberNames.length > 0 && (
              <p className="text-sm text-blue-200">
                {memberNames.join(', ')}{currentRoom.memberCount > 3 ? ` +${currentRoom.memberCount - 3} more` : ''}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowSearch(!showSearch)} 
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Search messages"
            >
              <HiSearch className="w-6 h-6" />
            </button>
            <button
              ref={settingsButtonRef}
              onClick={() => setShowSettingsMenu(!showSettingsMenu)} 
              className="p-2 hover:bg-white/20 rounded-lg transition-colors relative"
              title="Settings"
            >
              <HiDotsVertical className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        {showSearch && (
          <div className="mt-4 animate-slide-up">
            <div className="flex gap-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Search messages..."
                className="flex-1 px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                Search
              </button>
              <button
                onClick={() => {
                  setShowSearch(false)
                  setSearchQuery('')
                  setSearchResults([])
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <HiX className="w-5 h-5" />
              </button>
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto bg-white/10 rounded-lg p-2">
                {searchResults.map((msg, idx) => (
                  <div
                    key={idx}
                    onClick={() => scrollToMessage(msg.id)}
                    className="p-2 hover:bg-white/20 rounded cursor-pointer text-sm mb-1"
                  >
                    <span className="font-semibold">{msg.userName}:</span> {msg.text?.substring(0, 50)}...
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Settings Menu */}
        {showSettingsMenu && (
          <div ref={settingsMenuRef} className="settings-menu absolute right-4 mt-2 w-64 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50 animate-slide-up">
            <div className="py-2">
              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      setShowRoomSettings(true)
                      setShowSettingsMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center gap-3"
                  >
                    <HiCog className="w-5 h-5" />
                    Room Settings
                  </button>
                  <button
                    onClick={() => {
                      setShowJoinRequests(true)
                      setShowSettingsMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center gap-3"
                  >
                    <HiUserAdd className="w-5 h-5" />
                    Join Requests
                  </button>
                </>
              )}
              {!isAdmin && (
                <>
                  <button
                    onClick={() => {
                      setShowRoomSettings(true)
                      setShowSettingsMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center gap-3"
                  >
                    <HiUsers className="w-5 h-5" />
                    View Members
                  </button>
                  <button
                    onClick={handleLeaveRoom}
                    className="w-full px-4 py-2 text-left text-red-400 hover:bg-red-900/30 flex items-center gap-3"
                  >
                    <HiLogout className="w-5 h-5" />
                    Leave Room
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setShowActiveUsers(!showActiveUsers)
                  setShowSettingsMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center gap-3"
              >
                <HiUserGroup className="w-5 h-5" />
                Active Users ({activeUsers.length})
              </button>
              <button
                onClick={() => {
                  setShowInfo(!showInfo)
                  setShowSettingsMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center gap-3"
              >
                <HiInformationCircle className="w-5 h-5" />
                Group Info
              </button>
              <button
                onClick={() => {
                  copyInviteCode()
                  setShowSettingsMenu(false)
                }}
                className="w-full px-4 py-2 text-left text-white hover:bg-gray-700 flex items-center gap-3"
              >
                <HiClipboardCopy className="w-5 h-5" />
                Copy Invite Code
              </button>
            </div>
          </div>
        )}
        {showActiveUsers && (
          <div ref={activeUsersRef} className="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-lg backdrop-blur-sm animate-slide-up">
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
          <div ref={groupInfoRef} className="mt-4 p-4 bg-gray-800 border border-gray-700 rounded-lg backdrop-blur-sm animate-slide-up">
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

      <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto scrollbar-thin p-4" style={{ backgroundColor: '#0b141a', backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.03) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(99, 102, 241, 0.03) 0%, transparent 50%)', backgroundSize: '100% 100%' }}>
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-400 text-sm">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block p-6 bg-gray-800 rounded-full mb-4">
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No messages yet</h3>
              <p className="text-gray-400">Be the first to start the conversation!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message, index) => {
              const isOwnMessage = message.userId === currentUser.uid
              const showAvatar = index === 0 || messages[index - 1].userId !== message.userId
              
              // Show date separator if this is the first message or if the date changed
              let showDateSeparator = false
              let dateLabel = ''
              
              if (message.createdAt) {
                const currentDate = new Date(message.createdAt.toDate()).toDateString()
                const previousDate = index > 0 && messages[index - 1].createdAt 
                  ? new Date(messages[index - 1].createdAt.toDate()).toDateString() 
                  : null
                
                if (index === 0 || currentDate !== previousDate) {
                  showDateSeparator = true
                  const msgDate = new Date(message.createdAt.toDate())
                  const today = new Date()
                  const yesterday = new Date(today)
                  yesterday.setDate(yesterday.getDate() - 1)
                  
                  if (msgDate.toDateString() === today.toDateString()) {
                    dateLabel = 'Today'
                  } else if (msgDate.toDateString() === yesterday.toDateString()) {
                    dateLabel = 'Yesterday'
                  } else {
                    dateLabel = msgDate.toLocaleDateString('en-US', { 
                      month: 'long', 
                      day: 'numeric', 
                      year: msgDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
                    })
                  }
                }
              }
              
              return (
                <div key={message.id}>
                  {showDateSeparator && (
                    <div className="flex justify-center my-4">
                      <div className="bg-gray-800/80 backdrop-blur-sm text-gray-300 text-xs px-3 py-1.5 rounded-md shadow-lg">
                        {dateLabel}
                      </div>
                    </div>
                  )}
                  <Message message={message} isOwnMessage={isOwnMessage} showAvatar={showAvatar} />
                </div>
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

      {/* Room Settings Modal */}
      {showRoomSettings && (
        <RoomSettingsModal room={currentRoom} onClose={() => setShowRoomSettings(false)} />
      )}
    </div>
  )
}

export default ChatRoom
