package ace.org.epms_backend.dto.org;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PositionResponse {
    private Long positionId;
    private String positionCode;
    private String positionName;
    private Long levelId;
    private String levelName;
}
