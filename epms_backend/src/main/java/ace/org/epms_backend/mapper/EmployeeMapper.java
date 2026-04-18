package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.employee.CreateEmployeeRequest;
import ace.org.epms_backend.dto.employee.EmployeeResponse;
import ace.org.epms_backend.model.employee.Employee;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", builder = @org.mapstruct.Builder(disableBuilder = true))
public interface EmployeeMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "employeeCode", ignore = true)
    @Mapping(target = "position", ignore = true)
    @Mapping(target = "level", ignore = true)
    @Mapping(target = "status", constant = "PENDING")
    @Mapping(target = "isActive", constant = "true")
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Employee toEntity(CreateEmployeeRequest request);

    @Mapping(source = "position.positionName", target = "positionName")
    @Mapping(source = "level.levelName", target = "levelName")
    EmployeeResponse toResponse(Employee employee);
}
