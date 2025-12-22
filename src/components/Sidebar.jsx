import { useState } from 'react'
import { useChat } from '../context/ChatContext'
import { HiPlus, HiX, HiUsers, HiClock, HiKey } from 'react-icons/hi'
import { formatDistanceToNow } from 'date-fns'
import JoinRoomModal from './JoinRoomModal'

const Sidebar = ({ onClose, onCreateRoom }) => {
  const { rooms, currentRoom, joinRoom, loadingRooms } = useChat()
  const [showJoinRoomModal, setShowJoinRoomModal] = useState(false)

  const handleRoomSelect = (room) => {
    joinRoom(room)
    onClose()
  }

  return (
    <div className="h-full bg-white border-r border-gray-200 flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Chat Rooms</h2>
          <button
            onClick={onClose}
            className="lg:hidden text-white hover:text-gray-200 transition-colors"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onCreateRoom}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-blue-600 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-md"
          >
            <HiPlus className="w-5 h-5" />
            Create Room
          </button>
          <button
            onClick={() => setShowJoinRoomModal(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-white text-purple-600 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors shadow-md"
          >
            <HiKey className="w-5 h-5" />
            Join Room
          </button>
        </div>
      </div>

      {/* Room List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {loadingRooms ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-500 text-sm">Loading rooms...</p>
            </div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="flex items-center justify-center h-full p-4">
            <div className="text-center">
              <div className="inline-block p-4 bg-gray-100 rounded-full mb-3">
                <HiUsers className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-2">No chat rooms yet</p>
              <p className="text-sm text-gray-500">Create one to get started!</p>
            </div>
          </div>
        ) : (
          <div className="p-2">
            {rooms.map((room) => (
              <button
                key={room.id}
                onClick={() => handleRoomSelect(room)}
                className={`w-full text-left p-4 rounded-lg mb-2 transition-all ${
                  currentRoom?.id === room.id
                    ? 'bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-500'
                    : 'hover:bg-gray-50 border-2 border-transparent'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 truncate mb-1">
                      {room.name}
                    </h3>
                    {room.description && (
                      <p className="text-sm text-gray-600 truncate mb-2">
                        {room.description}
                      </p>
                    )}
                    {room.lastMessage && (
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="truncate">{room.lastMessageBy}: {room.lastMessage}</span>
                      </div>
                    )}
                  </div>
                  {currentRoom?.id === room.id && (
                    <div className="ml-2 flex-shrink-0">
                      <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <HiUsers className="w-3 h-3" />
                    <span>Created by {room.createdByName}</span>
                  </div>
                  {room.createdAt && (
                    <div className="flex items-center gap-1">
                      <HiClock className="w-3 h-3" />
                      <span>
                        {formatDistanceToNow(room.createdAt.toDate(), { addSuffix: true })}
                      </span>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span>{rooms.length} Active Rooms</span>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Online</span>
          </div>
        </div>
      </div>

      {/* Join Room Modal */}
      {showJoinRoomModal && (
        <JoinRoomModal onClose={() => setShowJoinRoomModal(false)} />
      )}
    </div>
  )
}

export default Sidebar
