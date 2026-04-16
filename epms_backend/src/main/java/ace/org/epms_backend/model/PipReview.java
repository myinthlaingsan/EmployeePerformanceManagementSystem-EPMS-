package ace.org.epms_backend.model;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;

@Entity
@Table(name = "pip_reviews")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class PipReview extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long reviewId;

    @ManyToOne
    @JoinColumn(name = "pip_id", nullable = false)
    private PipRecord pip;

    private LocalDate reviewDate;

    @Column(columnDefinition = "TEXT")
    private String progressSummary;

    @Column(columnDefinition = "TEXT")
    private String managerFeedback;

    @Column(columnDefinition = "TEXT")
    private String nextAction;

    private Boolean isActive = true;

    private Long createdBy;
}
