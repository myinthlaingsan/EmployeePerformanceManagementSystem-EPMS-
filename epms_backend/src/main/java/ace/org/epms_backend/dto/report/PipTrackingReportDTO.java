package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PipTrackingReportDTO {
    private int totalActivePip;
    private int completedPip;
    private List<PipDetailDTO> pipDetails;
}
