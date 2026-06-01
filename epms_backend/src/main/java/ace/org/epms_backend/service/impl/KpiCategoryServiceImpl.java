package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.PagedResponse;
import ace.org.epms_backend.dto.AuditRequest;
import ace.org.epms_backend.dto.kpi.KpiCategoryRequest;
import ace.org.epms_backend.dto.kpi.KpiCategoryResponse;
import ace.org.epms_backend.enums.AuditAction;
import ace.org.epms_backend.enums.AuditStatus;
import ace.org.epms_backend.model.kpi.KpiCategory;
import ace.org.epms_backend.repository.KpiCategoryRepository;
import ace.org.epms_backend.service.AuditService;
import ace.org.epms_backend.service.KpiCategoryService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class KpiCategoryServiceImpl implements KpiCategoryService {
    private final KpiCategoryRepository repository;
    private final AuditService auditService;

    @Override
    public KpiCategoryResponse createCategory(KpiCategoryRequest request) {
        if (repository.existsByNameIgnoreCase(request.getName())) {
            throw new RuntimeException("Category already exists");
        }

        KpiCategory category = KpiCategory.builder()
                .name(request.getName())
                .build();

        category = repository.save(category);
        KpiCategoryResponse response = mapToResponse(category);
        audit(category.getId(), AuditAction.CREATE, null, response);
        return response;
    }

    @Override
    public List<KpiCategoryResponse> getAllCategories() {
        return repository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public PagedResponse<KpiCategoryResponse> getCategoriesPaginated(int page, int size, String search) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("id").ascending());
        Page<KpiCategory> categoryPage;

        if (search != null && !search.trim().isEmpty()) {
            categoryPage = repository.findByNameContainingIgnoreCase(search.trim(), pageable);
        } else {
            categoryPage = repository.findAll(pageable);
        }

        List<KpiCategoryResponse> content = categoryPage.getContent()
                .stream()
                .map(this::mapToResponse)
                .toList();

        return new PagedResponse<>(
                content,
                categoryPage.getNumber(),
                categoryPage.getSize(),
                categoryPage.getTotalElements(),
                categoryPage.getTotalPages(),
                categoryPage.isLast()
        );
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

        KpiCategoryResponse oldState = mapToResponse(category);
        category.setName(request.getName());
        category = repository.save(category);
        KpiCategoryResponse response = mapToResponse(category);
        audit(category.getId(), AuditAction.UPDATE, oldState, response);
        return response;
    }

    @Override
    public void deleteCategory(Long id) {
        KpiCategory category = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));

        KpiCategoryResponse oldState = mapToResponse(category);
        repository.delete(category);
        audit(id, AuditAction.DELETE, oldState, null);
    }

    // 🔹 Mapper
    private KpiCategoryResponse mapToResponse(KpiCategory category) {
        return KpiCategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .build();
    }

    private void audit(Long recordId, AuditAction action, Object oldState, Object newState) {
        auditService.log(AuditRequest.builder()
                .tableName("kpi_category")
                .recordId(recordId)
                .action(action)
                .oldState(oldState)
                .newState(newState)
                .status(AuditStatus.SUCCESS)
                .build());
    }
}
