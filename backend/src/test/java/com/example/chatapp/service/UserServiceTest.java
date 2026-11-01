package com.example.chatapp.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.example.chatapp.dto.LoginRequest;
import com.example.chatapp.dto.UserResponse;
import com.example.chatapp.entity.User;
import com.example.chatapp.exception.NotFoundException;
import com.example.chatapp.repository.UserRepository;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void loginCreatesNewUserWhenUsernameIsUnknown() {
        when(userRepository.findByUsername("alex")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(1L);
            return u;
        });

        UserResponse response = userService.login(new LoginRequest("  alex  ", "#FF5733"));

        assertThat(response.getId()).isEqualTo(1L);
        assertThat(response.getUsername()).isEqualTo("alex");
        assertThat(response.getAvatarColor()).isEqualTo("#FF5733");

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        assertThat(captor.getValue().getUsername()).isEqualTo("alex");
    }

    @Test
    void loginReturnsExistingUserWithoutCreating() {
        User existing = User.builder().id(5L).username("alex").avatarColor("#33FF57").build();
        when(userRepository.findByUsername("alex")).thenReturn(Optional.of(existing));

        UserResponse response = userService.login(new LoginRequest("alex", "#FF0000"));

        assertThat(response.getId()).isEqualTo(5L);
        assertThat(response.getUsername()).isEqualTo("alex");
        assertThat(response.getAvatarColor()).isEqualTo("#33FF57");
        verify(userRepository, never()).save(any());
    }

    @Test
    void loginUsesDefaultColorWhenNoneProvided() {
        when(userRepository.findByUsername("sam")).thenReturn(Optional.empty());
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        UserResponse response = userService.login(new LoginRequest("sam", null));

        assertThat(response.getAvatarColor()).isEqualTo(UserService.DEFAULT_AVATAR_COLOR);
    }

    @Test
    void getByIdThrowsWhenUserIsMissing() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.getById(99L))
                .isInstanceOf(NotFoundException.class)
                .hasMessageContaining("99");
    }
}
