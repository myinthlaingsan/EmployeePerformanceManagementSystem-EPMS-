package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.org.EmployeeDepartmentResponse;
import ace.org.epms_backend.model.employee.EmployeeDepartment;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", builder = @org.mapstruct.Builder(disableBuilder = true))
public interface EmployeeDepartmentMapper {

    @Mapping(source = "employee.id", target = "employeeId")
    @Mapping(source = "currentDepartment.id", target = "currentDepartmentId")
    @Mapping(source = "currentDepartment.departmentName", target = "currentDepartmentName")
    @Mapping(source = "parentDepartment.id", target = "parentDepartmentId")
    @Mapping(source = "parentDepartment.departmentName", target = "parentDepartmentName")
    EmployeeDepartmentResponse toResponse(EmployeeDepartment employeeDepartment);
}
