package ace.org.epms_backend.dto.feedback360;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class SubmitFeedbackDTO {
    private Long requestId;
    private String overallComment;
    private List<ResponseDTO> responses;
}
