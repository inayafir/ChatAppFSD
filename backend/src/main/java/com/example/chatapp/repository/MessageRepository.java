package com.example.chatapp.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.chatapp.entity.Message;

public interface MessageRepository extends JpaRepository<Message, Long> {

    @Query("""
            SELECT m FROM Message m
            JOIN FETCH m.sender
            JOIN FETCH m.channel
            WHERE m.channel.id = :channelId
            ORDER BY m.createdAt DESC
            """)
    List<Message> findLatestByChannelId(@Param("channelId") Long channelId);

    @Query("""
            SELECT m FROM Message m
            JOIN FETCH m.sender
            WHERE m.id = :id
            """)
    Optional<Message> findByIdWithSender(@Param("id") Long id);

    long countByChannelId(Long channelId);

    @Modifying
    @Query("DELETE FROM Message m WHERE m.channel.id = :channelId")
    void deleteByChannelId(@Param("channelId") Long channelId);
}
