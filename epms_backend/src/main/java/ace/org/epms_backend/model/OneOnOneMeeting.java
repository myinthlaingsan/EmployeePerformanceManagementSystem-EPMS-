package ace.org.epms_backend.model;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(name = "one_on_one_meeting")
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