package ace.org.epms_backend.dto.kpi;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiProgressResponse {
    private Long id;
    private Long goalItemId;
    private String goalTitle;
    private BigDecimal actualValue;
    private BigDecimal progressPercent;
    private String evidenceNote;
    private String updatedAt;
}
