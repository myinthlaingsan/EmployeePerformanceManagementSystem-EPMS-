package ace.org.epms_backend.service.kpi;

import ace.org.epms_backend.dto.kpi.KpiLibraryRequest;
import ace.org.epms_backend.dto.kpi.KpiLibraryResponse;
import ace.org.epms_backend.dto.kpi.KpiImportResult;
import ace.org.epms_backend.dto.PagedResponse;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.util.List;

public interface KpiLibraryService {
    KpiLibraryResponse createLibrary(KpiLibraryRequest request);
    List<KpiLibraryResponse> getAllActiveLibraries();
    KpiLibraryResponse toggleLibraryStatus(Long id, boolean status);
    KpiLibraryResponse getLibraryById(Long id);
    KpiLibraryResponse updateLibrary(Long id, KpiLibraryRequest request);
    KpiLibraryResponse cloneLibrary(Long id, String newTitle);
    PagedResponse<KpiLibraryResponse> searchLibraries(String keyword, int page, int size);
    KpiImportResult importLibraries(MultipartFile file) throws IOException;
    List<KpiLibraryResponse> getLibraryHistory(Long positionId);
    List<KpiLibraryResponse> getAllLibraries();
    KpiLibraryResponse toggleHistoryStatus(Long id, boolean active);
    void deleteLibrary(Long id);
}
