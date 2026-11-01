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
public class ChannelResponse {

    private Long id;
    private String name;
    private LocalDateTime createdAt;
    private long messageCount;
}
