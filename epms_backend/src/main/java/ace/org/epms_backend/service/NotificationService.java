package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.notification.NotificationRequest;
import ace.org.epms_backend.dto.notification.NotificationResponse;

import java.util.List;

public interface NotificationService {
    void send(NotificationRequest request);

    void notifyAllEmployees(NotificationRequest request);
    void sendToRole(String roleName, NotificationRequest request);

    List<NotificationResponse> getMyNotifications();

    void markAsRead(Long notificationId);
    void markAllAsRead();

    long getUnreadCount();
}
