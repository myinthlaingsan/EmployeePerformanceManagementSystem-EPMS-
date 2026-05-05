package ace.org.epms_backend.model.appraisal;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "unlock_request")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UnlockRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long appraisalId;

    private Long requestedBy; // manager

    private String reason;

    private Boolean approved; // null = pending
}
