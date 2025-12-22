/**
 * Format message text with basic markdown-like syntax
 * Supports: bold (**text**), italic (*text*), and links
 */
export const formatMessage = (text) => {
  if (!text) return ''

  let formatted = escapeHtml(text)

  // Convert URLs to clickable links
  formatted = formatted.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="underline hover:text-blue-400">$1</a>'
  )

  // Convert **text** to bold
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')

  // Convert *text* to italic
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>')

  // Convert line breaks
  formatted = formatted.replace(/\n/g, '<br>')

  return formatted
}

/**
 * Escape HTML to prevent XSS attacks
 */
const escapeHtml = (text) => {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * Validate message before sending
 */
export const validateMessage = (text) => {
  if (!text || !text.trim()) {
    return { valid: false, error: 'Message cannot be empty' }
  }

  if (text.length > 5000) {
    return { valid: false, error: 'Message is too long (max 5000 characters)' }
  }

  return { valid: true }
}

/**
 * Extract mentions from message (e.g., @username)
 */
export const extractMentions = (text) => {
  const mentionRegex = /@(\w+)/g
  const mentions = []
  let match

  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1])
  }

  return mentions
}
