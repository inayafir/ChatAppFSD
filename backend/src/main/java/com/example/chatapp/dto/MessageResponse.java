package com.example.chatapp.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {

    private Long id;
    private String content;
    private LocalDateTime createdAt;
    private Long channelId;
    private Long senderId;
    private String senderName;
    private String senderAvatarColor;
}
