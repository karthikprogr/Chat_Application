import { useState, useEffect } from 'react'
import { useChat } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import { HiX, HiUserAdd, HiCheck, HiX as HiCross, HiClock } from 'react-icons/hi'
import { formatDistanceToNow } from 'date-fns'

const JoinRequestsModal = ({ room, onClose }) => {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const { approveJoinRequest, rejectJoinRequest } = useChat()
  const { currentUser } = useAuth()

  useEffect(() => {
    if (!room || !room.id) return

    const requestsRef = collection(db, 'rooms', room.id, 'joinRequests')
    const q = query(requestsRef, where('status', '==', 'pending'))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const requestsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setRequests(requestsData)
      setLoading(false)
    })

    return unsubscribe
  }, [room])

  const handleApprove = async (requestId, userId) => {
    await approveJoinRequest(room.id, requestId, userId)
  }

  const handleReject = async (requestId) => {
    await rejectJoinRequest(room.id, requestId)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <HiUserAdd className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Join Requests</h2>
              <p className="text-sm text-gray-500">{room.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-500">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <HiUserAdd className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No pending requests</p>
              <p className="text-sm text-gray-500 mt-1">
                Join requests will appear here
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {requests.map((request) => (
                <div key={request.id} className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors">
                  <div className="flex items-start gap-3">
                    {request.userPhoto ? (
                      <img
                        src={request.userPhoto}
                        alt={request.userName}
                        className="w-12 h-12 rounded-full border-2 border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {request.userName?.[0]?.toUpperCase()}
                      </div>
                    )}
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{request.userName}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                        <HiClock className="w-3 h-3" />
                        {request.requestedAt ? (
                          <span>{formatDistanceToNow(request.requestedAt.toDate(), { addSuffix: true })}</span>
                        ) : (
                          <span>Just now</span>
                        )}
                      </div>

                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleApprove(request.id, request.userId)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                        >
                          <HiCheck className="w-4 h-4" />
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                        >
                          <HiCross className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default JoinRequestsModal
