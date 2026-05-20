package ace.org.epms_backend.dto.feedback360;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackDraftResponse {
    private Long requestId;
    private String overallComment;
    private List<FeedbackDraftItemDTO> responses;
    private Instant savedAt;
}
