import { formatDistanceToNow } from 'date-fns'
import { HiClock } from 'react-icons/hi'
import { formatMessage } from '../utils/messageFormatter'

const Message = ({ message, isOwnMessage, showAvatar }) => {
  // Handle system messages (join/leave)
  if (message.type === 'system') {
    return (
      <div className="flex justify-center my-2">
        <div className="bg-gray-800 text-gray-300 text-sm px-4 py-2 rounded-full border border-gray-700">
          <span className="font-semibold text-blue-400">{message.userName}</span>
          {' '}
          {message.action === 'joined' ? 'joined the room' : 'left the room'}
        </div>
      </div>
    )
  }

  const formattedText = formatMessage(message.text)

  return (
    <div id={`message-${message.id}`} className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} message-enter`}>
      {showAvatar && (
        <div className="flex-shrink-0">
          {message.userPhoto ? (
            <img src={message.userPhoto} alt={message.userName} className="w-10 h-10 rounded-full border-2 border-gray-700" />
          ) : (
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
              {message.userName?.[0]?.toUpperCase() || 'U'}
            </div>
          )}
        </div>
      )}
      {!showAvatar && <div className="w-10 flex-shrink-0" />}
      <div className={`flex-1 max-w-xl ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col`}>
        {showAvatar && (
          <div className={`flex items-center gap-2 mb-1 ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
            <span className="text-sm font-bold text-white">{isOwnMessage ? 'You' : message.userName}</span>
            {message.createdAt && (
              <span className="text-xs text-gray-400 flex items-center gap-1">
                <HiClock className="w-3 h-3" />
                {formatDistanceToNow(message.createdAt.toDate(), { addSuffix: true })}
              </span>
            )}
          </div>
        )}
        <div className={`relative px-4 py-3 rounded-2xl shadow-lg ${isOwnMessage ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white' : 'bg-gray-800 border border-gray-700 text-gray-100'}`}>
          <div className="message-content break-words" dangerouslySetInnerHTML={{ __html: formattedText }} />
          <div className={`absolute top-0 ${isOwnMessage ? 'right-0 -mr-2' : 'left-0 -ml-2'}`}>
            <svg width="12" height="20" viewBox="0 0 12 20" className={isOwnMessage ? 'text-blue-600' : 'text-gray-800'}>
              <path d={isOwnMessage ? 'M12 0v20L0 0h12z' : 'M0 0v20l12-20H0z'} fill="currentColor" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Message
