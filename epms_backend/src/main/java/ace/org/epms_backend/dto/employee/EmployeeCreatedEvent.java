package ace.org.epms_backend.dto.employee;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class EmployeeCreatedEvent {
    private final Long employeeId;
    private final String token;
}
