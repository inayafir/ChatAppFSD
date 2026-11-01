package com.example.chatapp.config;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.example.chatapp.entity.Channel;
import com.example.chatapp.entity.Message;
import com.example.chatapp.entity.User;
import com.example.chatapp.repository.ChannelRepository;
import com.example.chatapp.repository.MessageRepository;
import com.example.chatapp.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Seeds default channels and a few welcome messages on first run.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final String SYSTEM_USERNAME = "System";

    private final ChannelRepository channelRepository;
    private final UserRepository userRepository;
    private final MessageRepository messageRepository;

    @Override
    public void run(String... args) {
        if (channelRepository.count() > 0) {
            return;
        }
        log.info("Seeding default channels and welcome messages...");

        Channel general = channelRepository.save(Channel.builder().name("general").build());
        Channel random = channelRepository.save(Channel.builder().name("random").build());
        Channel techTalk = channelRepository.save(Channel.builder().name("tech-talk").build());

        User system = userRepository.save(User.builder()
                .username(SYSTEM_USERNAME)
                .avatarColor("#5865F2")
                .build());

        List<Message> welcomeMessages = List.of(
                Message.builder()
                        .content("Welcome to ChatApp! This is #general - say hi to everyone.")
                        .sender(system)
                        .channel(general)
                        .build(),
                Message.builder()
                        .content("Tip: you can create new channels with the + button on the left.")
                        .sender(system)
                        .channel(general)
                        .build(),
                Message.builder()
                        .content("Casual chatter goes here in #random. Memes welcome.")
                        .sender(system)
                        .channel(random)
                        .build(),
                Message.builder()
                        .content("Talk all things Java, React and tech in #tech-talk.")
                        .sender(system)
                        .channel(techTalk)
                        .build());
        messageRepository.saveAll(welcomeMessages);

        log.info("Seeded channels #general, #random, #tech-talk with welcome messages.");
    }
}
