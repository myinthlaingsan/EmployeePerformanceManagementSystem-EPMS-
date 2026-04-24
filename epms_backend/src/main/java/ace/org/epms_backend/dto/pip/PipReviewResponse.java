package ace.org.epms_backend.dto.pip;

import lombok.Data;

import java.time.LocalDate;

@Data
public class PipReviewResponse {

    private Long reviewId;
    private Long pipId;

    private LocalDate reviewDate;

    private String progressSummary;
    private String managerFeedback;
    private String nextAction;

    private Long createdBy;
}