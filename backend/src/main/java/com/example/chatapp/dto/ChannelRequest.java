package com.example.chatapp.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ChannelRequest {

    @NotBlank(message = "Channel name is required")
    @Size(min = 2, max = 30, message = "Channel name must be between 2 and 30 characters")
    @Pattern(regexp = "^[a-z0-9][a-z0-9-]*$", message = "Use lowercase letters, numbers and dashes only")
    private String name;
}
