import Avatar from './Avatar'

function formatTimestamp(createdAt) {
  const date = new Date(createdAt)
  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (sameDay) return time
  return `${date.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric' })} ${time}`
}

export default function MessageItem({ message, own, grouped, onDelete }) {
  return (
    <li className={`group flex gap-3 rounded-md px-4 transition-colors hover:bg-black/10 ${grouped ? 'py-0.5' : 'mt-3 py-0.5'}`}>
      <div className="w-9 flex-shrink-0">
        {!grouped && (
          <Avatar name={message.senderName} color={message.senderAvatarColor} />
        )}
      </div>

      <div className="min-w-0 flex-1">
        {!grouped && (
          <div className="mb-0.5 flex items-baseline gap-2">
            <span
              className="cursor-pointer text-sm font-semibold hover:underline"
              style={{ color: message.senderAvatarColor }}
            >
              {message.senderName}
            </span>
            <span className="text-[11px] text-gray-500">{formatTimestamp(message.createdAt)}</span>
          </div>
        )}
        <p className="whitespace-pre-wrap break-words text-[15px] leading-6 text-[#dbdee1]">
          {message.content}
        </p>
      </div>

      {own && (
        <button
          type="button"
          onClick={() => onDelete(message)}
          title="Delete message"
          className="mt-0.5 h-7 w-7 flex-shrink-0 self-start rounded-md bg-[#2b2d31] text-xs text-gray-400 opacity-0 shadow-sm ring-1 ring-black/40 transition-all hover:text-[#f23f43] focus:opacity-100 group-hover:opacity-100"
        >
          🗑
        </button>
      )}
    </li>
  )
}
