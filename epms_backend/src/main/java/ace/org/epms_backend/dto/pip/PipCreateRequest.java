package ace.org.epms_backend.dto.pip;

import lombok.Data;

import java.time.LocalDate;

@Data
public class PipCreateRequest {

    private Long employeeId;
    private Long managerId;

    private LocalDate startDate;
    private LocalDate endDate;

    private String reason;
}