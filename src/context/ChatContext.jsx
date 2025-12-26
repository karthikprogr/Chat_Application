import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  getDocs,
  where,
  limit,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from './AuthContext'
import { toast } from 'react-toastify'

const ChatContext = createContext()

export const useChat = () => {
  const context = useContext(ChatContext)
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider')
  }
  return context
}

export const ChatProvider = ({ children }) => {
  const { currentUser } = useAuth()
  const [rooms, setRooms] = useState([])
  const [currentRoom, setCurrentRoom] = useState(null)
  const [messages, setMessages] = useState([])
  const [typingUsers, setTypingUsers] = useState({})
  const [activeUsers, setActiveUsers] = useState([])
  const [loadingRooms, setLoadingRooms] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  // Use ref to track current room for snapshot callback
  const currentRoomRef = useRef(null)
  
  // Update ref when currentRoom changes
  useEffect(() => {
    currentRoomRef.current = currentRoom?.id || null
  }, [currentRoom])

  // Load chat rooms (only rooms where user is a member)
  useEffect(() => {
    if (!currentUser) {
      setRooms([])
      setCurrentRoom(null) // Clear current room on logout
      setLoadingRooms(false)
      return
    }

    const roomsRef = collection(db, 'rooms')
    const q = query(roomsRef, where('members', 'array-contains', currentUser.uid))

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const roomsDataPromises = snapshot.docs.map(async (docSnapshot) => {
        const data = docSnapshot.data()
        const roomId = docSnapshot.id
        
        // Never show unread count for currently open room
        if (currentRoomRef.current === roomId) {
          return {
            id: roomId,
            ...data,
            unreadCount: 0
          }
        }
        
        // Calculate unread count by counting messages after lastSeen
        let unreadCount = 0
        try {
          const lastSeenTime = data.lastSeen?.[currentUser.uid]?.toDate?.() || new Date(0)
          const messagesRef = collection(db, 'rooms', roomId, 'messages')
          const unreadQuery = query(
            messagesRef, 
            where('createdAt', '>', lastSeenTime)
          )
          const unreadSnapshot = await getDocs(unreadQuery)
          // Count only messages not sent by current user
          unreadCount = unreadSnapshot.docs.filter(doc => doc.data().userId !== currentUser.uid).length
        } catch (error) {
          console.log('Could not fetch unread count:', error)
        }
        
        return {
          id: roomId,
          ...data,
          unreadCount
        }
      })
      
      const roomsData = await Promise.all(roomsDataPromises)
      
      // Sort by lastMessageAt (newest first)
      roomsData.sort((a, b) => {
        const timeA = a.lastMessageAt?.toDate?.() || a.createdAt?.toDate?.() || new Date(0)
        const timeB = b.lastMessageAt?.toDate?.() || b.createdAt?.toDate?.() || new Date(0)
        return timeB - timeA
      })
      
      setRooms(roomsData)
      setLoadingRooms(false)

      // Don't auto-select any room - let user choose from the list
    }, (error) => {
      console.error('Error loading rooms:', error)
      toast.error('Failed to load chat rooms')
      setLoadingRooms(false)
    })

    return unsubscribe
  }, [currentUser])

  // Clear unread count for currently open room and update lastSeen when leaving
  useEffect(() => {
    if (currentRoom?.id) {
      setRooms(prevRooms =>
        prevRooms.map(room =>
          room.id === currentRoom.id
            ? { ...room, unreadCount: 0 }
            : room
        )
      )
    }
    
    // Cleanup: Update lastSeen when leaving this room
    return () => {
      if (currentRoom?.id && currentUser) {
        const roomRef = doc(db, 'rooms', currentRoom.id)
        // Use current time + 1 second to ensure all messages are marked as seen
        const markAsSeenTime = new Date(Date.now() + 1000)
        setDoc(roomRef, {
          lastSeen: {
            [currentUser.uid]: markAsSeenTime
          }
        }, { merge: true }).catch(error => {
          console.log('Could not update lastSeen on room exit:', error)
        })
      }
    }
  }, [currentRoom?.id, currentUser])

  // Load messages for current room
  useEffect(() => {
    if (!currentRoom) {
      setMessages([])
      setLoadingMessages(false)
      return
    }

    // Only show loading when switching rooms, not on message updates
    const currentRoomId = currentRoom.id
    setLoadingMessages(true)
    
    const messagesRef = collection(db, 'rooms', currentRoomId, 'messages')
    const q = query(messagesRef, orderBy('createdAt', 'asc'))

    let firstLoad = true
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setMessages(messagesData)
      
      // Turn off loading only after first snapshot
      if (firstLoad) {
        firstLoad = false
        setLoadingMessages(false)
      }
      
      // Update lastSeen to mark all messages as seen
      // Use a timestamp that's guaranteed to be after all current messages
      if (currentUser && currentRoomId && messagesData.length > 0) {
        // Get the latest message timestamp
        const latestMessage = messagesData[messagesData.length - 1]
        const latestTime = latestMessage.createdAt?.toDate?.()
        
        if (latestTime) {
          // Set lastSeen to 1 second after the latest message to ensure all are marked as seen
          const markAsSeenTime = new Date(latestTime.getTime() + 1000)
          
          const roomRef = doc(db, 'rooms', currentRoomId)
          setDoc(roomRef, {
            lastSeen: {
              [currentUser.uid]: markAsSeenTime
            }
          }, { merge: true }).catch(error => {
            console.log('Could not update lastSeen:', error)
          })
        }
      }
    }, (error) => {
      console.error('Error loading messages:', error)
      toast.error('Failed to load messages')
      setLoadingMessages(false)
    })

    return () => {
      unsubscribe()
    }
  }, [currentRoom?.id])

  // Track active users in current room
  useEffect(() => {
    if (!currentRoom || !currentUser) {
      setActiveUsers([])
      return
    }

    const activeUsersRef = collection(db, 'rooms', currentRoom.id, 'activeUsers')
    
    // Add current user as active
    const userRef = doc(db, 'rooms', currentRoom.id, 'activeUsers', currentUser.uid)
    setDoc(userRef, {
      userName: currentUser.displayName,
      userPhoto: currentUser.photoURL,
      joinedAt: serverTimestamp(),
      lastSeen: serverTimestamp()
    }).catch(err => console.error('Error setting active user:', err))

    // Listen to active users
    const q = query(activeUsersRef, orderBy('joinedAt', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setActiveUsers(users)
    })

    // Cleanup: Remove from active users
    return () => {
      setDoc(userRef, {
        userName: currentUser.displayName,
        userPhoto: currentUser.photoURL,
        leftAt: serverTimestamp()
      }, { merge: true }).catch(err => console.error('Error updating user status:', err))

      unsubscribe()
    }
  }, [currentRoom, currentUser])

  // Generate unique invite code
  const generateInviteCode = () => {
    return Math.random().toString(36).substring(2, 10).toUpperCase()
  }

  // Create a new room
  const createRoom = async (roomName, description = '', isPrivate = true) => {
    if (!currentUser) {
      toast.error('You must be logged in to create a room')
      return
    }

    if (!roomName.trim()) {
      toast.error('Room name is required')
      return
    }

    try {
      const inviteCode = generateInviteCode()
      const roomsRef = collection(db, 'rooms')
      const newRoom = await addDoc(roomsRef, {
        name: roomName.trim(),
        description: description.trim(),
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName,
        createdAt: serverTimestamp(),
        isPrivate: isPrivate,
        inviteCode: inviteCode,
        members: [currentUser.uid],
        admins: [currentUser.uid],
        memberCount: 1,
        lastSeen: {
          [currentUser.uid]: serverTimestamp()
        }
      })

      toast.success(`Room created! Invite code: ${inviteCode}`)
      
      // Switch to the new room
      setCurrentRoom({
        id: newRoom.id,
        name: roomName,
        description,
        createdBy: currentUser.uid,
        createdByName: currentUser.displayName,
        isPrivate,
        inviteCode,
        members: [currentUser.uid],
        admins: [currentUser.uid]
      })

      return newRoom.id
    } catch (error) {
      console.error('Error creating room:', error)
      toast.error('Failed to create room')
      throw error
    }
  }

  // Join room with invite code
  const joinRoomWithCode = async (inviteCode) => {
    if (!currentUser) {
      toast.error('You must be logged in to join a room')
      return
    }

    if (!inviteCode.trim()) {
      toast.error('Invite code is required')
      return
    }

    try {
      // Find room by invite code
      const roomsRef = collection(db, 'rooms')
      const q = query(roomsRef, where('inviteCode', '==', inviteCode.trim().toUpperCase()))
      const snapshot = await getDocs(q)

      if (snapshot.empty) {
        toast.error('Invalid invite code')
        return
      }

      const roomDoc = snapshot.docs[0]
      const roomData = roomDoc.data()
      const roomId = roomDoc.id

      // Check if already a member
      if (roomData.members && roomData.members.includes(currentUser.uid)) {
        toast.info('You are already a member of this room')
        setCurrentRoom({ id: roomId, ...roomData })
        return
      }

      // If private room, create join request
      if (roomData.isPrivate) {
        const requestsRef = collection(db, 'rooms', roomId, 'joinRequests')
        const requestQuery = query(requestsRef, where('userId', '==', currentUser.uid))
        const existingRequest = await getDocs(requestQuery)

        if (!existingRequest.empty) {
          toast.info('Your join request is pending approval')
          return
        }

        await addDoc(requestsRef, {
          userId: currentUser.uid,
          userName: currentUser.displayName,
          userPhoto: currentUser.photoURL,
          status: 'pending',
          requestedAt: serverTimestamp()
        })

        toast.success('Join request sent! Waiting for admin approval.')
        return
      }

      // If public room, join directly
      const roomRef = doc(db, 'rooms', roomId)
      await updateDoc(roomRef, {
        members: [...(roomData.members || []), currentUser.uid],
        memberCount: (roomData.memberCount || 0) + 1,
        [`lastSeen.${currentUser.uid}`]: serverTimestamp()
      })

      toast.success('Joined room successfully!')
      setCurrentRoom({ id: roomId, ...roomData, members: [...(roomData.members || []), currentUser.uid] })
    } catch (error) {
      console.error('Error joining room:', error)
      toast.error('Failed to join room')
      throw error
    }
  }

  // Approve join request
  const approveJoinRequest = async (roomId, requestId, userId) => {
    if (!currentUser) return

    try {
      const roomRef = doc(db, 'rooms', roomId)
      const roomSnap = await getDoc(roomRef)
      
      if (!roomSnap.exists()) {
        toast.error('Room not found')
        return
      }

      const roomData = roomSnap.data()

      // Check if current user is admin
      if (!roomData.admins || !roomData.admins.includes(currentUser.uid)) {
        toast.error('Only admins can approve requests')
        return
      }

      // Add user to members
      await updateDoc(roomRef, {
        members: [...(roomData.members || []), userId],
        memberCount: (roomData.memberCount || 0) + 1,
        [`lastSeen.${userId}`]: serverTimestamp()
      })

      // Update request status
      const requestRef = doc(db, 'rooms', roomId, 'joinRequests', requestId)
      await updateDoc(requestRef, {
        status: 'approved',
        approvedBy: currentUser.uid,
        approvedAt: serverTimestamp()
      })

      toast.success('Join request approved!')
    } catch (error) {
      console.error('Error approving request:', error)
      toast.error('Failed to approve request')
    }
  }

  // Reject join request
  const rejectJoinRequest = async (roomId, requestId) => {
    if (!currentUser) return

    try {
      const roomRef = doc(db, 'rooms', roomId)
      const roomSnap = await getDoc(roomRef)
      
      if (!roomSnap.exists()) {
        toast.error('Room not found')
        return
      }

      const roomData = roomSnap.data()

      // Check if current user is admin
      if (!roomData.admins || !roomData.admins.includes(currentUser.uid)) {
        toast.error('Only admins can reject requests')
        return
      }

      // Update request status
      const requestRef = doc(db, 'rooms', roomId, 'joinRequests', requestId)
      await updateDoc(requestRef, {
        status: 'rejected',
        rejectedBy: currentUser.uid,
        rejectedAt: serverTimestamp()
      })

      toast.success('Join request rejected')
    } catch (error) {
      console.error('Error rejecting request:', error)
      toast.error('Failed to reject request')
    }
  }

  // Search rooms
  const searchRooms = async (searchTerm) => {
    if (!searchTerm.trim()) {
      return []
    }

    if (!currentUser) {
      toast.error('You must be logged in to search rooms')
      return []
    }

    try {
      const roomsRef = collection(db, 'rooms')
      const snapshot = await getDocs(roomsRef)
      
      const results = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(room => {
          // Filter by search term
          const matchesSearch = room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            room.description?.toLowerCase().includes(searchTerm.toLowerCase())
          
          // Don't show rooms user is already a member of
          const isNotMember = !room.members || !room.members.includes(currentUser.uid)
          
          return matchesSearch && isNotMember
        })
        .slice(0, 10) // Limit to 10 results

      return results
    } catch (error) {
      console.error('Error searching rooms:', error)
      toast.error('Failed to search rooms')
      return []
    }
  }

  // Send a message
  const sendMessage = async (text, roomId = currentRoom?.id) => {
    if (!currentUser) {
      toast.error('You must be logged in to send messages')
      throw new Error('Not authenticated')
    }

    if (!roomId) {
      toast.error('Please select a room first')
      throw new Error('No room selected')
    }

    if (!text.trim()) {
      return
    }

    // Check if admin-only chat is enabled
    if (currentRoom?.adminOnlyChat) {
      const isAdmin = currentRoom?.admins?.includes(currentUser.uid)
      if (!isAdmin) {
        toast.error('Only admins can send messages in this room')
        throw new Error('Admin only chat')
      }
    }

    try {
      // Send message to messages subcollection
      const messagesRef = collection(db, 'rooms', roomId, 'messages')
      await addDoc(messagesRef, {
        text: text.trim(),
        userId: currentUser.uid,
        userName: currentUser.displayName,
        userPhoto: currentUser.photoURL,
        createdAt: serverTimestamp()
      })

      // Try to update room's last message (don't fail if this doesn't work)
      try {
        const roomRef = doc(db, 'rooms', roomId)
        await setDoc(roomRef, {
          lastMessage: text.trim().substring(0, 50),
          lastMessageAt: serverTimestamp(),
          lastMessageBy: currentUser.displayName
        }, { merge: true })
      } catch (updateError) {
        // Silently fail - message was sent successfully, room update is not critical
        console.log('Could not update room lastMessage:', updateError)
      }

    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
      throw error
    }
  }

  // Set typing status
  const setTyping = async (isTyping, roomId = currentRoom?.id) => {
    if (!currentUser || !roomId) return

    try {
      const typingRef = doc(db, 'rooms', roomId, 'typing', currentUser.uid)
      
      if (isTyping) {
        await setDoc(typingRef, {
          userName: currentUser.displayName,
          timestamp: serverTimestamp()
        })
      } else {
        await setDoc(typingRef, {
          userName: currentUser.displayName,
          timestamp: null
        })
      }
    } catch (error) {
      console.error('Error setting typing status:', error)
    }
  }

  // Join a room
  const joinRoom = (room) => {
    setCurrentRoom(room)
    // lastSeen will be automatically updated when messages load
  }

  // Leave a room
  const leaveRoom = async (roomId) => {
    if (!currentUser) {
      toast.error('You must be logged in')
      throw new Error('Not authenticated')
    }

    try {
      const roomRef = doc(db, 'rooms', roomId)
      const roomSnap = await getDoc(roomRef)
      
      if (!roomSnap.exists()) {
        toast.error('Room not found')
        throw new Error('Room not found')
      }

      const roomData = roomSnap.data()

      // Check if user is the last admin
      if (roomData.admins?.includes(currentUser.uid) && roomData.admins.length === 1) {
        toast.error('You are the last admin. Please assign another admin before leaving.')
        throw new Error('Last admin cannot leave')
      }

      // Remove user from members and admins
      await updateDoc(roomRef, {
        members: arrayRemove(currentUser.uid),
        admins: arrayRemove(currentUser.uid),
        memberCount: (roomData.memberCount || 1) - 1
      })

      // If this is the current room, clear it
      if (currentRoom?.id === roomId) {
        setCurrentRoom(null)
      }

      toast.success('Left room successfully')
    } catch (error) {
      console.error('Error leaving room:', error)
      if (!error.message?.includes('Last admin')) {
        toast.error('Failed to leave room')
      }
      throw error
    }
  }

  const value = {
    rooms,
    currentRoom,
    setCurrentRoom,
    messages,
    typingUsers,
    activeUsers,
    loadingRooms,
    loadingMessages,
    createRoom,
    sendMessage,
    setTyping,
    joinRoom,
    joinRoomWithCode,
    approveJoinRequest,
    rejectJoinRequest,
    searchRooms,
    leaveRoom
  }

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  )
}
