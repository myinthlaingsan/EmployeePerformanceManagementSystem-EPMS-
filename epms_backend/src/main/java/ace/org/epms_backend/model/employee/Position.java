package ace.org.epms_backend.model.employee;
import ace.org.epms_backend.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Entity
@Table(name = "position")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class Position extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long positionId;

    private String positionCode;
    private String positionName;

    @ManyToOne
    @JoinColumn(name = "level_id")
    private JobLevel level;

}