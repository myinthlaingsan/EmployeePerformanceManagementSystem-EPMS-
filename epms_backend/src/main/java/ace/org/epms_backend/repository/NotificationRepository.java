package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.Notification;
import ace.org.epms_backend.model.employee.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipient(Employee employee);

    List<Notification> findByRecipientAndIsReadFalse(Employee employee);

}
