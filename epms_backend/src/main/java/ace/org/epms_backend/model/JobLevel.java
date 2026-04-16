package ace.org.epms_backend.model;

import jakarta.persistence.*;
import lombok.*;
import ace.org.epms_backend.model.BaseEntity;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "job_level")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class JobLevel extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long levelId;

    @Column(unique = true)
    private String levelCode;

    private String levelName;

    @Column(unique = true, nullable = false)
    private Integer levelRank;  // 1 = highest
}