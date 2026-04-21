package ace.org.epms_backend.dto.pip;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class PipProgressRequest {

    private Long objectiveId;

    private String progressNote;

    private BigDecimal progressPercent;
}