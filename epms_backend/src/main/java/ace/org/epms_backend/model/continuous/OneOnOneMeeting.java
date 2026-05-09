package ace.org.epms_backend.model.continuous;
import ace.org.epms_backend.model.BaseEntity;
import ace.org.epms_backend.model.employee.Employee;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalTime;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "one_on_one_meeting")
@SQLDelete(sql = "UPDATE one_on_one_meeting SET is_deleted = true, deleted_at = NOW() WHERE meeting_id = ?")
@SQLRestriction("is_deleted = false OR is_deleted IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class OneOnOneMeeting extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long meetingId;

    @ManyToOne
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    @ManyToOne
    @JoinColumn(name = "manager_id", nullable = false)
    private Employee manager;

    private LocalDate meetingDate;

    private LocalTime meetingTime;

    @Column(columnDefinition = "TEXT")
    private String discussionPoints;

    @Column(columnDefinition = "TEXT")
    private String keyIssues;

    @Column(columnDefinition = "TEXT")
    private String actionItems;

    private LocalDate followUpDate;

    private Boolean isPrivateNote = false;

    private Long createdBy;
}