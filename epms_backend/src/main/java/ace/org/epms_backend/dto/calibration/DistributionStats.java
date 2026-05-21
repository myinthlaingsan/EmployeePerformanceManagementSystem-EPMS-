package ace.org.epms_backend.dto.calibration;

import lombok.Builder;
import lombok.Data;

import java.util.Map;

@Data
@Builder
public class DistributionStats {
    private Map<String, Long> rawBuckets;
    private Map<String, Long> calibratedBuckets;
    private long totalCount;
    private long calibratedCount;
    private double rawAverage;
    private double calibratedAverage;
}
