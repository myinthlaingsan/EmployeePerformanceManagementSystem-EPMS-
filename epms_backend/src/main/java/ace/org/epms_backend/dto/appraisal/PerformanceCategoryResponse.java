package ace.org.epms_backend.dto.appraisal;
 
import ace.org.epms_backend.enums.PerformanceGrade;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
 
import java.math.BigDecimal;
 
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceCategoryResponse {
    private Long id;
    private String name;
    private BigDecimal minScore;
    private BigDecimal maxScore;
    private Integer ratingValue;
    private PerformanceGrade grade;
    private String description;
}
