package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.kpi.*;
import ace.org.epms_backend.model.kpi.*;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", builder = @Builder(disableBuilder = true))
public interface KpiMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "position", ignore = true)
    @Mapping(target = "isActive", constant = "true")
    KpiLibrary toLibraryEntity(KpiLibraryRequest request);

    @Mapping(target = "positionName", source = "position.positionName")
    KpiLibraryResponse toLibraryResponse(KpiLibrary library);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "library", ignore = true)
    @Mapping(target = "isActive", constant = "true")
    KpiLibraryDetails toLibraryDetailEntity(KpiLibraryDetailRequest request);

    KpiLibraryDetailResponse toLibraryDetailResponse(KpiLibraryDetails details);

    List<KpiLibraryDetailResponse> toLibraryDetailResponseList(List<KpiLibraryDetails> details);

    @Mapping(target = "employeeName", source = "employee.staffName")
    @Mapping(target = "managerName", source = "manager.staffName")
    GoalSetResponse toGoalSetResponse(KpiGoals goalSet);

    @Mapping(target = "currentProgress", ignore = true) // Will be calculated in service
    GoalItemResponse toGoalItemResponse(KpiGoalItem item);

    List<GoalItemResponse> toGoalItemResponseList(List<KpiGoalItem> items);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "goalItem", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    KpiProgress toProgressEntity(ProgressRequest request);
}
