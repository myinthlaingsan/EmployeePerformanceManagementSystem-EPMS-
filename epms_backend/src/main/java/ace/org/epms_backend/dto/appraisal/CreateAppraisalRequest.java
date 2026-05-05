package ace.org.epms_backend.dto.appraisal;

import lombok.Data;

import java.util.List;

@Data
public class CreateAppraisalRequest {

    private Long cycleId;
    private Long formId;
    private List<Long> employeeIds;
}
