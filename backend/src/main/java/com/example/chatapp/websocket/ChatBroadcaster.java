package com.example.chatapp.websocket;

import java.util.List;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

import com.example.chatapp.dto.ChannelEventResponse;
import com.example.chatapp.dto.ChannelResponse;
import com.example.chatapp.dto.MessageDeletedResponse;
import com.example.chatapp.dto.MessageResponse;
import com.example.chatapp.dto.PresenceResponse;
import com.example.chatapp.dto.TypingResponse;
import com.example.chatapp.dto.UserResponse;

import lombok.RequiredArgsConstructor;

/**
 * Single place that knows the STOMP topic names used by the app.
 */
@Component
@RequiredArgsConstructor
public class ChatBroadcaster {

    public static final String CHANNELS_TOPIC = "/topic/channels";
    public static final String PRESENCE_TOPIC = "/topic/presence";

    private final SimpMessagingTemplate messagingTemplate;

    public void broadcastMessage(MessageResponse message) {
        messagingTemplate.convertAndSend(channelTopic(message.getChannelId()), message);
    }

    public void broadcastMessageDeleted(MessageDeletedResponse event) {
        messagingTemplate.convertAndSend(channelTopic(event.getChannelId()) + "/events", event);
    }

    public void broadcastChannelEvent(ChannelEventResponse event) {
        messagingTemplate.convertAndSend(CHANNELS_TOPIC, event);
    }

    public void broadcastTyping(TypingResponse typing) {
        messagingTemplate.convertAndSend(channelTopic(typing.getChannelId()) + "/typing", typing);
    }

    public void broadcastPresence(List<UserResponse> onlineUsers) {
        messagingTemplate.convertAndSend(PRESENCE_TOPIC, new PresenceResponse(onlineUsers));
    }

    public String channelTopic(Long channelId) {
        return "/topic/channels/" + channelId;
    }
}
