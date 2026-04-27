package ace.org.epms_backend.events;

import ace.org.epms_backend.dto.auth.ForgotPasswordEvent;
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
public class ForgotPasswordListener {
    private final EmployeeRepository employeeRepository;
    private final EmailService emailService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handleForgotPassword(ForgotPasswordEvent event) {

        Employee employee = employeeRepository.findById(event.getEmployeeId())
                .orElseThrow(() -> new NotFoundException("Employee not found"));

        String link = "http://localhost:5173/reset-password?token=" + event.getToken();

        String htmlContent = """
                <h3>Password Reset Request</h3>
                <p>Hello %s,</p>
                <p>Click below to reset your password:</p>
                <a href="%s">Reset Password</a>
                <p>This link expires in 30 minutes.</p>
                """.formatted(employee.getStaffName(), link);

        emailService.sendHtmlEmail(
                employee.getEmail(),
                "Reset Password",
                htmlContent
        );
    }
}
