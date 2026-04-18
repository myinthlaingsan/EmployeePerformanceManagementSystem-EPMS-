package ace.org.epms_backend.dto.org;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobLevelResponse {
    private Long levelId;
    private String levelCode;
    private String levelName;
    private Integer levelRank;
}
