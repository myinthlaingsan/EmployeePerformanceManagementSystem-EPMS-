package ace.org.epms_backend.mapper.continuous;

import ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse;
import ace.org.epms_backend.model.continuous.PerformanceHistory;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PerformanceHistoryMapper {

    @Mapping(source = "employee.id", target = "employeeId")
    @Mapping(source = "employee.staffName", target = "employeeName")
    PerformanceHistoryResponse toResponse(PerformanceHistory history);
}
