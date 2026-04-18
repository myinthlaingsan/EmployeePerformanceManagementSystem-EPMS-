package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.org.DepartmentRequest;
import ace.org.epms_backend.dto.org.DepartmentResponse;
import ace.org.epms_backend.model.employee.Department;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface DepartmentMapper {
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "isActive", constant = "true")
    Department toEntity(DepartmentRequest request);

    DepartmentResponse toResponse(Department department);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    void updateEntity(DepartmentRequest request, @MappingTarget Department department);
}
