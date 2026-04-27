package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.org.PermissionRequest;
import ace.org.epms_backend.dto.org.PermissionResponse;
import ace.org.epms_backend.model.employee.Permission;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface PermissionMapper {
    @Mapping(target = "permissionId", ignore = true)
    Permission toEntity(PermissionRequest request);

    PermissionResponse toResponse(Permission permission);

    @Mapping(target = "permissionId", ignore = true)
    void updateEntity(PermissionRequest request, @MappingTarget Permission entity);
}
