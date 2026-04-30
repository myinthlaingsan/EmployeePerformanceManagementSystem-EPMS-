package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.continuous.FeedbackTagRequest;
import ace.org.epms_backend.dto.continuous.FeedbackTagResponse;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.continuous.FeedbackTagMapper;
import ace.org.epms_backend.model.continuous.FeedbackTag;
import ace.org.epms_backend.repository.FeedbackTagRepository;
import ace.org.epms_backend.service.FeedbackTagService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FeedbackTagServiceImpl implements FeedbackTagService {

    private final FeedbackTagRepository tagRepository;
    private final FeedbackTagMapper tagMapper;

    @Override
    public FeedbackTagResponse createTag(FeedbackTagRequest request) {
        if (tagRepository.existsByTagNameIgnoreCase(request.getTagName())) {
            throw new IllegalArgumentException("Tag with this name already exists");
        }
        FeedbackTag tag = tagMapper.toEntity(request);
        tag = tagRepository.save(tag);
        return tagMapper.toResponse(tag);
    }

    @Override
    public List<FeedbackTagResponse> getAllTags() {
        return tagRepository.findAll().stream()
                .map(tagMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public FeedbackTagResponse getTagById(Long tagId) {
        FeedbackTag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new NotFoundException("Feedback Tag not found with id: " + tagId));
        return tagMapper.toResponse(tag);
    }

    @Override
    public FeedbackTagResponse updateTag(Long tagId, FeedbackTagRequest request) {
        FeedbackTag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new NotFoundException("Feedback Tag not found with id: " + tagId));
        
        if (!tag.getTagName().equalsIgnoreCase(request.getTagName()) &&
                tagRepository.existsByTagNameIgnoreCase(request.getTagName())) {
            throw new IllegalArgumentException("Tag with this name already exists");
        }

        tagMapper.updateEntityFromRequest(request, tag);
        tag = tagRepository.save(tag);
        return tagMapper.toResponse(tag);
    }

    @Override
    public void deleteTag(Long tagId) {
        if (!tagRepository.existsById(tagId)) {
            throw new NotFoundException("Feedback Tag not found with id: " + tagId);
        }
        tagRepository.deleteById(tagId);
    }
}
