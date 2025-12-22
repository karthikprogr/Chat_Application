import { useState } from 'react'
import { HiX, HiSearch } from 'react-icons/hi'

const emojiCategories = {
  'Smileys': ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳'],
  'Gestures': ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'],
  'Hearts': ['❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔', '❤️‍🔥', '❤️‍🩹', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'],
  'Objects': ['💬', '💭', '🗨️', '🗯️', '💤', '💢', '💥', '💫', '💦', '💨', '🕳️', '💣', '💬', '👁️‍🗨️', '🗨️', '🗯️', '💭', '🗯️'],
  'Symbols': ['✅', '❌', '❎', '✔️', '☑️', '✖️', '❗', '❓', '⭐', '🌟', '💯', '🔥', '⚡', '💪', '🚀', '🎉', '🎊', '🎈'],
}

const EmojiPicker = ({ onSelect, onClose }) => {
  const [activeCategory, setActiveCategory] = useState('Smileys')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredEmojis = searchTerm
    ? Object.values(emojiCategories).flat().filter(emoji => emoji.includes(searchTerm))
    : emojiCategories[activeCategory]

  return (
    <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-2xl border border-gray-200 z-50 w-80">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Emojis</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
          <HiX className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {/* Search */}
      <div className="p-2">
        <div className="relative">
          <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search emojis..."
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories */}
      {!searchTerm && (
        <div className="flex gap-1 px-2 pb-2 overflow-x-auto">
          {Object.keys(emojiCategories).map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
                activeCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      {/* Emoji Grid */}
      <div className="p-2 grid grid-cols-8 gap-1 max-h-64 overflow-y-auto">
        {filteredEmojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => {
              onSelect(emoji)
              onClose()
            }}
            className="text-2xl hover:bg-gray-100 rounded p-1 transition-transform hover:scale-125"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>

      {filteredEmojis.length === 0 && (
        <div className="p-4 text-center text-gray-500 text-sm">
          No emojis found
        </div>
      )}
    </div>
  )
}

export default EmojiPicker
