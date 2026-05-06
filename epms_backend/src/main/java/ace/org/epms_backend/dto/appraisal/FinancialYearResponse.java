package ace.org.epms_backend.dto.appraisal;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialYearResponse {
    private Long id;
    private String title;
    private LocalDate startDate;
    private LocalDate endDate;

    @JsonProperty("isCurrent")
    public boolean isCurrent() {
        return isCurrent;
    }

    @JsonProperty("isCurrent")
    public void setCurrent(boolean current) {
        isCurrent = current;
    }

    private boolean isCurrent;
}
