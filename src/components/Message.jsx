import { formatDistanceToNow } from 'date-fns'
import { HiClock } from 'react-icons/hi'
import { formatMessage } from '../utils/messageFormatter'

const Message = ({ message, isOwnMessage, showAvatar }) => {
  // Extract first name from full name (e.g., "2311CS020607- SEELAM KARTHIK" -> "SEELAM")
  const getDisplayName = (fullName) => {
    if (!fullName) return 'User'
    // Remove any ID prefix and get the actual name
    const namePart = fullName.split('-').pop().trim()
    // Get first word/name
    return namePart.split(' ')[0]
  }

  // Handle system messages (join/leave)
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gray-800 text-gray-300 text-sm px-4 py-2 rounded-full border border-gray-700">
          <span className="font-semibold text-blue-400">{getDisplayName(message.userName)}</span>
          {' '}
          {message.action === 'joined' ? 'joined the room' : 'left the room'}
        </div>
      </div>
    )
  }

  const formattedText = formatMessage(message.text)

  return (
    <div id={`message-${message.id}`} className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} mb-0.5 message-enter`}>
      <div className={`flex-1 max-w-[80%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
        {showAvatar && !isOwnMessage && (
          <span className="text-xs font-semibold text-gray-400 mb-1 ml-2">{getDisplayName(message.userName)}</span>
        )}
        <div className={`relative px-3 py-2 rounded-lg shadow-md ${isOwnMessage ? 'bg-gradient-to-r from-green-600 to-green-700 text-white rounded-br-sm' : 'bg-gray-800/90 text-gray-100 rounded-bl-sm border border-gray-700/50'}`}>
          <div className="message-content break-words text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedText }} />
          <div className="flex items-center justify-end gap-1 mt-1">
            <span className={`text-[10px] ${isOwnMessage ? 'text-green-100' : 'text-gray-500'}`}>
              {message.createdAt ? new Date(message.createdAt.toDate()).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}
            </span>
            {isOwnMessage && (
              <svg className="w-4 h-4 text-blue-200" viewBox="0 0 16 15" fill="none">
                <path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" fill="currentColor"/>
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Message
