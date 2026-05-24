package ace.org.epms_backend.dto.dashboard;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentCountsDTO {
    private long praise;
    private long improvement;
    private long correction;
}
