package ace.org.epms_backend.mapper.continuous;

import ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse;
import ace.org.epms_backend.model.continuous.PerformanceHistory;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PerformanceHistoryMapper {

    @Mapping(source = "employee.id", target = "employeeId")
    @Mapping(source = "employee.staffName", target = "employeeName")
    @Mapping(source = "manager.id", target = "managerId")
    @Mapping(source = "manager.staffName", target = "managerName")
    @Mapping(source = "performer.id", target = "performerId")
    @Mapping(source = "performer.staffName", target = "performerName")
    PerformanceHistoryResponse toResponse(PerformanceHistory history);
}
