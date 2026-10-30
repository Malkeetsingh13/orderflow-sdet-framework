package com.orderflow.controller;

import com.orderflow.entity.Product;
import com.orderflow.repository.ProductRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    // 1. GET (Read all products)
    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    // 2. POST (Create a new product)
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Product createProduct(@RequestBody Product product) {
        return productRepository.save(product);
    }

    // 3. PUT (Full Update - replaces all fields of an existing product)
    @PutMapping("/{id}")
    public ResponseEntity<Product> updateProduct(@PathVariable UUID id, @RequestBody Product updatedProduct) {
        return productRepository.findById(id)
                .map(existingProduct -> {
                    existingProduct.setSku(updatedProduct.getSku());
                    existingProduct.setName(updatedProduct.getName());
                    existingProduct.setDescription(updatedProduct.getDescription());
                    existingProduct.setPrice(updatedProduct.getPrice());
                    existingProduct.setStockQuantity(updatedProduct.getStockQuantity());
                    return ResponseEntity.ok(productRepository.save(existingProduct));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // 4. PATCH (Partial Update - updates ONLY the fields sent in the request)
    @PatchMapping("/{id}")
    public ResponseEntity<Product> patchProduct(@PathVariable UUID id, @RequestBody Map<String, Object> updates) {
        return productRepository.findById(id)
                .map(existingProduct -> {
                    if (updates.containsKey("sku")) {
                        existingProduct.setSku((String) updates.get("sku"));
                    }
                    if (updates.containsKey("name")) {
                        existingProduct.setName((String) updates.get("name"));
                    }
                    if (updates.containsKey("description")) {
                        existingProduct.setDescription((String) updates.get("description"));
                    }
                    if (updates.containsKey("price")) {
                        existingProduct.setPrice(new BigDecimal(updates.get("price").toString()));
                    }
                    if (updates.containsKey("stockQuantity")) {
                        existingProduct.setStockQuantity(Integer.valueOf(updates.get("stockQuantity").toString()));
                    }
                    return ResponseEntity.ok(productRepository.save(existingProduct));
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // 5. DELETE (Remove a product by ID)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable UUID id) {
        if (!productRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        productRepository.deleteById(id);
        return ResponseEntity.noContent().build(); // Returns HTTP 204 No Content
    }
}