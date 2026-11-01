package com.example.chatapp.service;

import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

import com.example.chatapp.dto.UserResponse;
import com.example.chatapp.entity.User;
import com.example.chatapp.websocket.ChatBroadcaster;

import lombok.RequiredArgsConstructor;

/**
 * Keeps track of which users currently have an open WebSocket session.
 */
@Service
@RequiredArgsConstructor
public class PresenceService {

    private final Map<String, User> sessions = new ConcurrentHashMap<>();
    private final ChatBroadcaster broadcaster;

    public void userConnected(String sessionId, User user) {
        sessions.put(sessionId, user);
        broadcastOnlineUsers();
    }

    public void userDisconnected(String sessionId) {
        if (sessions.remove(sessionId) != null) {
            broadcastOnlineUsers();
        }
    }

    public List<UserResponse> getOnlineUsers() {
        Map<Long, User> uniqueUsers = new LinkedHashMap<>();
        sessions.values().forEach(user -> uniqueUsers.putIfAbsent(user.getId(), user));
        return uniqueUsers.values().stream()
                .sorted(Comparator.comparing(User::getUsername, String.CASE_INSENSITIVE_ORDER))
                .map(user -> new UserResponse(user.getId(), user.getUsername(), user.getAvatarColor()))
                .toList();
    }

    /**
     * Re-broadcasts the current list; called on every presence subscribe so
     * a newly connected client immediately receives the up-to-date state.
     */
    public void broadcastOnlineUsers() {
        broadcaster.broadcastPresence(getOnlineUsers());
    }
}
