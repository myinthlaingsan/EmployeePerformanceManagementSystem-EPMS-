package ace.org.epms_backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "kpi_library_details")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class KpiLibraryDetails extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "library_id")
    private KpiLibrary library;

    private String goalTitle;

    private BigDecimal targetValue;

    private BigDecimal weightPercent;

    private Boolean isActive = true;
}
