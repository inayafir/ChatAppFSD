import { useCallback, useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'

/**
 * One reusable WebSocket (STOMP over SockJS) connection for the whole app.
 *
 * - Connects once per logged-in user, auto-reconnects on failure.
 * - Subscribes to presence + channel-list topics.
 * - Re-subscribes to the active channel's topics whenever it changes
 *   (and after every reconnect), always unsubscribing the previous ones
 *   so events are never handled twice.
 * - Handlers are kept in a ref so changing them never rebuilds the connection.
 */
export default function useWebSocket({ activeChannelId, onMessage, onMessageDeleted, onTyping, onPresence, onChannelEvent }) {
  const { user } = useAuth()
  const [connected, setConnected] = useState(false)

  const clientRef = useRef(null)
  const subsRef = useRef([])
  const activeChannelRef = useRef(activeChannelId)
  const handlersRef = useRef({ onMessage, onMessageDeleted, onTyping, onPresence, onChannelEvent })

  activeChannelRef.current = activeChannelId
  handlersRef.current = { onMessage, onMessageDeleted, onTyping, onPresence, onChannelEvent }

  const applySubscriptions = useCallback(() => {
    const client = clientRef.current
    if (!client || !client.connected) return

    subsRef.current.forEach((subscription) => {
      try {
        subscription.unsubscribe()
      } catch {
        // session may already be closed
      }
    })
    subsRef.current = []

    const parse = (raw) => {
      try {
        return JSON.parse(raw.body)
      } catch {
        return null
      }
    }
    // Handlers are read at event time so state closures never go stale.

    subsRef.current.push(
      client.subscribe('/topic/presence', (raw) => {
        const payload = parse(raw)
        if (payload) handlersRef.current.onPresence?.(payload)
      }),
    )
    subsRef.current.push(
      client.subscribe('/topic/channels', (raw) => {
        const payload = parse(raw)
        if (payload) handlersRef.current.onChannelEvent?.(payload)
      }),
    )

    const channelId = activeChannelRef.current
    if (channelId != null) {
      subsRef.current.push(
        client.subscribe(`/topic/channels/${channelId}`, (raw) => {
          const payload = parse(raw)
          if (payload) handlersRef.current.onMessage?.(payload)
        }),
      )
      subsRef.current.push(
        client.subscribe(`/topic/channels/${channelId}/events`, (raw) => {
          const payload = parse(raw)
          if (payload) handlersRef.current.onMessageDeleted?.(payload)
        }),
      )
      subsRef.current.push(
        client.subscribe(`/topic/channels/${channelId}/typing`, (raw) => {
          const payload = parse(raw)
          if (payload) handlersRef.current.onTyping?.(payload)
        }),
      )
    }
  }, [])

  useEffect(() => {
    if (!user?.username) return undefined

    // Lazy import keeps the SockJS bundle out of the initial page load.
    let cancelled = false

    Promise.all([import('sockjs-client'), import('@stomp/stompjs')]).then(([sockjsModule, stompModule]) => {
      if (cancelled) return
      const SockJS = sockjsModule.default
      const { Client } = stompModule

      const client = new Client({
        webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
        connectHeaders: { username: user.username },
        reconnectDelay: 4000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        debug: () => {},
      })

      client.onConnect = () => {
        setConnected(true)
        applySubscriptions()
      }
      client.onDisconnect = () => {
        setConnected(false)
      }
      client.onStompError = () => {
        setConnected(false)
      }

      clientRef.current = client
      client.activate()
    })

    return () => {
      cancelled = true
      subsRef.current.forEach((subscription) => {
        try {
          subscription.unsubscribe()
        } catch {
          // session may already be closed
        }
      })
      subsRef.current = []
      clientRef.current?.deactivate()
      clientRef.current = null
      setConnected(false)
    }
  }, [user?.username, applySubscriptions])

  // Re-subscribe when the user switches channel.
  useEffect(() => {
    if (connected) {
      applySubscriptions()
    }
  }, [activeChannelId, connected, applySubscriptions])

  const sendMessage = useCallback((channelId, content, senderId) => {
    const client = clientRef.current
    if (!client?.connected || channelId == null) return false
    client.publish({
      destination: `/app/channels/${channelId}/send`,
      body: JSON.stringify({ content, senderId }),
    })
    return true
  }, [])

  const sendTyping = useCallback((channelId, username) => {
    const client = clientRef.current
    if (!client?.connected || channelId == null) return
    client.publish({
      destination: `/app/channels/${channelId}/typing`,
      body: JSON.stringify({ username }),
    })
  }, [])

  return { connected, sendMessage, sendTyping }
}
