package com.example.chatapp.controller;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.chatapp.dto.UserResponse;
import com.example.chatapp.service.PresenceService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/presence")
@RequiredArgsConstructor
public class PresenceController {

    private final PresenceService presenceService;

    /**
     * Initial online-user list; live updates arrive over /topic/presence.
     */
    @GetMapping
    public ResponseEntity<List<UserResponse>> getOnlineUsers() {
        return ResponseEntity.ok(presenceService.getOnlineUsers());
    }
}
