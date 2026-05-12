package ace.org.epms_backend.dto.kpi;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BulkAssignmentResponse {
    private int totalProcessed;
    private int successfulCount;
    private int failedCount;
    private int skippedCount;
    private List<AssignmentResult> results;
}
