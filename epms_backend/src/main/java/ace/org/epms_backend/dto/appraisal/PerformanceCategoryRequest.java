package ace.org.epms_backend.dto.appraisal;
 
import ace.org.epms_backend.enums.PerformanceGrade;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
 
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PerformanceCategoryRequest {
    @NotBlank(message = "Name is required")
    private String name;
    
    @NotNull(message = "Minimum score is required")
    private BigDecimal minScore;
    
    @NotNull(message = "Maximum score is required")
    private BigDecimal maxScore;
    
    @NotNull(message = "Rating value is required")
    private Integer ratingValue;
    
    @NotNull(message = "Grade is required")
    private PerformanceGrade grade;
    
    private String description;
}
