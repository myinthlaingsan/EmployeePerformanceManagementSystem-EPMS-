package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.org.RoleRequest;
import ace.org.epms_backend.dto.org.RoleResponse;
import ace.org.epms_backend.model.employee.Role;
import org.mapstruct.*;

@Mapper(componentModel = "spring", builder = @Builder(disableBuilder = true))
public interface RoleMapper {

    @Mapping(target = "roleId", ignore = true)
    Role toEntity(RoleRequest request);

    RoleResponse toResponse(Role role);

    @Mapping(target = "roleId", ignore = true)
    void updateEntity(RoleRequest request, @MappingTarget Role role);
}