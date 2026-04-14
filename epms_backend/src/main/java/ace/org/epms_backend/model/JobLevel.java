package ace.org.epms_backend.model;

import jakarta.persistence.*;
import lombok.*;
import ace.org.epms_backend.model.BaseEntity;

@Entity
@Table(name = "job_level")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class JobLevel extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long levelId;

    @Column(unique = true)
    private String levelCode;

    private String levelName;
}