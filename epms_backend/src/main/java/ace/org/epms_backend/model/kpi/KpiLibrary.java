package ace.org.epms_backend.model.kpi;

import ace.org.epms_backend.model.BaseEntity;
import ace.org.epms_backend.model.employee.Position;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.util.List;

@Entity
@Table(name = "kpi_library")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@EqualsAndHashCode(callSuper = true)
public class KpiLibrary extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @ManyToOne
    @JoinColumn(name = "position_id")
    private Position position;

    @OneToMany(mappedBy = "library", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<KpiLibraryDetails> details;

    private Boolean isActive = true;
}
