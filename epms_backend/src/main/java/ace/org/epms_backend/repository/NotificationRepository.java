package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.Notification;
import ace.org.epms_backend.model.employee.Employee;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

    List<Notification> findByRecipientIdAndIsDeletedFalseOrderByCreatedAtDesc(Long recipientId);

    long countByRecipientIdAndReadAtIsNullAndIsDeletedFalse(Long recipientId);
    List<Notification> findByRecipientIdAndReadAtIsNullAndIsDeletedFalse(Long recipientId);
    Optional<Notification> findByIdAndRecipientId(Long id, Long recipientId);

}
