package ace.org.epms_backend.dto.kpi;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KpiParseResult {
    @Builder.Default
    private List<KpiLibraryRequest> requests = new ArrayList<>();
    
    @Builder.Default
    private List<String> errors = new ArrayList<>();

    public void addRequest(KpiLibraryRequest request) {
        this.requests.add(request);
    }

    public void addError(String error) {
        this.errors.add(error);
    }

    public boolean hasErrors() {
        return !errors.isEmpty();
    }
}
