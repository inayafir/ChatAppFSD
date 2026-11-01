package com.example.chatapp.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.chatapp.dto.ChannelEventResponse;
import com.example.chatapp.dto.ChannelRequest;
import com.example.chatapp.dto.ChannelResponse;
import com.example.chatapp.entity.Channel;
import com.example.chatapp.exception.ConflictException;
import com.example.chatapp.exception.NotFoundException;
import com.example.chatapp.repository.ChannelRepository;
import com.example.chatapp.repository.MessageRepository;
import com.example.chatapp.websocket.ChatBroadcaster;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ChannelService {

    public static final String EVENT_CREATED = "CHANNEL_CREATED";
    public static final String EVENT_DELETED = "CHANNEL_DELETED";

    private final ChannelRepository channelRepository;
    private final MessageRepository messageRepository;
    private final ChatBroadcaster broadcaster;

    public List<ChannelResponse> getAll() {
        return channelRepository.findAll().stream()
                .sorted((a, b) -> a.getName().compareToIgnoreCase(b.getName()))
                .map(this::toResponse)
                .toList();
    }

    public ChannelResponse create(ChannelRequest request) {
        String name = request.getName().trim().toLowerCase();
        if (channelRepository.existsByName(name)) {
            throw new ConflictException("Channel #" + name + " already exists");
        }
        Channel channel = channelRepository.save(Channel.builder().name(name).build());
        ChannelResponse response = toResponse(channel);
        broadcaster.broadcastChannelEvent(new ChannelEventResponse(EVENT_CREATED, response));
        return response;
    }

    @Transactional
    public void delete(Long id) {
        Channel channel = getById(id);
        messageRepository.deleteByChannelId(channel.getId());
        ChannelResponse response = toResponse(channel);
        channelRepository.delete(channel);
        broadcaster.broadcastChannelEvent(new ChannelEventResponse(EVENT_DELETED, response));
    }

    public Channel getById(Long id) {
        return channelRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Channel not found with id " + id));
    }

    public ChannelResponse toResponse(Channel channel) {
        long messageCount = messageRepository.countByChannelId(channel.getId());
        return new ChannelResponse(channel.getId(), channel.getName(), channel.getCreatedAt(), messageCount);
    }
}
