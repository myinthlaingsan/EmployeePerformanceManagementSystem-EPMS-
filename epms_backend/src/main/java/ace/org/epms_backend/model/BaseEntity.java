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
    private Instant created_at;

    private Instant updated_at;

    @PrePersist
    protected void onCreate(){
        Instant now = Instant.now();
        this.created_at = now;
        this.updated_at = now;
    }

    @PreUpdate
    protected void onUpdate(){
        this.updated_at = Instant.now();
    }
}