package com.orderflow.controller;

import com.orderflow.entity.Order;
import com.orderflow.entity.OrderItem;
import com.orderflow.entity.Product;
import com.orderflow.entity.User;
import com.orderflow.repository.OrderRepository;
import com.orderflow.repository.ProductRepository;
import com.orderflow.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
public class OrderController {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final JdbcTemplate jdbcTemplate;

    public OrderController(OrderRepository orderRepository,
                           ProductRepository productRepository,
                           UserRepository userRepository,
                           JdbcTemplate jdbcTemplate) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping
    public List<Order> getAllOrders() {
        return orderRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<?> placeOrder(@RequestBody Map<String, Object> payload) {
        try {
            // Clean up the leftover user_id column that ddl-auto: update created earlier
            try {
                jdbcTemplate.execute("ALTER TABLE orders DROP COLUMN IF EXISTS user_id");
            } catch (Exception ignored) {
            }

            UUID productId = UUID.fromString(payload.get("productId").toString());
            int quantity = Integer.parseInt(payload.get("quantity").toString());

            if (quantity <= 0) {
                return ResponseEntity.badRequest().body(Map.of("error", "Quantity must be greater than 0"));
            }

            Product product = productRepository.findById(productId).orElse(null);
            if (product == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Product not found in store"));
            }

            if (product.getStockQuantity() < quantity) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of(
                            "error", "Insufficient stock!",
                            "requestedQuantity", quantity,
                            "availableStock", product.getStockQuantity()
                        ));
            }

            product.setStockQuantity(product.getStockQuantity() - quantity);
            productRepository.save(product);

            User customer = userRepository.findAll().stream().findFirst().orElseGet(() -> {
                User defaultUser = new User();
                defaultUser.setEmail("customer@orderflow.com");
                defaultUser.setFullName("Test Customer");
                defaultUser.setPasswordHash("hashed_pass");
                defaultUser.setRole("CUSTOMER");
                return userRepository.save(defaultUser);
            });

            BigDecimal totalAmount = product.getPrice().multiply(BigDecimal.valueOf(quantity));

            Order order = new Order();
            order.setCustomerId(customer.getId());
            order.setStatus("PAID");
            order.setTotalAmount(totalAmount);

            OrderItem item = new OrderItem();
            item.setOrder(order);
            item.setProductId(product.getId());
            item.setQuantity(quantity);
            item.setUnitPrice(product.getPrice());

            order.getItems().add(item);

            Order savedOrder = orderRepository.save(order);
            return ResponseEntity.status(HttpStatus.CREATED).body(savedOrder);

        } catch (Exception e) {
            Throwable root = e;
            while (root.getCause() != null && root.getCause() != root) {
                root = root.getCause();
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of(
                        "exception", e.getClass().getSimpleName(),
                        "exactReason", root.getMessage() != null ? root.getMessage() : e.toString()
                    ));
        }
    }
}