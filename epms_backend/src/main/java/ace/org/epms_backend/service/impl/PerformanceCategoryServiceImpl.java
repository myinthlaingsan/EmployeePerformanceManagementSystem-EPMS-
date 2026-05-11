package ace.org.epms_backend.service.impl;
 
import ace.org.epms_backend.dto.appraisal.PerformanceCategoryRequest;
import ace.org.epms_backend.dto.appraisal.PerformanceCategoryResponse;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.PerformanceCategory;
import ace.org.epms_backend.repository.PerformanceCategoryRepository;
import ace.org.epms_backend.service.PerformanceCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
 
import java.util.List;
import java.util.stream.Collectors;
 
@Service
@RequiredArgsConstructor
public class PerformanceCategoryServiceImpl implements PerformanceCategoryService {
 
    private final PerformanceCategoryRepository repository;
 
    @Override
    @Transactional
    public PerformanceCategoryResponse create(PerformanceCategoryRequest request) {
        PerformanceCategory category = new PerformanceCategory();
        mapToEntity(category, request);
        return mapToResponse(repository.save(category));
    }
 
    @Override
    @Transactional
    public PerformanceCategoryResponse update(Long id, PerformanceCategoryRequest request) {
        PerformanceCategory category = repository.findById(id)
                .orElseThrow(() -> new NotFoundException("Performance Category not found"));
        mapToEntity(category, request);
        return mapToResponse(repository.save(category));
    }
 
    @Override
    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw new NotFoundException("Performance Category not found");
        }
        repository.deleteById(id);
    }
 
    @Override
    public PerformanceCategoryResponse getById(Long id) {
        return repository.findById(id)
                .map(this::mapToResponse)
                .orElseThrow(() -> new NotFoundException("Performance Category not found"));
    }
 
    @Override
    public List<PerformanceCategoryResponse> getAll() {
        return repository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
 
    private void mapToEntity(PerformanceCategory entity, PerformanceCategoryRequest request) {
        entity.setName(request.getName());
        entity.setMinScore(request.getMinScore());
        entity.setMaxScore(request.getMaxScore());
        entity.setRatingValue(request.getRatingValue());
        entity.setGrade(request.getGrade());
        entity.setDescription(request.getDescription());
    }
 
    private PerformanceCategoryResponse mapToResponse(PerformanceCategory entity) {
        return PerformanceCategoryResponse.builder()
                .id(entity.getId())
                .name(entity.getName())
                .minScore(entity.getMinScore())
                .maxScore(entity.getMaxScore())
                .ratingValue(entity.getRatingValue())
                .grade(entity.getGrade())
                .description(entity.getDescription())
                .build();
    }
}
