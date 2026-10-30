package com.orderflow.repository;

import com.orderflow.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    
    // Spring Data JPA automatically writes the SQL to find a user by their email address!
    Optional<User> findByEmail(String email);
}