package ace.org.epms_backend.model;

import ace.org.epms_backend.enums.PerformanceGrade;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name = "performance_category")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private BigDecimal minScore;
    private BigDecimal maxScore;

    private Integer ratingValue;

    @Enumerated(EnumType.STRING)
    private PerformanceGrade grade;

    @Column(columnDefinition = "TEXT")
    private String description;
}
