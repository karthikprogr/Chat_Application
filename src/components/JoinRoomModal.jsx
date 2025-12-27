import { useState } from 'react'
import { useChat } from '../context/ChatContext'
import { HiX, HiKey, HiSearch } from 'react-icons/hi'
import { toast } from 'react-toastify'

const JoinRoomModal = ({ onClose }) => {
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchMode, setSearchMode] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)
  const { joinRoomWithCode, searchRooms } = useChat()

  const handleJoinWithCode = async (e) => {
    e.preventDefault()

    if (!inviteCode.trim()) {
      return
    }

    setLoading(true)
    try {
      await joinRoomWithCode(inviteCode)
      onClose()
    } catch (error) {
      console.error('Failed to join room:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()

    if (!searchTerm.trim()) {
      return
    }

    setSearching(true)
    try {
      const results = await searchRooms(searchTerm)
      setSearchResults(results)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleJoinFromSearch = async (room) => {
    if (!room.inviteCode) {
      toast.error('Room has no invite code')
      return
    }
    
    setLoading(true)
    try {
      await joinRoomWithCode(room.inviteCode)
      onClose()
    } catch (error) {
      console.error('Failed to join room:', error)
      // Error already handled by joinRoomWithCode
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full animate-slide-up border border-gray-800">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-2xl font-bold text-white">Join a Room</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setSearchMode(false)}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${!searchMode ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            <HiKey className="w-5 h-5 inline-block mr-2" />
            Invite Code
          </button>
          <button
            onClick={() => setSearchMode(true)}
            className={`flex-1 px-4 py-3 font-medium transition-colors ${searchMode ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            <HiSearch className="w-5 h-5 inline-block mr-2" />
            Search Rooms
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {!searchMode ? (
            /* Invite Code Form */
            <form onSubmit={handleJoinWithCode} className="space-y-4">
              <div>
                <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-300 mb-2">
                  Enter Invite Code
                </label>
                <input
                  id="inviteCode"
                  type="text"
                  required
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-3 border border-gray-700 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-center text-lg font-mono tracking-widest uppercase placeholder-gray-500"
                  placeholder="ABC123XY"
                  maxLength={8}
                  disabled={loading}
                />
                <p className="mt-2 text-xs text-gray-500">
                  Ask the room admin for an invite code
                </p>
              </div>

              <div className="bg-yellow-900/20 border border-yellow-700/50 rounded-lg p-4">
                <p className="text-sm text-yellow-400">
                  <strong>🔒 Privacy:</strong> If the room is private, your join request will need admin approval.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !inviteCode.trim()}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Joining...
                  </span>
                ) : (
                  'Join Room'
                )}
              </button>
            </form>
          ) : (
            /* Search Form */
            <div className="space-y-4">
              <form onSubmit={handleSearch} className="space-y-3">
                <div>
                  <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-300 mb-2">
                    Search by Room Name
                  </label>
                  <input
                    id="searchTerm"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-700 bg-gray-800 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors placeholder-gray-500"
                    placeholder="Type room name..."
                    disabled={searching}
                  />
                </div>
                <button
                  type="submit"
                  disabled={searching || !searchTerm.trim()}
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-medium"
                >
                  {searching ? 'Searching...' : 'Search'}
                </button>
              </form>

              {/* Search Results */}
              <div className="max-h-64 overflow-y-auto space-y-2">
                {searchResults.length > 0 ? (
                  searchResults.map((room) => (
                    <div key={room.id} className="p-4 border border-gray-700 bg-gray-800 rounded-lg hover:border-blue-500 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-1">{room.name}</h3>
                          {room.description && (
                            <p className="text-sm text-gray-400 mb-2">{room.description}</p>
                          )}
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              {room.isPrivate ? (
                                <><HiKey className="w-3 h-3" /> Private</>
                              ) : (
                                <><HiSearch className="w-3 h-3" /> Public</>
                              )}
                            </span>
                            <span>{room.memberCount || 0} members</span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleJoinFromSearch(room)}
                          disabled={loading}
                          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {loading ? '...' : room.isPrivate ? 'Request Join' : 'Join Now'}
                        </button>
                      </div>
                    </div>
                  ))
                ) : searchTerm && !searching ? (
                  <div className="text-center py-8 text-gray-400">
                    <HiSearch className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                    <p>No rooms found matching "{searchTerm}"</p>
                  </div>
                ) : null}
              </div>

              {searchResults.length === 0 && !searchTerm && (
                <div className="text-center py-8 text-gray-400">
                  <HiSearch className="w-12 h-12 mx-auto mb-2 text-gray-600" />
                  <p>Search for rooms by name</p>
                  <p className="text-sm mt-1">You'll get the invite code to join</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JoinRoomModal
