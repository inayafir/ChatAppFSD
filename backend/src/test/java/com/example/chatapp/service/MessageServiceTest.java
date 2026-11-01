package com.example.chatapp.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.chatapp.dto.MessageResponse;
import com.example.chatapp.entity.Channel;
import com.example.chatapp.entity.Message;
import com.example.chatapp.entity.User;
import com.example.chatapp.exception.ForbiddenActionException;
import com.example.chatapp.exception.NotFoundException;
import com.example.chatapp.repository.MessageRepository;
import com.example.chatapp.websocket.ChatBroadcaster;

@ExtendWith(MockitoExtension.class)
class MessageServiceTest {

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private ChannelService channelService;

    @Mock
    private UserService userService;

    @Mock
    private ChatBroadcaster broadcaster;

    @InjectMocks
    private MessageService messageService;

    private final Channel channel = Channel.builder().id(1L).name("general").build();
    private final User alex = User.builder().id(10L).username("alex").avatarColor("#5865F2").build();
    private final User sam = User.builder().id(20L).username("sam").avatarColor("#EB459E").build();

    @Test
    void getLatestMessagesReturnsOldestFirst() {
        Message first = message(1L, "first", alex, LocalDateTime.now().minusMinutes(5));
        Message second = message(2L, "second", alex, LocalDateTime.now());
        when(channelService.getById(1L)).thenReturn(channel);
        when(messageRepository.findLatestByChannelId(1L)).thenReturn(List.of(second, first));

        List<MessageResponse> messages = messageService.getLatestMessages(1L);

        assertThat(messages).extracting(MessageResponse::getContent)
                .containsExactly("first", "second");
    }

    @Test
    void saveMessagePersistsAndMapsSender() {
        when(channelService.getById(1L)).thenReturn(channel);
        when(userService.getById(10L)).thenReturn(alex);
        when(messageRepository.save(any(Message.class))).thenAnswer(inv -> {
            Message m = inv.getArgument(0);
            m.setId(7L);
            m.setCreatedAt(LocalDateTime.now());
            return m;
        });

        MessageResponse response = messageService.saveMessage(1L, "  hello world  ", 10L);

        assertThat(response.getId()).isEqualTo(7L);
        assertThat(response.getContent()).isEqualTo("hello world");
        assertThat(response.getSenderName()).isEqualTo("alex");
        assertThat(response.getChannelId()).isEqualTo(1L);
    }

    @Test
    void saveMessageRejectsBlankContent() {
        assertThatThrownBy(() -> messageService.saveMessage(1L, "   ", 10L))
                .isInstanceOf(IllegalArgumentException.class);
        verify(messageRepository, never()).save(any());
    }

    @Test
    void deleteMessageAllowsOwner() {
        Message message = message(5L, "mine", alex, LocalDateTime.now());
        when(messageRepository.findByIdWithSender(5L)).thenReturn(Optional.of(message));

        MessageResponse response = messageService.deleteMessage(5L, 10L);

        assertThat(response.getId()).isEqualTo(5L);
        verify(messageRepository).delete(message);
    }

    @Test
    void deleteMessageRejectsNonOwner() {
        Message message = message(5L, "not mine", alex, LocalDateTime.now());
        when(messageRepository.findByIdWithSender(5L)).thenReturn(Optional.of(message));

        assertThatThrownBy(() -> messageService.deleteMessage(5L, 20L))
                .isInstanceOf(ForbiddenActionException.class);
        verify(messageRepository, never()).delete(any());
    }

    @Test
    void deleteMessageThrowsWhenMissing() {
        when(messageRepository.findByIdWithSender(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> messageService.deleteMessage(404L, 10L))
                .isInstanceOf(NotFoundException.class);
    }

    private Message message(Long id, String content, User sender, LocalDateTime createdAt) {
        return Message.builder()
                .id(id)
                .content(content)
                .sender(sender)
                .channel(channel)
                .createdAt(createdAt)
                .build();
    }
}
