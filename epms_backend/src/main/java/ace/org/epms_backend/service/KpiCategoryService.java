package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.PagedResponse;
import ace.org.epms_backend.dto.kpi.KpiCategoryRequest;
import ace.org.epms_backend.dto.kpi.KpiCategoryResponse;

import java.util.List;

public interface KpiCategoryService {
    KpiCategoryResponse createCategory(KpiCategoryRequest request);

    List<KpiCategoryResponse> getAllCategories();

    PagedResponse<KpiCategoryResponse> getCategoriesPaginated(int page, int size, String search);

    KpiCategoryResponse getCategoryById(Long id);

    KpiCategoryResponse updateCategory(Long id, KpiCategoryRequest request);

    void deleteCategory(Long id);
}
