package com.example.chatapp.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MessageDeletedResponse {

    private Long messageId;
    private Long channelId;
    private Long deletedBy;
}
