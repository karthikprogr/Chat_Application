import { useState, useEffect } from 'react'
import { useChat } from '../context/ChatContext'
import { useAuth } from '../context/AuthContext'
import { HiX, HiUserRemove, HiUserAdd, HiShieldCheck, HiLockClosed, HiLockOpen, HiLogout } from 'react-icons/hi'
import { collection, getDocs, doc, updateDoc, arrayRemove, arrayUnion, getDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { toast } from 'react-toastify'

const RoomSettingsModal = ({ room, onClose, isReadOnly = false }) => {
  const { currentUser } = useAuth()
  const { leaveRoom } = useChat()
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(false)
  const [adminOnlyChat, setAdminOnlyChat] = useState(room?.adminOnlyChat || false)

  const isAdmin = room?.admins?.includes(currentUser?.uid)

  useEffect(() => {
    fetchMembers()
  }, [room?.id])

  const fetchMembers = async () => {
    if (!room?.members || room.members.length === 0) return

    try {
      const usersRef = collection(db, 'users')
      const usersSnapshot = await getDocs(usersRef)
      
      const membersList = usersSnapshot.docs
        .filter(doc => room.members.includes(doc.id))
        .map(doc => ({
          uid: doc.id,
          ...doc.data(),
          isAdmin: room.admins?.includes(doc.id)
        }))
      
      setMembers(membersList)
    } catch (error) {
      console.error('Error fetching members:', error)
      toast.error('Failed to load members')
    }
  }

  const removeMember = async (memberId) => {
    if (!isAdmin || memberId === currentUser.uid) {
      toast.error('Cannot remove yourself or you are not admin')
      return
    }

    setLoading(true)
    try {
      const roomRef = doc(db, 'rooms', room.id)
      await updateDoc(roomRef, {
        members: arrayRemove(memberId),
        admins: arrayRemove(memberId),
        memberCount: (room.memberCount || 1) - 1
      })
      
      toast.success('Member removed successfully')
      fetchMembers()
    } catch (error) {
      console.error('Error removing member:', error)
      toast.error('Failed to remove member')
    } finally {
      setLoading(false)
    }
  }

  const promoteToAdmin = async (memberId) => {
    if (!isAdmin) {
      toast.error('Only admins can promote members')
      return
    }

    setLoading(true)
    try {
      const roomRef = doc(db, 'rooms', room.id)
      await updateDoc(roomRef, {
        admins: arrayUnion(memberId)
      })
      
      toast.success('Member promoted to admin')
      fetchMembers()
    } catch (error) {
      console.error('Error promoting member:', error)
      toast.error('Failed to promote member')
    } finally {
      setLoading(false)
    }
  }

  const demoteAdmin = async (memberId) => {
    if (!isAdmin || memberId === currentUser.uid) {
      toast.error('Cannot demote yourself')
      return
    }

    setLoading(true)
    try {
      const roomRef = doc(db, 'rooms', room.id)
      await updateDoc(roomRef, {
        admins: arrayRemove(memberId)
      })
      
      toast.success('Admin demoted successfully')
      fetchMembers()
    } catch (error) {
      console.error('Error demoting admin:', error)
      toast.error('Failed to demote admin')
    } finally {
      setLoading(false)
    }
  }

  const toggleAdminOnlyChat = async () => {
    if (!isAdmin) {
      toast.error('Only admins can change this setting')
      return
    }

    setLoading(true)
    try {
      const roomRef = doc(db, 'rooms', room.id)
      const newValue = !adminOnlyChat
      await updateDoc(roomRef, {
        adminOnlyChat: newValue
      })
      
      setAdminOnlyChat(newValue)
      toast.success(newValue ? 'Only admins can chat now' : 'All members can chat now')
    } catch (error) {
      console.error('Error updating chat restriction:', error)
      toast.error('Failed to update setting')
    } finally {
      setLoading(false)
    }
  }

  const handleLeaveRoom = async () => {
    if (window.confirm('Are you sure you want to leave this room?')) {
      setLoading(true)
      try {
        await leaveRoom(room.id)
        toast.success('Left room successfully')
        onClose()
      } catch (error) {
        console.error('Error leaving room:', error)
        toast.error('Failed to leave room')
      } finally {
        setLoading(false)
      }
    }
  }

  // Non-admin view - read-only
  if (!isAdmin || isReadOnly) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
        <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800">Room Members</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <HiX className="w-6 h-6" />
            </button>
          </div>

          {/* Members List */}
          <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <HiUserAdd className="w-5 h-5" />
                Members ({members.length})
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {members.map(member => (
                  <div key={member.uid} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {member.photoURL ? (
                      <img src={member.photoURL} alt={member.displayName} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {member.displayName?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium text-gray-800">
                        {member.displayName}
                        {member.uid === currentUser.uid && ' (You)'}
                      </p>
                      {member.isAdmin && (
                        <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                          <HiShieldCheck className="w-3 h-3" /> Admin
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer with Leave Button */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={handleLeaveRoom}
              disabled={loading}
              className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <HiLogout className="w-5 h-5" />
              {loading ? 'Leaving...' : 'Leave Room'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Room Settings</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <HiX className="w-6 h-6" />
          </button>
        </div>

        {/* Settings */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Admin Only Chat Toggle */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {adminOnlyChat ? <HiLockClosed className="w-5 h-5 text-blue-600" /> : <HiLockOpen className="w-5 h-5 text-green-600" />}
                  <h3 className="font-semibold text-gray-800">Restrict Messaging</h3>
                </div>
                <p className="text-sm text-gray-600">
                  {adminOnlyChat ? 'Only admins can send messages' : 'All members can send messages'}
                </p>
              </div>
              <button
                onClick={toggleAdminOnlyChat}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  adminOnlyChat 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                {adminOnlyChat ? 'Allow All' : 'Restrict'}
              </button>
            </div>
          </div>

          {/* Members List */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <HiUserAdd className="w-5 h-5" />
              Manage Members ({members.length})
            </h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {members.map(member => (
                <div key={member.uid} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    {member.photoURL ? (
                      <img src={member.photoURL} alt={member.displayName} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                        {member.displayName?.[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-800">
                        {member.displayName}
                        {member.uid === currentUser.uid && ' (You)'}
                      </p>
                      {member.isAdmin && (
                        <span className="text-xs text-blue-600 font-semibold flex items-center gap-1">
                          <HiShieldCheck className="w-3 h-3" /> Admin
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {member.uid !== currentUser.uid && (
                    <div className="flex gap-2">
                      {member.isAdmin ? (
                        <button
                          onClick={() => demoteAdmin(member.uid)}
                          disabled={loading}
                          className="px-3 py-1 text-sm bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          Remove Admin
                        </button>
                      ) : (
                        <button
                          onClick={() => promoteToAdmin(member.uid)}
                          disabled={loading}
                          className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          Make Admin
                        </button>
                      )}
                      <button
                        onClick={() => removeMember(member.uid)}
                        disabled={loading}
                        className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <HiUserRemove className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoomSettingsModal
