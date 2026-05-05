package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.appraisal.AppraisalSummaryResponse;
import ace.org.epms_backend.model.appraisal.AppraisalSummary;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring", builder = @org.mapstruct.Builder(disableBuilder = true))
public interface AppraisalSummaryMapper {

    @Mapping(target = "employeeId", source = "employee.id")
    @Mapping(target = "employeeName", source = "employee.staffName")
    @Mapping(target = "cycleId", source = "cycle.cycleId")
    @Mapping(target = "cycleName", source = "cycle.cycleName")
    @Mapping(target = "finalScore", source = "totalScore")
    AppraisalSummaryResponse toResponse(AppraisalSummary entity);

    List<AppraisalSummaryResponse> toResponseList(List<AppraisalSummary> entities);
}

