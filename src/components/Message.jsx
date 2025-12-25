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
    <div id={`message-${message.id}`} className={`flex gap-2 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} mb-1 message-enter`}>
      <div className={`flex-1 max-w-[85%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
        {showAvatar && !isOwnMessage && (
          <span className="text-xs font-semibold text-gray-400 mb-1 ml-3">{getDisplayName(message.userName)}</span>
        )}
        <div className={`relative px-3 py-2 rounded-lg ${isOwnMessage ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-100 rounded-bl-none'}`}>
          <div className="message-content break-words text-sm" dangerouslySetInnerHTML={{ __html: formattedText }} />
          {message.createdAt && (
            <span className={`text-[10px] mt-1 block text-right ${isOwnMessage ? 'text-blue-200' : 'text-gray-500'}`}>
              {formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true }).replace('about ', '')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default Message
