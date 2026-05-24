package ace.org.epms_backend.dto.feedback360;

import lombok.Data;

import java.util.List;

@Data
public class FeedbackDraftRequest {
    private Long requestId;
    private String overallComment;
    private List<FeedbackDraftItemDTO> responses;
}
