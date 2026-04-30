package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.Notification;
import ace.org.epms_backend.model.employee.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

//    List<Notification> findByRecipientIdAndIsDeletedFalseOrderByCreatedAtDesc(Long employeeId);
    List<Notification> findByRecipientAndIsDeletedFalseOrderByCreatedAtDesc(Employee recipient);
    long countByRecipientIdAndReadAtIsNullAndIsDeletedFalse(Long employeeId);
    List<Notification> findByRecipientIdAndReadAtIsNullAndIsDeletedFalse(Long employeeId);
    Optional<Notification> findByIdAndRecipientId(Long id, Long employeeId);
    List<Notification> findAllByCreatedAtBeforeAndIsDeletedFalse(Instant date);

}
