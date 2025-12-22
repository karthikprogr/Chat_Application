import { useState } from 'react'
import { useChat } from '../context/ChatContext'
import { HiX, HiLockClosed, HiGlobeAlt } from 'react-icons/hi'

const CreateRoomModal = ({ onClose }) => {
  const [roomName, setRoomName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(true)
  const [loading, setLoading] = useState(false)
  const { createRoom } = useChat()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!roomName.trim()) {
      return
    }

    setLoading(true)
    try {
      await createRoom(roomName, description, isPrivate)
      onClose()
    } catch (error) {
      console.error('Failed to create room:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Create New Room</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Room Name */}
          <div>
            <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-2">
              Room Name <span className="text-red-500">*</span>
            </label>
            <input
              id="roomName"
              type="text"
              required
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="e.g., General Discussion"
              maxLength={50}
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              {roomName.length}/50 characters
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              placeholder="What's this room about?"
              rows="3"
              maxLength={200}
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              {description.length}/200 characters
            </p>
          </div>

          {/* Privacy Setting */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Room Privacy
            </label>
            <div className="space-y-3">
              <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${isPrivate ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                <input
                  type="radio"
                  name="privacy"
                  checked={isPrivate}
                  onChange={() => setIsPrivate(true)}
                  className="mt-1 mr-3"
                  disabled={loading}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <HiLockClosed className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-800">Private Room</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Users need an invite code to request access. Admins must approve join requests.
                  </p>
                </div>
              </label>

              <label className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-colors ${!isPrivate ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`}>
                <input
                  type="radio"
                  name="privacy"
                  checked={!isPrivate}
                  onChange={() => setIsPrivate(false)}
                  className="mt-1 mr-3"
                  disabled={loading}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <HiGlobeAlt className="w-5 h-5 text-green-600" />
                    <span className="font-semibold text-gray-800">Public Room</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Anyone with the invite code can join immediately without approval.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>📋 Note:</strong> An invite code will be generated after creation. Share it with people you want to invite!
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !roomName.trim()}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating...
                </span>
              ) : (
                'Create Room'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateRoomModal
