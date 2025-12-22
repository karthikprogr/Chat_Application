import { createContext, useContext, useState, useEffect } from 'react'
import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword,
  EmailAuthProvider,
  linkWithCredential,
  reauthenticateWithCredential
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs, updateDoc } from 'firebase/firestore'
import { auth, googleProvider, db } from '../firebase/config'
import { toast } from 'react-toastify'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if username is available
  const checkUsernameAvailable = async (username) => {
    if (!username || username.trim().length < 3) {
      return { available: false, message: 'Username must be at least 3 characters' }
    }

    const usersRef = collection(db, 'users')
    const q = query(usersRef, where('displayName', '==', username.trim()))
    const snapshot = await getDocs(q)
    
    if (snapshot.empty) {
      return { available: true, message: 'Username is available' }
    } else {
      return { available: false, message: 'Username is already taken' }
    }
  }

  // Create user document in Firestore
  const createUserDocument = async (user, additionalData = {}) => {
    if (!user) return

    const userRef = doc(db, 'users', user.uid)
    const snapshot = await getDoc(userRef)

    if (!snapshot.exists()) {
      const { email, displayName, photoURL } = user
      const createdAt = serverTimestamp()

      try {
        await setDoc(userRef, {
          displayName: displayName || additionalData.displayName || 'Anonymous User',
          email,
          photoURL: photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName || email)}&background=random`,
          createdAt,
          lastSeen: serverTimestamp(),
          isOnline: true,
          ...additionalData
        })
      } catch (error) {
        console.error('Error creating user document:', error)
        toast.error('Error creating user profile')
      }
    } else {
      // Update last seen
      try {
        await setDoc(userRef, {
          lastSeen: serverTimestamp(),
          isOnline: true
        }, { merge: true })
      } catch (error) {
        console.error('Error updating user status:', error)
      }
    }
  }

  // Sign up with email and password
  const signup = async (email, password, displayName) => {
    try {
      // Check username availability first
      const usernameCheck = await checkUsernameAvailable(displayName)
      if (!usernameCheck.available) {
        toast.error(usernameCheck.message)
        throw new Error(usernameCheck.message)
      }

      const result = await createUserWithEmailAndPassword(auth, email, password)
      
      // Update user profile
      await updateProfile(result.user, {
        displayName: displayName.trim()
      })

      // Create user document
      await createUserDocument(result.user, { displayName: displayName.trim() })
      
      toast.success('Account created successfully!')
      return result.user
    } catch (error) {
      console.error('Signup error:', error)
      switch (error.code) {
        case 'auth/email-already-in-use':
          toast.error('Email already in use')
          break
        case 'auth/weak-password':
          toast.error('Password should be at least 6 characters')
          break
        case 'auth/invalid-email':
          toast.error('Invalid email address')
          break
        default:
          toast.error('Failed to create account')
      }
      throw error
    }
  }

  // Login with email and password
  const login = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password)
      await createUserDocument(result.user)
      toast.success('Welcome back!')
      return result.user
    } catch (error) {
      console.error('Login error:', error)
      switch (error.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          toast.error('Invalid email or password')
          break
        case 'auth/invalid-email':
          toast.error('Invalid email address')
          break
        case 'auth/user-disabled':
          toast.error('This account has been disabled')
          break
        default:
          toast.error('Failed to login')
      }
      throw error
    }
  }

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider)
      await createUserDocument(result.user)
      
      // Check if user needs to set password (Google users don't have password by default)
      const providerData = result.user.providerData
      const hasPassword = providerData.some(provider => provider.providerId === 'password')
      
      if (!hasPassword) {
        // Store flag to show password setup modal
        sessionStorage.setItem('needsPasswordSetup', 'true')
      }
      
      toast.success('Welcome!')
      return result.user
    } catch (error) {
      console.error('Google login error:', error)
      switch (error.code) {
        case 'auth/popup-closed-by-user':
          toast.error('Sign-in cancelled')
          break
        case 'auth/popup-blocked':
          toast.error('Popup blocked. Please allow popups for this site')
          break
        default:
          toast.error('Failed to sign in with Google')
      }
      throw error
    }
  }

  // Set password for Google users
  const setPasswordForGoogleUser = async (newPassword) => {
    try {
      if (!currentUser) {
        throw new Error('No user logged in')
      }

      const credential = EmailAuthProvider.credential(currentUser.email, newPassword)
      await linkWithCredential(currentUser, credential)
      
      // Update user document
      const userRef = doc(db, 'users', currentUser.uid)
      await updateDoc(userRef, {
        hasPassword: true,
        updatedAt: serverTimestamp()
      })
      
      sessionStorage.removeItem('needsPasswordSetup')
      toast.success('Password set successfully!')
      return true
    } catch (error) {
      console.error('Set password error:', error)
      if (error.code === 'auth/provider-already-linked') {
        toast.error('Password already set for this account')
      } else {
        toast.error('Failed to set password')
      }
      throw error
    }
  }

  // Send password reset email (OTP)
  const sendPasswordReset = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email)
      toast.success('Password reset email sent! Check your inbox.')
      return true
    } catch (error) {
      console.error('Password reset error:', error)
      switch (error.code) {
        case 'auth/user-not-found':
          toast.error('No account found with this email')
          break
        case 'auth/invalid-email':
          toast.error('Invalid email address')
          break
        default:
          toast.error('Failed to send reset email')
      }
      throw error
    }
  }

  // Change password (requires current password)
  const changePassword = async (currentPassword, newPassword) => {
    try {
      if (!currentUser || !currentUser.email) {
        throw new Error('No user logged in')
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(currentUser.email, currentPassword)
      await reauthenticateWithCredential(currentUser, credential)
      
      // Update password
      await updatePassword(currentUser, newPassword)
      
      // Update user document
      const userRef = doc(db, 'users', currentUser.uid)
      await updateDoc(userRef, {
        passwordChangedAt: serverTimestamp()
      })
      
      toast.success('Password changed successfully!')
      return true
    } catch (error) {
      console.error('Change password error:', error)
      switch (error.code) {
        case 'auth/wrong-password':
          toast.error('Current password is incorrect')
          break
        case 'auth/weak-password':
          toast.error('New password should be at least 6 characters')
          break
        case 'auth/requires-recent-login':
          toast.error('Please login again to change password')
          break
        default:
          toast.error('Failed to change password')
      }
      throw error
    }
  }

  // Logout
  const logout = async () => {
    try {
      // Set logout flag to prevent leave messages
      sessionStorage.setItem('isLoggingOut', 'true')
      
      if (currentUser) {
        // Update online status
        const userRef = doc(db, 'users', currentUser.uid)
        await setDoc(userRef, {
          isOnline: false,
          lastSeen: serverTimestamp()
        }, { merge: true })
      }
      
      await signOut(auth)
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to logout')
      throw error
    }
  }

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await createUserDocument(user)
      }
      setCurrentUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  // Update online status on window close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentUser) {
        const userRef = doc(db, 'users', currentUser.uid)
        setDoc(userRef, {
          isOnline: false,
          lastSeen: serverTimestamp()
        }, { merge: true })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [currentUser])

  const value = {
    currentUser,
    signup,
    login,
    loginWithGoogle,
    logout,
    loading,
    checkUsernameAvailable,
    setPasswordForGoogleUser,
    sendPasswordReset,
    changePassword
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}
