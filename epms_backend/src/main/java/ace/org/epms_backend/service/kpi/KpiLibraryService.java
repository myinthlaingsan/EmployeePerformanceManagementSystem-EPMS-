package ace.org.epms_backend.service.kpi;

import ace.org.epms_backend.dto.kpi.KpiLibraryRequest;
import ace.org.epms_backend.dto.kpi.KpiLibraryResponse;
import ace.org.epms_backend.dto.PagedResponse;
import java.util.List;

public interface KpiLibraryService {
    KpiLibraryResponse createLibrary(KpiLibraryRequest request);
    List<KpiLibraryResponse> getAllActiveLibraries();
    KpiLibraryResponse toggleLibraryStatus(Long id, boolean status);
    KpiLibraryResponse getLibraryById(Long id);
    KpiLibraryResponse updateLibrary(Long id, KpiLibraryRequest request);
    KpiLibraryResponse cloneLibrary(Long id, String newTitle);
    PagedResponse<KpiLibraryResponse> searchLibraries(String keyword, int page, int size);
}
