package com.example.chatapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class SendMessagePayload {

    @NotNull(message = "Sender id is required")
    private Long senderId;

    @NotBlank(message = "Message content cannot be empty")
    private String content;
}
