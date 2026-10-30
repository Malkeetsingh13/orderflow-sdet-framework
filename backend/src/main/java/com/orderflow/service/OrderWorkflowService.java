package com.orderflow.service;

import com.orderflow.entity.Order;
import com.orderflow.entity.OrderAuditLog;
import com.orderflow.repository.OrderAuditRepository;
import com.orderflow.repository.OrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;

@Service
public class OrderWorkflowService {

    private final OrderRepository orderRepository;
    private final OrderAuditRepository auditRepository;

    public OrderWorkflowService(OrderRepository orderRepository, OrderAuditRepository auditRepository) {
        this.orderRepository = orderRepository;
        this.auditRepository = auditRepository;
    }

    @Transactional
    public Order transitionOrderStatus(UUID orderId, String targetStatus, UUID actorId, String notes) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found with ID: " + orderId));

        String currentStatus = order.getStatus();

        // Validate state machine transition matrix
        if (!isValidTransition(currentStatus, targetStatus)) {
            throw new IllegalArgumentException("Invalid state transition from " + currentStatus + " to " + targetStatus);
        }

        // Update status & timestamp
        order.setStatus(targetStatus);
        order.setUpdatedAt(OffsetDateTime.now());
        Order updatedOrder = orderRepository.save(order);

        // Record audit log
        OrderAuditLog auditLog = new OrderAuditLog(orderId, actorId, currentStatus, targetStatus, notes);
        auditRepository.save(auditLog);

        return updatedOrder;
    }

    private boolean isValidTransition(String current, String target) {
        return switch (current) {
            case "PENDING_PAYMENT" -> Set.of("PAID", "CANCELLED").contains(target);
            case "PAID" -> Set.of("SHIPPED", "CANCELLED").contains(target);
            case "SHIPPED" -> Set.of("DELIVERED").contains(target);
            case "DELIVERED", "CANCELLED" -> false; // Terminal states (no further transitions allowed)
            default -> false;
        };
    }
}
