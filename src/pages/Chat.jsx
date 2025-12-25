import { useState, useEffect } from 'react'
import { useChat } from '../context/ChatContext'
import Sidebar from '../components/Sidebar'
import ChatRoom from '../components/ChatRoom'
import Navbar from '../components/Navbar'
import CreateRoomModal from '../components/CreateRoomModal'
import SetPasswordModal from '../components/SetPasswordModal'
import { HiMenu } from 'react-icons/hi'

const Chat = () => {
  const { currentRoom, loadingRooms } = useChat()
  const [showSidebar, setShowSidebar] = useState(false)
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showSetPassword, setShowSetPassword] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  // Check if Google user needs to set password
  useEffect(() => {
    const needsPassword = sessionStorage.getItem('needsPasswordSetup') === 'true'
    if (needsPassword) {
      setShowSetPassword(true)
    }
  }, [])

  // Show loading screen for at least 1 second after sign in
  useEffect(() => {
    if (!loadingRooms) {
      const timer = setTimeout(() => {
        setInitialLoading(false)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [loadingRooms])

  // Show loading animation
  if (initialLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900">
        <div className="text-center">
          {/* Animated Chat Icon */}
          <div className="relative mb-8">
            <div className="w-24 h-24 mx-auto bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center animate-pulse">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            
            {/* Orbiting dots */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-32 h-32 rounded-full border-2 border-transparent border-t-blue-400 animate-spin"></div>
            </div>
          </div>

          {/* Loading Text */}
          <h2 className="text-2xl font-bold text-white mb-2">Loading Your Chats</h2>
          <p className="text-blue-300">Setting up your workspace...</p>
          
          {/* Animated dots */}
          <div className="flex justify-center space-x-2 mt-6">
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Mobile Menu Button */}
        <button
          onClick={() => setShowSidebar(!showSidebar)}
          className="lg:hidden fixed bottom-4 right-4 z-50 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        >
          <HiMenu className="w-6 h-6" />
        </button>

        {/* Sidebar */}
        <div
          className={`${
            showSidebar ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 fixed lg:relative z-40 w-80 h-full transition-transform duration-300 ease-in-out`}
        >
          <Sidebar 
            onClose={() => setShowSidebar(false)}
            onCreateRoom={() => setShowCreateRoom(true)}
          />
        </div>

        {/* Overlay for mobile */}
        {showSidebar && (
          <div
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
            onClick={() => setShowSidebar(false)}
          />
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {currentRoom ? (
            <ChatRoom />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
              <div className="text-center">
                <div className="inline-block p-6 bg-white rounded-full shadow-lg mb-4">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to ChatApp</h2>
                <p className="text-gray-600 mb-6">Select a room or create a new one to start chatting</p>
                <button
                  onClick={() => setShowCreateRoom(true)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  Create Your First Room
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Room Modal */}
      {showCreateRoom && (
        <CreateRoomModal onClose={() => setShowCreateRoom(false)} />
      )}

      {/* Set Password Modal for Google Users */}
      {showSetPassword && (
        <SetPasswordModal onClose={() => setShowSetPassword(false)} />
      )}
    </div>
  )
}

export default Chat
