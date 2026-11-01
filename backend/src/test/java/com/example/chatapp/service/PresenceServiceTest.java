package com.example.chatapp.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.chatapp.dto.UserResponse;
import com.example.chatapp.entity.User;
import com.example.chatapp.websocket.ChatBroadcaster;

@ExtendWith(MockitoExtension.class)
class PresenceServiceTest {

    @Mock
    private ChatBroadcaster broadcaster;

    private PresenceService presenceService;

    private final User alex = User.builder().id(1L).username("alex").avatarColor("#5865F2").build();
    private final User sam = User.builder().id(2L).username("sam").avatarColor("#EB459E").build();

    @BeforeEach
    void setUp() {
        presenceService = new PresenceService(broadcaster);
    }

    @Test
    void connectAddsUserAndBroadcastsPresence() {
        presenceService.userConnected("s1", alex);

        List<UserResponse> online = presenceService.getOnlineUsers();
        assertThat(online).extracting(UserResponse::getUsername).containsExactly("alex");

        ArgumentCaptor<List<UserResponse>> captor = ArgumentCaptor.captor();
        verify(broadcaster).broadcastPresence(captor.capture());
        assertThat(captor.getValue()).hasSize(1);
    }

    @Test
    void disconnectRemovesUser() {
        presenceService.userConnected("s1", alex);
        presenceService.userConnected("s2", sam);

        presenceService.userDisconnected("s1");

        assertThat(presenceService.getOnlineUsers())
                .extracting(UserResponse::getUsername)
                .containsExactly("sam");
    }

    @Test
    void sameUserWithTwoSessionsAppearsOnce() {
        presenceService.userConnected("s1", alex);
        presenceService.userConnected("s2", User.builder().id(1L).username("alex").avatarColor("#5865F2").build());

        List<UserResponse> online = presenceService.getOnlineUsers();

        assertThat(online).hasSize(1);
        assertThat(online.get(0).getUsername()).isEqualTo("alex");
    }
}
