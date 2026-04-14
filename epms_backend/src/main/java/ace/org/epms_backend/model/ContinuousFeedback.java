package ace.org.epms_backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "continuous_feedback")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ContinuousFeedback extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long feedbackId;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "manager_id", nullable = false)
    private Employee manager;

    @Enumerated(EnumType.STRING)
    private FeedbackType feedbackType;

    @ManyToOne
    @JoinColumn(name = "tag_id")
    private FeedbackTag tag;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Boolean isPrivate = false;

    private Long createdBy;
}
