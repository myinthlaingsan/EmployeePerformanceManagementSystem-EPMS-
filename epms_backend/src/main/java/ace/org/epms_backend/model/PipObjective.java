package ace.org.epms_backend.model;

import ace.org.epms_backend.enums.ObjectiveStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;

@Entity
@Table(name = "pip_objectives")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class PipObjective extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long objectiveId;

    @ManyToOne
    @JoinColumn(name = "pip_id", nullable = false)
    private PipRecord pip;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String successCriteria;

    private LocalDate targetDate;

    @Enumerated(EnumType.STRING)
    private ObjectiveStatus status;

    private Boolean isAchieved = false;

    private Boolean isActive = true;
}