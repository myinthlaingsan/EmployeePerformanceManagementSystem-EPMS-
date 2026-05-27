package ace.org.epms_backend.dto.idp;

import lombok.Data;

import java.time.Instant;

@Data
public class DevelopmentProgressResponse {
    private Long updateId;
    private Long goalId;
    private String progressNote;
    private Integer progressPercent;
    private Long updatedBy;
    private String updatedByName;
    private Instant createdAt;
}
