package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.appraisal.AppraisalResponse;
import ace.org.epms_backend.dto.appraisal.AppraisalUpdateRequest;
import ace.org.epms_backend.model.appraisal.Appraisal;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", builder = @org.mapstruct.Builder(disableBuilder = true))
public interface AppraisalMapper {

    @Mapping(target = "employeeId", source = "employee.id")
    @Mapping(target = "managerId", source = "manager.id")
    @Mapping(target = "status", expression = "java(appraisal.getStatus().name())")
    @Mapping(target = "totalScore", expression = "java(appraisal.getTotalScore() != null ? appraisal.getTotalScore().doubleValue() : null)")
    @Mapping(target = "categoryName", source = "performanceCategory.name")
    AppraisalResponse toResponse(Appraisal appraisal);

    @Mapping(target = "appraisalId", ignore = true)
    @Mapping(target = "employee", ignore = true)
    @Mapping(target = "manager", ignore = true)
    @Mapping(target = "cycle", ignore = true)
    @Mapping(target = "form", ignore = true)
    @Mapping(target = "performanceCategory", ignore = true)
    @Mapping(target = "totalScore", ignore = true)
    @Mapping(target = "performanceGrade", ignore = true)
    @Mapping(target = "employeeSigned", ignore = true)
    @Mapping(target = "managerSigned", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "isLocked", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(AppraisalUpdateRequest request, @MappingTarget Appraisal entity);
}
