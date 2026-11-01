import { useEffect, useRef, useState } from 'react'
import ChannelHeader from '../components/ChannelHeader'
import ChannelSidebar from '../components/ChannelSidebar'
import CreateChannelModal from '../components/CreateChannelModal'
import EmptyState from '../components/EmptyState'
import MessageInput from '../components/MessageInput'
import MessageList from '../components/MessageList'
import OnlineUsers from '../components/OnlineUsers'
import Spinner from '../components/Spinner'
import TypingIndicator from '../components/TypingIndicator'
import useWebSocket from '../hooks/useWebSocket'
import {
  deleteChannel,
  deleteMessage,
  getChannels,
  getMessages,
  getOnlineUsers,
} from '../api/chatApi'
import { extractErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const TYPING_LINGER_MS = 3000
const TYPING_THROTTLE_MS = 2000

export default function ChatPage() {
  const { user, setUser } = useAuth()
  const showToast = useToast()

  const [channels, setChannels] = useState([])
  const [channelsLoading, setChannelsLoading] = useState(true)
  const [activeChannelId, setActiveChannelId] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const [messages, setMessages] = useState([])
  const [messagesLoading, setMessagesLoading] = useState(false)
  const [countDelta, setCountDelta] = useState(0)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [typingNames, setTypingNames] = useState([])

  const requestSeqRef = useRef(0)
  const activeChannelRef = useRef(null)
  const channelsRef = useRef([])
  const typingTimersRef = useRef({})
  const lastTypingSentRef = useRef(0)
  const messageIdsRef = useRef(new Set())

  activeChannelRef.current = activeChannelId
  channelsRef.current = channels

  useEffect(() => {
    messageIdsRef.current = new Set(messages.map((message) => message.id))
  }, [messages])

  useEffect(() => {
    document.title = 'ChatApp'
  }, [])

  /* ---------------- real-time events ---------------- */

  function handleLiveMessage(message) {
    if (message.senderId !== user.id) {
      const timers = typingTimersRef.current
      if (timers[message.senderName]) {
        clearTimeout(timers[message.senderName])
        delete timers[message.senderName]
        setTypingNames(Object.keys(timers))
      }
    }
    if (message.channelId !== activeChannelRef.current) return
    if (messageIdsRef.current.has(message.id)) return
    messageIdsRef.current.add(message.id)
    setMessages((current) =>
      current.some((existing) => existing.id === message.id) ? current : [...current, message],
    )
    setCountDelta((delta) => delta + 1)
  }

  function handleMessageDeleted(event) {
    if (event.channelId === activeChannelRef.current) {
      setCountDelta((delta) => delta - 1)
    }
    setMessages((current) => current.filter((message) => message.id !== event.messageId))
  }

  function handleTyping(payload) {
    if (!payload?.typing || payload.username === user.username) return
    if (payload.channelId !== activeChannelRef.current) return

    const timers = typingTimersRef.current
    const name = payload.username
    if (timers[name]) clearTimeout(timers[name])
    timers[name] = setTimeout(() => {
      delete timers[name]
      setTypingNames(Object.keys(timers))
    }, TYPING_LINGER_MS)
    setTypingNames(Object.keys(timers))
  }

  function handlePresence(payload) {
    if (Array.isArray(payload.onlineUsers)) {
      setOnlineUsers(payload.onlineUsers)
    }
  }

  function handleChannelEvent(event) {
    if (event.type === 'CHANNEL_CREATED') {
      setChannels((current) =>
        current.some((existing) => existing.id === event.channel.id)
          ? current
          : [...current, event.channel],
      )
    } else if (event.type === 'CHANNEL_DELETED') {
      const remaining = channelsRef.current.filter((channel) => channel.id !== event.channel.id)
      setChannels(remaining)
      if (activeChannelRef.current === event.channel.id) {
        setActiveChannelId(remaining.length > 0 ? remaining[0].id : null)
      }
    }
  }

  const { connected, sendMessage, sendTyping } = useWebSocket({
    activeChannelId,
    onMessage: handleLiveMessage,
    onMessageDeleted: handleMessageDeleted,
    onTyping: handleTyping,
    onPresence: handlePresence,
    onChannelEvent: handleChannelEvent,
  })

  /* ---------------- data loading ---------------- */

  useEffect(() => {
    let cancelled = false
    getChannels()
      .then((list) => {
        if (cancelled) return
        setChannels(list)
        setActiveChannelId((current) => {
          if (current != null && list.some((channel) => channel.id === current)) return current
          return list.length > 0 ? list[0].id : null
        })
      })
      .catch((error) => {
        if (!cancelled) showToast(extractErrorMessage(error))
      })
      .finally(() => {
        if (!cancelled) setChannelsLoading(false)
      })

    getOnlineUsers()
      .then((users) => !cancelled && setOnlineUsers(users))
      .catch(() => {
        // WebSocket presence updates will fill this in
      })

    return () => {
      cancelled = true
    }
  }, [showToast])

  useEffect(() => {
    Object.values(typingTimersRef.current).forEach(clearTimeout)
    typingTimersRef.current = {}
    setTypingNames([])

    if (activeChannelId == null) {
      setMessages([])
      return undefined
    }

    const requestId = ++requestSeqRef.current
    setMessages([])
    setCountDelta(0)
    setMessagesLoading(true)

    getMessages(activeChannelId)
      .then((history) => {
        if (requestId !== requestSeqRef.current) return
        setMessages((current) => {
          const historyIds = new Set(history.map((message) => message.id))
          const liveExtras = current.filter(
            (message) => message.channelId === activeChannelId && !historyIds.has(message.id),
          )
          return [...history, ...liveExtras]
        })
      })
      .catch((error) => {
        if (requestId === requestSeqRef.current) showToast(extractErrorMessage(error))
      })
      .finally(() => {
        if (requestId === requestSeqRef.current) setMessagesLoading(false)
      })

    return undefined
  }, [activeChannelId, showToast])

  /* ---------------- actions ---------------- */

  function handleSend(content) {
    const sent = sendMessage(activeChannelRef.current, content, user.id)
    if (!sent) {
      showToast('Not connected to the chat yet. Please wait...')
      return
    }
    // A fresh typing burst should announce itself right after sending.
    lastTypingSentRef.current = 0
  }

  function handleTypingKeystroke() {
    const now = Date.now()
    if (now - lastTypingSentRef.current < TYPING_THROTTLE_MS) return
    lastTypingSentRef.current = now
    sendTyping(activeChannelRef.current, user.username)
  }

  async function handleDeleteMessage(message) {
    try {
      await deleteMessage(message.id, user.id)
      setMessages((current) => current.filter((existing) => existing.id !== message.id))
    } catch (error) {
      showToast(extractErrorMessage(error))
    }
  }

  function handleChannelCreated(channel) {
    setChannels((current) =>
      current.some((existing) => existing.id === channel.id) ? current : [...current, channel],
    )
    setActiveChannelId(channel.id)
  }

  async function handleChannelDelete(channel) {
    const confirmed = window.confirm(`Delete #${channel.name} and all of its messages?`)
    if (!confirmed) return
    try {
      await deleteChannel(channel.id)
      const remaining = channels.filter((existing) => existing.id !== channel.id)
      setChannels(remaining)
      if (activeChannelId === channel.id) {
        setActiveChannelId(remaining.length > 0 ? remaining[0].id : null)
      }
    } catch (error) {
      showToast(extractErrorMessage(error))
    }
  }

  const activeChannel = channels.find((channel) => channel.id === activeChannelId) || null
  const displayMessageCount = activeChannel
    ? Math.max(0, activeChannel.messageCount + countDelta)
    : 0

  return (
    <div className="flex h-full overflow-hidden">
      <ChannelSidebar
        channels={channels}
        activeChannelId={activeChannelId}
        onSelectChannel={setActiveChannelId}
        onCreateClick={() => setShowCreateModal(true)}
        onDeleteChannel={handleChannelDelete}
        loading={channelsLoading}
        user={user}
        onLogout={() => setUser(null)}
      />

      <main className="flex min-w-0 flex-1 flex-col bg-[#313338]">
        <ChannelHeader
          channel={activeChannel}
          messageCount={displayMessageCount}
          connected={connected}
        />

        <div className="min-h-0 flex-1">
          {channelsLoading ? (
            <Spinner label="Loading channels..." />
          ) : !activeChannel ? (
            <EmptyState
              icon="#"
              title="No channel selected"
              subtitle="Pick a channel from the sidebar or create a new one."
            />
          ) : (
            <MessageList
              messages={messages}
              loading={messagesLoading}
              channel={activeChannel}
              currentUserId={user.id}
              onDelete={handleDeleteMessage}
            />
          )}
        </div>

        <TypingIndicator usernames={typingNames} />

        <MessageInput
          channel={activeChannel}
          disabled={!connected || !activeChannel}
          onSend={handleSend}
          onTyping={handleTypingKeystroke}
        />
      </main>

      <OnlineUsers users={onlineUsers} currentUserId={user.id} />

      {showCreateModal && (
        <CreateChannelModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleChannelCreated}
        />
      )}
    </div>
  )
}
