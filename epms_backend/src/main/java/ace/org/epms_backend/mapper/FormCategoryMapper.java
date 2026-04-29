package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.appraisal.FormCategoryRequest;
import ace.org.epms_backend.dto.appraisal.FormCategoryResponse;
import ace.org.epms_backend.model.appraisal.FormCategory;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import java.util.List;

@Mapper(componentModel = "spring", builder = @org.mapstruct.Builder(disableBuilder = true))
public interface FormCategoryMapper {

    @Mapping(target = "categoryId", ignore = true)
    @Mapping(target = "form", ignore = true)
    @Mapping(target = "isActive", constant = "true")
    FormCategory toEntity(FormCategoryRequest request);

    @Mapping(target = "formId", source = "form.formId")
    FormCategoryResponse toResponse(FormCategory entity);

    List<FormCategoryResponse> toResponseList(List<FormCategory> entities);

    @Mapping(target = "categoryId", ignore = true)
    @Mapping(target = "form", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(FormCategoryRequest request, @MappingTarget FormCategory entity);
}
