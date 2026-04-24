package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.pip.PipReviewRequest;
import ace.org.epms_backend.dto.pip.PipReviewResponse;
import ace.org.epms_backend.model.pip.PipReview;
import org.mapstruct.*;

@Mapper(componentModel = "spring")
public interface PipReviewMapper {

    // =========================
    // ENTITY → RESPONSE
    // =========================
    @Mapping(source = "pip.pipId", target = "pipId")
    PipReviewResponse toResponse(PipReview entity);

    // =========================
    // DTO → ENTITY (CREATE)
    // =========================
    @Mapping(target = "reviewId", ignore = true)
    @Mapping(target = "pip", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "isActive", expression = "java(true)")
    PipReview toEntity(PipReviewRequest request);

    // =========================
    // OPTIONAL UPDATE SUPPORT
    // =========================
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "reviewId", ignore = true)
    @Mapping(target = "pip", ignore = true)
    @Mapping(target = "createdBy", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    void updateEntity(PipReviewRequest request, @MappingTarget PipReview entity);
}