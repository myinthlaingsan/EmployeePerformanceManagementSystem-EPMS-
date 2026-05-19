package ace.org.epms_backend.model.continuous;

import ace.org.epms_backend.enums.ActionItemStatus;
import ace.org.epms_backend.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "meeting_action_items")
@Getter
@Setter
@NoArgsConstructor
@SuperBuilder
public class MeetingActionItem extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_id", nullable = false)
    private OneOnOneMeeting meeting;

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
