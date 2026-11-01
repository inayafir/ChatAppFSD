package com.example.chatapp.service;

import org.springframework.stereotype.Service;

import com.example.chatapp.dto.LoginRequest;
import com.example.chatapp.dto.UserResponse;
import com.example.chatapp.entity.User;
import com.example.chatapp.exception.NotFoundException;
import com.example.chatapp.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

    public static final String DEFAULT_AVATAR_COLOR = "#5865F2";

    private final UserRepository userRepository;

    /**
     * Finds the user by username, creating it on first login.
     */
    public UserResponse login(LoginRequest request) {
        String username = request.getUsername().trim();
        User user = userRepository.findByUsername(username)
                .orElseGet(() -> userRepository.save(User.builder()
                        .username(username)
                        .avatarColor(normalizeColor(request.getAvatarColor()))
                        .build()));
        return toResponse(user);
    }

    public User getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found with id " + id));
    }

    public User getByUsername(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new NotFoundException("User not found with username " + username));
    }

    public UserResponse toResponse(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getAvatarColor());
    }

    private String normalizeColor(String color) {
        if (color == null || color.isBlank()) {
            return DEFAULT_AVATAR_COLOR;
        }
        return color.trim();
    }
}
