package ace.org.epms_backend.mapper.continuous;

import ace.org.epms_backend.dto.continuous.FeedbackTagRequest;
import ace.org.epms_backend.dto.continuous.FeedbackTagResponse;
import ace.org.epms_backend.model.continuous.FeedbackTag;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface FeedbackTagMapper {

    FeedbackTag toEntity(FeedbackTagRequest request);

    FeedbackTagResponse toResponse(FeedbackTag tag);

    void updateEntityFromRequest(FeedbackTagRequest request, @MappingTarget FeedbackTag tag);
}
