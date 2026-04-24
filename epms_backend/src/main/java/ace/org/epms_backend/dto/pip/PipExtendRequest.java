package ace.org.epms_backend.dto.pip;

import lombok.Data;

import java.time.LocalDate;

@Data
public class PipExtendRequest {
    private LocalDate newEndDate;
}
