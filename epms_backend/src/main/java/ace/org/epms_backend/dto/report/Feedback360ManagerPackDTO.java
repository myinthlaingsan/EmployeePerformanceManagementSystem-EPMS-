package ace.org.epms_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Feedback360ManagerPackDTO {
    private String managerName;
    private String cycleName;
    private List<Feedback360ManagerPackItemDTO> items;
}
