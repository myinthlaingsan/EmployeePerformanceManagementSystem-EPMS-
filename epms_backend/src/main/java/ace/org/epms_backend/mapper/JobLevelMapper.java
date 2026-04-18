package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.org.JobLevelRequest;
import ace.org.epms_backend.dto.org.JobLevelResponse;
import ace.org.epms_backend.model.employee.JobLevel;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface JobLevelMapper {
    @Mapping(target = "levelId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    JobLevel toEntity(JobLevelRequest request);

    JobLevelResponse toResponse(JobLevel jobLevel);

    @Mapping(target = "levelId", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntity(JobLevelRequest request, @MappingTarget JobLevel jobLevel);
}
