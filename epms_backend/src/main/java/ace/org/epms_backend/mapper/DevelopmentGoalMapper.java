package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.idp.DevelopmentGoalRequest;
import ace.org.epms_backend.dto.idp.DevelopmentGoalResponse;
import ace.org.epms_backend.model.idp.DevelopmentGoal;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", builder = @org.mapstruct.Builder(disableBuilder = true))
public interface DevelopmentGoalMapper {

    @Mapping(source = "plan.idpId", target = "idpId")
    DevelopmentGoalResponse toResponse(DevelopmentGoal entity);

    @Mapping(target = "goalId", ignore = true)
    @Mapping(target = "plan", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "progressPercent", ignore = true)
    @Mapping(target = "managerComment", ignore = true)
    @Mapping(target = "employeeComment", ignore = true)
    @Mapping(target = "updates", ignore = true)
    DevelopmentGoal toEntity(DevelopmentGoalRequest request);
}
