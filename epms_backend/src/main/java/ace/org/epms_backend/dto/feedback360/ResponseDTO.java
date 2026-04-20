package ace.org.epms_backend.dto.feedback360;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResponseDTO {
    private Long questionId;
    private Integer score;
    private String comment;
}
