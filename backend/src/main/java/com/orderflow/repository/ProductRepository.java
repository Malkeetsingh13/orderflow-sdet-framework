package com.orderflow.repository;

import com.orderflow.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    
    // Allows us to look up products by their unique SKU code
    Optional<Product> findBySku(String sku);
}