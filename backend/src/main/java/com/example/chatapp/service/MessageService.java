package com.example.chatapp.service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.chatapp.dto.MessageDeletedResponse;
import com.example.chatapp.dto.MessageResponse;
import com.example.chatapp.entity.Channel;
import com.example.chatapp.entity.Message;
import com.example.chatapp.entity.User;
import com.example.chatapp.exception.ForbiddenActionException;
import com.example.chatapp.exception.NotFoundException;
import com.example.chatapp.repository.MessageRepository;
import com.example.chatapp.websocket.ChatBroadcaster;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class MessageService {

    public static final int HISTORY_LIMIT = 50;

    private final MessageRepository messageRepository;
    private final ChannelService channelService;
    private final UserService userService;
    private final ChatBroadcaster broadcaster;

    /**
     * Returns the latest {@link #HISTORY_LIMIT} messages of a channel, oldest first.
     */
    public List<MessageResponse> getLatestMessages(Long channelId) {
        channelService.getById(channelId);
        List<MessageResponse> messages = messageRepository.findLatestByChannelId(channelId).stream()
                .limit(HISTORY_LIMIT)
                .map(this::toResponse)
                .collect(Collectors.toCollection(ArrayList::new));
        Collections.reverse(messages);
        return messages;
    }

    /**
     * Persists a new message and broadcasts it to the channel topic (used by REST and WebSocket).
     */
    public MessageResponse saveMessage(Long channelId, String content, Long senderId) {
        String trimmed = content == null ? "" : content.trim();
        if (trimmed.isEmpty()) {
            throw new IllegalArgumentException("Message content cannot be empty");
        }
        if (trimmed.length() > 2000) {
            throw new IllegalArgumentException("Message must be at most 2000 characters");
        }
        Channel channel = channelService.getById(channelId);
        User sender = userService.getById(senderId);
        Message message = messageRepository.save(Message.builder()
                .content(trimmed)
                .sender(sender)
                .channel(channel)
                .build());
        MessageResponse response = toResponse(message);
        broadcaster.broadcastMessage(response);
        return response;
    }

    /**
     * Deletes a message after checking the caller owns it, then broadcasts the deletion.
     * Returns the deleted message.
     */
    @Transactional
    public MessageResponse deleteMessage(Long messageId, Long userId) {
        Message message = messageRepository.findByIdWithSender(messageId)
                .orElseThrow(() -> new NotFoundException("Message not found with id " + messageId));
        if (!message.getSender().getId().equals(userId)) {
            throw new ForbiddenActionException("You can only delete your own messages");
        }
        MessageResponse response = toResponse(message);
        messageRepository.delete(message);
        broadcaster.broadcastMessageDeleted(new MessageDeletedResponse(response.getId(), response.getChannelId(), userId));
        return response;
    }

    public MessageResponse toResponse(Message message) {
        return new MessageResponse(
                message.getId(),
                message.getContent(),
                message.getCreatedAt(),
                message.getChannel().getId(),
                message.getSender().getId(),
                message.getSender().getUsername(),
                message.getSender().getAvatarColor());
    }
}
