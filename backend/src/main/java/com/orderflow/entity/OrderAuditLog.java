package com.orderflow.entity;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "order_audit_logs")
public class OrderAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "order_id", nullable = false)
    private UUID orderId;

    @Column(name = "actor_id", nullable = false)
    private UUID actorId;

    @Column(name = "old_status")
    private String oldStatus;

    @Column(name = "new_status", nullable = false)
    private String newStatus;

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public OrderAuditLog() {}

    public OrderAuditLog(UUID orderId, UUID actorId, String oldStatus, String newStatus, String notes) {
        this.orderId = orderId;
        this.actorId = actorId;
        this.oldStatus = oldStatus;
        this.newStatus = newStatus;
        this.notes = notes;
    }

    public UUID getId() { return id; }
    public UUID getOrderId() { return orderId; }
    public UUID getActorId() { return actorId; }
    public String getOldStatus() { return oldStatus; }
    public String getNewStatus() { return newStatus; }
    public String getNotes() { return notes; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
}