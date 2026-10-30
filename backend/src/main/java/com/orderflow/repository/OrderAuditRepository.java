package com.orderflow.repository;

import com.orderflow.entity.OrderAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface OrderAuditRepository extends JpaRepository<OrderAuditLog, UUID> {
    List<OrderAuditLog> findByOrderId(UUID orderId);
}
