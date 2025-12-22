// Request notification permission
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('Browser does not support notifications')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

// Show desktop notification
export const showNotification = (title, options = {}) => {
  if (Notification.permission === 'granted' && document.hidden) {
    try {
      const notification = new Notification(title, {
        icon: '/vite.svg',
        badge: '/vite.svg',
        vibrate: [200, 100, 200],
        ...options
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000)

      return notification
    } catch (error) {
      console.error('Error showing notification:', error)
    }
  }
  return null
}

// Play notification sound
export const playNotificationSound = () => {
  try {
    const audio = new Audio('data:audio/wav;base64,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')
    audio.volume = 0.3
    audio.play().catch(err => console.log('Could not play sound:', err))
  } catch (error) {
    console.error('Error playing sound:', error)
  }
}

// Update page title with unread count
export const updatePageTitle = (unreadCount) => {
  const baseTitle = 'ChatApp'
  if (unreadCount > 0) {
    document.title = `(${unreadCount}) ${baseTitle}`
  } else {
    document.title = baseTitle
  }
}
