package ace.org.epms_backend.model.feedback360;

import ace.org.epms_backend.enums.FeedbackRelationship;
import ace.org.epms_backend.enums.NominationStatus;
import ace.org.epms_backend.model.BaseEntity;
import ace.org.epms_backend.model.employee.Employee;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "feedback_nomination")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class FeedbackNomination extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "target_user_id", nullable = false)
    private Employee targetUser;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nominee_id", nullable = false)
    private Employee nominee;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FeedbackRelationship relationship;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private NominationStatus status = NominationStatus.PROPOSED;

    // The employee who proposed this nomination
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "nominated_by_id", nullable = false)
    private Employee nominatedBy;

    // The employee who approved/rejected this nomination
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "approved_by_id")
    private Employee approvedBy;
}
