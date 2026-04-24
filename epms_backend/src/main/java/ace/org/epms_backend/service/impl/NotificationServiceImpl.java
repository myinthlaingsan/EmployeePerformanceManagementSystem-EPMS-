package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.model.Notification;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final EmployeeRepository employeeRepo;
    private final NotificationRepository notificationRepo;

    @Override
    public void notifyAllEmployees(String title, String message) {

        List<Employee> employees = employeeRepo.findAll();

        for (Employee emp : employees) {
            Notification n = Notification.builder()
                    .recipient(emp)
                    .title(title)
                    .message(message)
                    .isRead(false)
                    .build();

            notificationRepo.save(n);
        }
    }

    @Override
    public void notifyEmployee(Long employeeId, String title, String message) {

        Employee emp = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new RuntimeException("Employee not found"));

        Notification n = Notification.builder()
                .recipient(emp)
                .title(title)
                .message(message)
                .isRead(false)
                .build();

        notificationRepo.save(n);
    }
}
