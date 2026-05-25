package ace.org.epms_backend.model.continuous;

import ace.org.epms_backend.enums.ActionItemStatus;
import ace.org.epms_backend.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "meeting_action_items")
@SQLDelete(sql = "UPDATE meeting_action_items SET is_deleted = true WHERE id = ?")
@SQLRestriction("is_deleted = false OR is_deleted IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class MeetingActionItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_id", nullable = false)
    private OneOnOneMeeting meeting;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    private ace.org.epms_backend.model.employee.Employee assignedTo;

    @Column(name = "due_date")
    private java.time.LocalDate dueDate;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    private ActionItemStatus status = ActionItemStatus.PENDING;

    private java.time.LocalDateTime completedAt;

    @Column(columnDefinition = "TEXT")
    private String reopenReason;

    private java.time.LocalDateTime reopenedAt;

    @Column(name = "is_deleted", nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;

    @Column(name = "deleted_by")
    private Long deletedBy;

    @Column(name = "reopen_count", nullable = false)
    @Builder.Default
    private Integer reopenCount = 0;
}
