package com.example.chatapp.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.example.chatapp.dto.MessageResponse;
import com.example.chatapp.service.MessageService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @GetMapping("/channels/{channelId}/messages")
    public ResponseEntity<List<MessageResponse>> getChannelMessages(@PathVariable Long channelId) {
        return ResponseEntity.ok(messageService.getLatestMessages(channelId));
    }

    @DeleteMapping("/messages/{id}")
    public ResponseEntity<MessageResponse> deleteMessage(@PathVariable Long id, @RequestParam Long userId) {
        return ResponseEntity.ok(messageService.deleteMessage(id, userId));
    }
}
