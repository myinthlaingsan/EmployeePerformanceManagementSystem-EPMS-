package ace.org.epms_backend.mapper.continuous;

import ace.org.epms_backend.dto.continuous.ContinuousFeedbackRequest;
import ace.org.epms_backend.dto.continuous.ContinuousFeedbackResponse;
import ace.org.epms_backend.model.continuous.ContinuousFeedback;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", uses = {FeedbackTagMapper.class}, nullValuePropertyMappingStrategy = org.mapstruct.NullValuePropertyMappingStrategy.IGNORE)
public interface ContinuousFeedbackMapper {

    @Mapping(target = "employee", ignore = true)
    @Mapping(target = "manager", ignore = true)
    @Mapping(target = "tag", ignore = true)
    ContinuousFeedback toEntity(ContinuousFeedbackRequest request);

    @Mapping(source = "employee.id", target = "employeeId")
    @Mapping(source = "employee.staffName", target = "employeeName")
    @Mapping(source = "manager.id", target = "managerId")
    @Mapping(source = "manager.staffName", target = "managerName")
    ContinuousFeedbackResponse toResponse(ContinuousFeedback feedback);

    @Mapping(target = "employee", ignore = true)
    @Mapping(target = "manager", ignore = true)
    @Mapping(target = "tag", ignore = true)
    void updateEntityFromRequest(ContinuousFeedbackRequest request, @MappingTarget ContinuousFeedback feedback);
}
