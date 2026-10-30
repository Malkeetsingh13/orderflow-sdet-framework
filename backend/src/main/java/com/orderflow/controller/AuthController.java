package com.orderflow.controller;

import com.orderflow.entity.User;
import com.orderflow.repository.UserRepository;
import com.orderflow.security.JwtTokenProvider;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final JwtTokenProvider tokenProvider;

    public AuthController(UserRepository userRepository, JwtTokenProvider tokenProvider) {
        this.userRepository = userRepository;
        this.tokenProvider = tokenProvider;
    }

    // 1. Register a new user
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");
        String fullName = payload.get("fullName");

        if (userRepository.findAll().stream().anyMatch(u -> u.getEmail().equals(email))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is already in use"));
        }

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(password);
        user.setFullName(fullName);
        user.setRole("CUSTOMER");

        userRepository.save(user);
        return ResponseEntity.status(201).body(Map.of("message", "User registered successfully"));
    }

    // 2. Login and get JWT Token
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        String password = payload.get("password");

        User user = userRepository.findAll().stream()
                .filter(u -> u.getEmail().equals(email) && u.getPasswordHash().equals(password))
                .findFirst()
                .orElse(null);

        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
        }

        // Generate JWT Token
        String token = tokenProvider.generateToken(user.getEmail());

        return ResponseEntity.ok(Map.of(
            "token", token,
            "type", "Bearer",
            "email", user.getEmail()
        ));
    }
}
