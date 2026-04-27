package ace.org.epms_backend.events;

import ace.org.epms_backend.config.EmailTemplateBuilder;
import ace.org.epms_backend.dto.employee.EmployeeCreatedEvent;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class EmployeeCreatedListener {

    private final EmployeeRepository employeeRepository;
    private final EmailService emailService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleEmployeeCreated(EmployeeCreatedEvent event){
        Employee employee = employeeRepository.findById(event.getEmployeeId())
                .orElseThrow(() -> new NotFoundException("Employee not found"));
        String link = "http://localhost:5173/set-password?token=" + event.getToken();

        String htmlContent = EmailTemplateBuilder.buildSetPasswordEmail(
                employee.getStaffName(),
                link
        );
        emailService.sendHtmlEmail(
                employee.getEmail(),
                "Set Your Password",
                htmlContent
        );
    }
}
