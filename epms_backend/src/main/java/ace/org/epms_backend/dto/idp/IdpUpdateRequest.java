package ace.org.epms_backend.dto.idp;

import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class IdpUpdateRequest {
    private Long managerId;
    private String title;
    private String summary;
    private LocalDate endDate;
    private List<LocalDate> scheduledFollowUpDates;
}
