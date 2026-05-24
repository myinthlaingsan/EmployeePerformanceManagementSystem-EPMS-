package ace.org.epms_backend.model.kpi;

import ace.org.epms_backend.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;

@Entity
@Table(name = "kpi_library_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class KpiLibraryDetails extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "library_id")
    private KpiLibrary library;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private KpiCategory category;

    private String goalTitle;
    private String unit;
    private BigDecimal targetValue;

    private BigDecimal weightPercent;

    private Boolean isCompliance = false;
    private Boolean isActive = true;
}
