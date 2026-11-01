package com.example.chatapp.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.chatapp.dto.ChannelRequest;
import com.example.chatapp.dto.ChannelResponse;
import com.example.chatapp.entity.Channel;
import com.example.chatapp.exception.ConflictException;
import com.example.chatapp.exception.NotFoundException;
import com.example.chatapp.repository.ChannelRepository;
import com.example.chatapp.repository.MessageRepository;
import com.example.chatapp.websocket.ChatBroadcaster;

@ExtendWith(MockitoExtension.class)
class ChannelServiceTest {

    @Mock
    private ChannelRepository channelRepository;

    @Mock
    private MessageRepository messageRepository;

    @Mock
    private ChatBroadcaster broadcaster;

    @InjectMocks
    private ChannelService channelService;

    @Test
    void createSavesNormalizedChannelName() {
        when(channelRepository.existsByName("music")).thenReturn(false);
        when(channelRepository.save(anyChannel())).thenAnswer(inv -> {
            Channel c = inv.getArgument(0);
            c.setId(10L);
            return c;
        });

        ChannelResponse response = channelService.create(new ChannelRequest(" Music "));

        assertThat(response.getName()).isEqualTo("music");
        assertThat(response.getId()).isEqualTo(10L);

        ArgumentCaptor<Channel> captor = ArgumentCaptor.forClass(Channel.class);
        verify(channelRepository).save(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("music");
    }

    @Test
    void createRejectsDuplicateChannelName() {
        when(channelRepository.existsByName("general")).thenReturn(true);

        assertThatThrownBy(() -> channelService.create(new ChannelRequest("general")))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("general");
    }

    @Test
    void deleteRemovesChannelAndItsMessages() {
        Channel channel = Channel.builder().id(3L).name("old").build();
        when(channelRepository.findById(3L)).thenReturn(Optional.of(channel));

        channelService.delete(3L);

        verify(messageRepository).deleteByChannelId(3L);
        verify(channelRepository).delete(channel);
    }

    @Test
    void deleteThrowsWhenChannelIsMissing() {
        when(channelRepository.findById(404L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> channelService.delete(404L))
                .isInstanceOf(NotFoundException.class);
    }

    @Test
    void getAllSortsChannelsByName() {
        Channel b = Channel.builder().id(1L).name("tech-talk").build();
        Channel a = Channel.builder().id(2L).name("general").build();
        when(channelRepository.findAll()).thenReturn(List.of(b, a));
        when(messageRepository.countByChannelId(1L)).thenReturn(0L);
        when(messageRepository.countByChannelId(2L)).thenReturn(4L);

        List<ChannelResponse> channels = channelService.getAll();

        assertThat(channels).extracting(ChannelResponse::getName)
                .containsExactly("general", "tech-talk");
        assertThat(channels.get(0).getMessageCount()).isEqualTo(4L);
    }

    private static Channel anyChannel() {
        return org.mockito.ArgumentMatchers.any(Channel.class);
    }
}
