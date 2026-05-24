package ace.org.epms_backend.model;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;

@MappedSuperclass
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class BaseEntity {

    @Column(updatable = false)
    private Instant createdAt;

    private Instant updatedAt;
    private Instant deletedAt;

    private Boolean isDeleted = false;

    @PrePersist
    protected void onCreate(){
        Instant now = Instant.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.isDeleted == null) {
            this.isDeleted = false;
        }
    }

    @PreUpdate
    protected void onUpdate(){
        this.updatedAt = Instant.now();
    }
}