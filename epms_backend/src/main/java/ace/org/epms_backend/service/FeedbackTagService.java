package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.continuous.FeedbackTagRequest;
import ace.org.epms_backend.dto.continuous.FeedbackTagResponse;

import java.util.List;

public interface FeedbackTagService {
    FeedbackTagResponse createTag(FeedbackTagRequest request);
    List<FeedbackTagResponse> getAllTags();
    FeedbackTagResponse getTagById(Long tagId);
    FeedbackTagResponse updateTag(Long tagId, FeedbackTagRequest request);
    void deleteTag(Long tagId);
}
