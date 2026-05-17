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
public class KpiImportResult {
    private int totalSectionsFound;
    private int successfulImports;
    private int failedImports;
    private List<String> errors = new ArrayList<>();

    public void addError(String error) {
        this.errors.add(error);
        this.failedImports++;
    }

    public void incrementSuccess() {
        this.successfulImports++;
    }
}
