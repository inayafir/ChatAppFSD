package com.example.chatapp.websocket;

import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;

import com.example.chatapp.dto.SendMessagePayload;
import com.example.chatapp.dto.TypingPayload;
import com.example.chatapp.dto.TypingResponse;
import com.example.chatapp.service.MessageService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Receives messages sent by clients to /app/channels/{id}/send and /app/channels/{id}/typing.
 * Persisted messages are re-broadcast to /topic/channels/{id} by the service layer.
 */
@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatWebSocketController {

    private final MessageService messageService;
    private final ChatBroadcaster broadcaster;

    @MessageMapping("/channels/{channelId}/send")
    public void sendMessage(@DestinationVariable Long channelId, SendMessagePayload payload) {
        try {
            messageService.saveMessage(channelId, payload.getContent(), payload.getSenderId());
        } catch (Exception ex) {
            log.warn("Dropped invalid message for channel {}: {}", channelId, ex.getMessage());
        }
    }

    @MessageMapping("/channels/{channelId}/typing")
    public void typing(@DestinationVariable Long channelId, TypingPayload payload) {
        broadcaster.broadcastTyping(new TypingResponse(channelId, payload.getUsername(), true));
    }
}
