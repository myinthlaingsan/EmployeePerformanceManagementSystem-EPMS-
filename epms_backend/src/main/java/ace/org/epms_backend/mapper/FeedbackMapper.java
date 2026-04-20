package ace.org.epms_backend.mapper;


import ace.org.epms_backend.dto.feedback360.FeedbackRequestDTO;
import ace.org.epms_backend.model.feedback360.FeedbackRequest;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring", builder = @org.mapstruct.Builder(disableBuilder = true))
public interface FeedbackMapper {

    @Mapping(source = "id", target = "id")
    @Mapping(source = "targetUser.id", target = "targetUserId")
    @Mapping(source = "evaluator.id", target = "evaluatorId")
    @Mapping(source = "relationship", target = "relationship")
    @Mapping(source = "status", target = "status")
    FeedbackRequestDTO toDTO(FeedbackRequest entity);
}