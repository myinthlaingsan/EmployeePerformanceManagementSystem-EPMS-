package ace.org.epms_backend.model.idp;

import ace.org.epms_backend.enums.DevelopmentGoalCategory;
import ace.org.epms_backend.enums.DevelopmentGoalStatus;
import ace.org.epms_backend.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "development_goals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true, exclude = {"plan", "updates"})
@SuperBuilder
public class DevelopmentGoal extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long goalId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idp_id", nullable = false)
    private DevelopmentPlan plan;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DevelopmentGoalCategory category;

    @Column(columnDefinition = "TEXT")
    private String successCriteria;

    private LocalDate targetDate;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DevelopmentGoalStatus status;

    private Integer progressPercent = 0;

    @Column(columnDefinition = "TEXT")
    private String managerComment;

    @Column(columnDefinition = "TEXT")
    private String employeeComment;

    @OneToMany(mappedBy = "goal", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DevelopmentProgressUpdate> updates = new ArrayList<>();
}
