package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.notification.NotificationRequest;
import ace.org.epms_backend.dto.notification.NotificationResponse;
import ace.org.epms_backend.mapper.NotificationMapper;
import ace.org.epms_backend.model.Notification;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.NotificationRepository;
import ace.org.epms_backend.service.AuthService;
import ace.org.epms_backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final EmployeeRepository employeeRepository;
    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final AuthService authService;
    private final NotificationMapper notificationMapper;

    @Override
    @Transactional
    public void send(NotificationRequest request) {
        Employee recipient = employeeRepository.findById(request.getRecipientId())
                .orElseThrow(() -> new RuntimeException("Recipient not found"));

        Employee sender = null;
        if (request.getSenderId() != null) {
            sender = employeeRepository.findById(request.getSenderId())
                    .orElseThrow(() -> new RuntimeException("Sender not found"));
        }

        Notification notification = Notification.builder()
                .recipient(recipient)
                .sender(sender)
                .notificationType(request.getType())
                .title(request.getTitle())
                .message(request.getMessage())
                .referenceType(request.getReferenceType())
                .referenceId(request.getReferenceId())
                .actionUrl(request.getActionUrl())
                .build();

        notification = notificationRepository.save(notification);

        // Push real-time notification to specific user
        messagingTemplate.convertAndSendToUser(
                recipient.getEmail(),
                "/queue/notifications",
                notificationMapper.toResponse(notification)
        );
    }

    @Override
    @Transactional
    public void notifyAllEmployees(NotificationRequest request) {
        Employee sender = null;
        if (request.getSenderId() != null) {
            sender = employeeRepository.findById(request.getSenderId())
                    .orElse(null);
        }

        Employee finalSender = sender;
        List<Employee> employees = employeeRepository.findAll();

        List<Notification> notifications = employees.stream()
                .map(emp -> Notification.builder()
                        .recipient(emp)
                        .sender(finalSender)
                        .notificationType(request.getType())
                        .title(request.getTitle())
                        .message(request.getMessage())
                        .referenceType(request.getReferenceType())
                        .referenceId(request.getReferenceId())
                        .actionUrl(request.getActionUrl())
                        .build())
                .collect(Collectors.toList());

        notificationRepository.saveAll(notifications);

        // Push real-time broadcast to all users
        messagingTemplate.convertAndSend(
                "/topic/notifications",
                NotificationResponse.builder()
                        .title(request.getTitle())
                        .message(request.getMessage())
                        .type(request.getType())
                        .referenceType(request.getReferenceType())
                        .referenceId(request.getReferenceId())
                        .actionUrl(request.getActionUrl())
                        .createdAt(Instant.now())
                        .isRead(false)
                        .build()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<NotificationResponse> getMyNotifications() {
        Employee employee = authService.getCurrentUser();
        List<Notification> notifications = notificationRepository
                .findByRecipientAndIsDeletedFalseOrderByCreatedAtDesc(employee);
        return notificationMapper.toResponseList(notifications);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId) {
        Long employeeId = authService.getCurrentUser().getId();
        Notification notification = notificationRepository
                .findByIdAndRecipientId(notificationId, employeeId)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        notification.setReadAt(Instant.now());
        notificationRepository.save(notification);
    }

    @Override
    @Transactional
    public void markAllAsRead() {
        Long employeeId = authService.getCurrentUser().getId();
        List<Notification> unread = notificationRepository
                .findByRecipientIdAndReadAtIsNullAndIsDeletedFalse(employeeId);
        
        unread.forEach(n -> n.setReadAt(Instant.now()));
        notificationRepository.saveAll(unread);
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount() {
        Long employeeId = authService.getCurrentUser().getId();
        return notificationRepository.countByRecipientIdAndReadAtIsNullAndIsDeletedFalse(employeeId);
    }
}

