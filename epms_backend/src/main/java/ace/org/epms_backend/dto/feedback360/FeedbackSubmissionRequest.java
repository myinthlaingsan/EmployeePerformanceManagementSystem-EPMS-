package ace.org.epms_backend.dto.feedback360;

import lombok.Data;
import jakarta.validation.Valid;
import java.util.List;

@Data
public class FeedbackSubmissionRequest {
    private Long requestId;
    private String overallComment;
    
    @Valid
    private List<FeedbackResponseRequest> responses;
}
