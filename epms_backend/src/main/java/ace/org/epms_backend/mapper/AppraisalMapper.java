package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.appraisal.AppraisalResponse;
import ace.org.epms_backend.model.appraisal.Appraisal;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", builder = @org.mapstruct.Builder(disableBuilder = true))
public interface AppraisalMapper {

    @Mapping(target = "employeeId", source = "employee.id")
    @Mapping(target = "managerId", source = "manager.id")
    @Mapping(target = "status", expression = "java(appraisal.getStatus().name())")
    @Mapping(target = "totalScore", expression = "java(appraisal.getTotalScore() != null ? appraisal.getTotalScore().doubleValue() : null)")
    @Mapping(target = "categoryName", source = "performanceCategory.categoryName")
    AppraisalResponse toResponse(Appraisal appraisal);
}
