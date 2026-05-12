package ace.org.epms_backend.dto.pip;

import lombok.Data;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.util.List;

@Data
public class PipExtendRequest {
    @NotNull(message = "New end date is required")
    private LocalDate newEndDate;
    private List<LocalDate> scheduledReviewDates;
}

