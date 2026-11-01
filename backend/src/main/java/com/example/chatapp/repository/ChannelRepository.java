package com.example.chatapp.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.chatapp.entity.Channel;

public interface ChannelRepository extends JpaRepository<Channel, Long> {

    boolean existsByName(String name);
}
