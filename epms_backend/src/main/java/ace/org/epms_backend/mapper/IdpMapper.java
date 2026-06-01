package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.idp.IdpCreateRequest;
import ace.org.epms_backend.dto.idp.IdpResponse;
import ace.org.epms_backend.model.idp.DevelopmentPlan;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", builder = @org.mapstruct.Builder(disableBuilder = true))
public interface IdpMapper {

    @Mapping(source = "employee.id", target = "employeeId")
    @Mapping(source = "employee.staffName", target = "employeeName")
    @Mapping(source = "manager.id", target = "managerId")
    @Mapping(source = "manager.staffName", target = "managerName")
    @Mapping(source = "appraisal.appraisalId", target = "appraisalId")
    @Mapping(target = "overallProgress", ignore = true)
    @Mapping(target = "goalCount", ignore = true)
    @Mapping(target = "completedGoalCount", ignore = true)
    IdpResponse toResponse(DevelopmentPlan entity);

    @Mapping(target = "idpId", ignore = true)
    @Mapping(target = "employee", ignore = true)
    @Mapping(target = "manager", ignore = true)
    @Mapping(target = "appraisal", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "isActive", constant = "true")
    @Mapping(target = "goals", ignore = true)
    DevelopmentPlan toEntity(IdpCreateRequest request);
}
