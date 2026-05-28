package ace.org.epms_backend.dto.employee;

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
public class EmployeeImportResult {
    private int totalRows;
    private int successfulImports;
    private int failedImports;
    private List<String> errors = new ArrayList<>();

    public void incrementTotalRows() {
        this.totalRows++;
    }

    public void incrementSuccess() {
        this.successfulImports++;
    }

    public void addError(String error) {
        this.errors.add(error);
        this.failedImports++;
    }
}
