package ace.org.epms_backend.dto.pip;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class PipExtendRequest {
    private LocalDate newEndDate;
    private List<LocalDate> scheduledReviewDates;
}
