package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.kpi.KpiCategoryRequest;
import ace.org.epms_backend.dto.kpi.KpiCategoryResponse;
import ace.org.epms_backend.model.kpi.KpiCategory;
import ace.org.epms_backend.repository.KpiCategoryRepository;
import ace.org.epms_backend.service.KpiCategoryService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class KpiCategoryServiceImpl implements KpiCategoryService {
    private final KpiCategoryRepository repository;

    @Override
    public KpiCategoryResponse createCategory(KpiCategoryRequest request) {
        if (repository.existsByNameIgnoreCase(request.getName())) {
            throw new RuntimeException("Category already exists");
        }

        KpiCategory category = KpiCategory.builder()
                .name(request.getName())
                .build();

        return mapToResponse(repository.save(category));
    }

    @Override
    public List<KpiCategoryResponse> getAllCategories() {
        return repository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public KpiCategoryResponse getCategoryById(Long id) {
        KpiCategory category = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        return mapToResponse(category);
    }

    @Override
    public KpiCategoryResponse updateCategory(Long id, KpiCategoryRequest request) {
        KpiCategory category = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        if (!category.getName().equalsIgnoreCase(request.getName())
                && repository.existsByNameIgnoreCase(request.getName())) {
            throw new RuntimeException("Category name already exists");
        }

        category.setName(request.getName());
        return mapToResponse(repository.save(category));
    }

    @Override
    public void deleteCategory(Long id) {
        KpiCategory category = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        repository.delete(category);
    }

    // 🔹 Mapper
    private KpiCategoryResponse mapToResponse(KpiCategory category) {
        return KpiCategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .build();
    }
}
