package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.notification.NotificationRequest;
import ace.org.epms_backend.dto.notification.NotificationResponse;
import ace.org.epms_backend.mapper.NotificationMapper;
import ace.org.epms_backend.model.Notification;
import ace.org.epms_backend.model.employee.Employee;
import ace.org.epms_backend.repository.*;
import ace.org.epms_backend.service.AuthService;
import ace.org.epms_backend.service.NotificationService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

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
        // @Override
        // public void notifyAllEmployees(String title, String message) {
        //
        // List<Employee> employees = employeeRepo.findAll();
        //
        // for (Employee emp : employees) {
        // Notification n = Notification.builder()
        // .recipient(emp)
        // .title(title)
        // .message(message)
        // .readAt(Instant.now())
        // .build();
        //
        // notificationRepo.save(n);
        // }
        // }
        //
        // @Override
        // public void notifyEmployee(Long employeeId, String title, String message) {
        //
        // Employee emp = employeeRepo.findById(employeeId)
        // .orElseThrow(() -> new RuntimeException("Employee not found"));
        //
        // Notification n = Notification.builder()
        // .recipient(emp)
        // .title(title)
        // .message(message)
        // .readAt(Instant.now())
        // .build();
        //
        // notificationRepo.save(n);
        // }

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

                // Push real-time notification
                messagingTemplate.convertAndSendToUser(
                                recipient.getEmail(),
                                "/queue/notifications",
                                notificationMapper.toResponse(notification));
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

                List<Notification> notifications = employeeRepository.findAll()
                                .stream()
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

                // Push real-time broadcast
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
                                                .build());
        }

        @Override
        public List<NotificationResponse> getMyNotifications() {

                Long employeeId = authService.getCurrentUser().getId();

                return notificationMapper.toResponseList(
                                notificationRepository
                                                .findByRecipientIdAndIsDeletedFalseOrderByCreatedAtDesc(employeeId));
        }

        @Override
        @Transactional
        public void markAsRead(Long notificationId) {
                Long employeeId = authService.getCurrentUser().getId();

                Notification notification = notificationRepository
                                .findByIdAndRecipientId(notificationId, employeeId)
                                .orElseThrow(() -> new RuntimeException("Notification not found"));

                notification.setReadAt(Instant.now());
        }

        @Override
        @Transactional
        public void markAllAsRead() {
                Long employeeId = authService.getCurrentUser().getId();
                List<Notification> unread = notificationRepository
                                .findByRecipientIdAndReadAtIsNullAndIsDeletedFalse(employeeId);
                unread.forEach(n -> n.setReadAt(Instant.now()));
        }

        @Override
        public long getUnreadCount() {
                return notificationRepository.countByRecipientIdAndReadAtIsNullAndIsDeletedFalse(
                                authService.getCurrentUser().getId());
        }
}
