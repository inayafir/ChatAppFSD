import { useEffect, useRef } from 'react'
import EmptyState from './EmptyState'
import MessageItem from './MessageItem'
import Spinner from './Spinner'

const GROUP_WINDOW_MS = 5 * 60 * 1000

export default function MessageList({ messages, loading, channel, currentUserId, onDelete }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (loading) {
    return <Spinner label="Loading messages..." />
  }

  if (messages.length === 0) {
    return (
      <EmptyState
        icon="💬"
        title={`Welcome to #${channel?.name || 'this channel'}!`}
        subtitle="This is the start of the conversation. Send the first message."
      />
    )
  }

  return (
    <div className="h-full overflow-y-auto px-2 pb-4 pt-2">
      <ul className="mx-auto max-w-3xl">
        {messages.map((message, index) => {
          const previous = messages[index - 1]
          const grouped =
            previous &&
            previous.senderId === message.senderId &&
            new Date(message.createdAt) - new Date(previous.createdAt) < GROUP_WINDOW_MS
          return (
            <MessageItem
              key={message.id}
              message={message}
              own={message.senderId === currentUserId}
              grouped={Boolean(grouped)}
              onDelete={onDelete}
            />
          )
        })}
      </ul>
      <div ref={bottomRef} />
    </div>
  )
}
