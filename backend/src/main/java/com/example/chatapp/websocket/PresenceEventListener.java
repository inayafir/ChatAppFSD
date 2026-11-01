package com.example.chatapp.websocket;

import java.util.List;
import java.util.Map;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import com.example.chatapp.entity.User;
import com.example.chatapp.service.PresenceService;
import com.example.chatapp.service.UserService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Tracks online users when WebSocket sessions connect and disconnect.
 * The client sends the logged-in username as a STOMP CONNECT header.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PresenceEventListener {

    private final PresenceService presenceService;
    private final UserService userService;

    /**
     * SessionConnectEvent wraps the original CONNECT frame, so the custom
     * "username" header sent by the client is still available here.
     */
    @EventListener
    public void handleSessionConnect(SessionConnectEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = accessor.getSessionId();
        String username = extractUsername(accessor);
        if (username == null) {
            log.debug("Connected session {} has no username header, skipping presence", sessionId);
            return;
        }
        try {
            User user = userService.getByUsername(username);
            presenceService.userConnected(sessionId, user);
            log.debug("User {} connected (session {})", username, sessionId);
        } catch (Exception ex) {
            log.warn("Could not register presence for user {}", username);
        }
    }

    @EventListener
    public void handleSessionDisconnect(SessionDisconnectEvent event) {
        String sessionId = StompHeaderAccessor.wrap(event.getMessage()).getSessionId();
        presenceService.userDisconnected(sessionId);
    }

    /**
     * As soon as a client subscribes to the presence topic it gets the current
     * online list, which avoids missing the broadcast fired during connect.
     */
    @EventListener
    public void handleSubscribe(SessionSubscribeEvent event) {
        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(event.getMessage());
        if (ChatBroadcaster.PRESENCE_TOPIC.equals(accessor.getDestination())) {
            presenceService.broadcastOnlineUsers();
        }
    }

    @SuppressWarnings("unchecked")
    private String extractUsername(StompHeaderAccessor accessor) {
        Object rawHeaders = accessor.getHeader(SimpMessageHeaderAccessor.NATIVE_HEADERS);
        if (!(rawHeaders instanceof Map)) {
            return null;
        }
        Object value = ((Map<String, Object>) rawHeaders).get("username");
        if (value instanceof List<?> list && !list.isEmpty()) {
            value = list.get(0);
        }
        return value == null ? null : value.toString();
    }
}
