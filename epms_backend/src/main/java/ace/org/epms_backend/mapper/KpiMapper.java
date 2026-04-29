package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.kpi.*;
import ace.org.epms_backend.model.kpi.*;
import org.mapstruct.*;

import java.util.List;

@Mapper(componentModel = "spring", builder = @Builder(disableBuilder = true))
public interface KpiMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "position", ignore = true)
    @Mapping(target = "isActive", expression = "java(true)")
    KpiLibrary toLibraryEntity(KpiLibraryRequest request);

    @Mapping(target = "positionName", source = "position.positionName")
    @Mapping(target = "details", source = "details")
    KpiLibraryResponse toLibraryResponse(KpiLibrary library);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "library", ignore = true)
    @Mapping(target = "isActive", expression = "java(true)")
    @Mapping(target = "category", ignore = true)
    KpiLibraryDetails toLibraryDetailEntity(KpiLibraryDetailRequest request);

    @Mapping(target = "categoryName", source = "category.name")
    KpiLibraryDetailResponse toLibraryDetailResponse(KpiLibraryDetails details);

    List<KpiLibraryDetailResponse> toLibraryDetailResponseList(List<KpiLibraryDetails> details);

    @Mapping(target = "employeeId", source = "employee.id")
    @Mapping(target = "managerId", source = "manager.id")
    @Mapping(target = "employeeName", source = "employee.staffName")
    @Mapping(target = "managerName", source = "manager.staffName")
    @Mapping(target = "appraisalCycleId", source = "cycle.cycleId")
    @Mapping(target = "appraisalCycleName", source = "cycle.cycleName")
    @Mapping(target = "items", source = "items")
    GoalSetResponse toGoalSetResponse(KpiGoals goalSet);

    @Mapping(target = "currentProgress", ignore = true)
    @Mapping(target = "categoryName", source = "category.name")
    GoalItemResponse toGoalItemResponse(KpiGoalItem item);

    List<GoalItemResponse> toGoalItemResponseList(List<KpiGoalItem> items);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "goalItem", ignore = true)
    @Mapping(target = "updatedBy", ignore = true)
    KpiProgress toProgressEntity(ProgressRequest request);

    @Mapping(target = "employeeId", source = "employee.id")
    @Mapping(target = "employeeName", source = "employee.staffName")
    @Mapping(target = "cycleId", source = "goalSet.cycle.cycleId")
    KpiScoreResponse toScoreResponse(KpiFinalScore finalScore);
}
