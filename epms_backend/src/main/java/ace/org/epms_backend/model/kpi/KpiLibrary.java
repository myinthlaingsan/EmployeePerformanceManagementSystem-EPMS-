package ace.org.epms_backend.model.kpi;
import ace.org.epms_backend.model.employee.Position;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "kpi_library")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class KpiLibrary {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne
    @JoinColumn(name = "position_id")
    private Position position;

    private Boolean isActive = true;
}
