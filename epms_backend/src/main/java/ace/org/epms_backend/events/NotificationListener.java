package ace.org.epms_backend.events;

import ace.org.epms_backend.dto.notification.NotificationEvent;
import ace.org.epms_backend.dto.notification.NotificationRequest;
import ace.org.epms_backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class NotificationListener {

    private final NotificationService notificationService;

    @Async
    @EventListener
    public void handleNotificationEvent(NotificationEvent event) {
        System.out.println(">>> [DEBUG NotificationListener] Caught NotificationEvent: type=" + event.getType() 
            + ", recipientId=" + event.getRecipientId() 
            + ", title=\"" + event.getTitle() + "\""
            + ", broadcast=" + event.isBroadcast()
            + ", targetRole=" + event.getTargetRole());
        try {
            NotificationRequest request = NotificationRequest.builder()
                    .recipientId(event.getRecipientId())
                    .senderId(event.getSenderId())
                    .type(event.getType())
                    .title(event.getTitle())
                    .message(event.getMessage())
                    .referenceType(event.getReferenceType())
                    .referenceId(event.getReferenceId())
                    .actionUrl(event.getActionUrl())
                    .build();

            if (event.getTargetRole() != null) {
                System.out.println(">>> [DEBUG NotificationListener] Sending to role: " + event.getTargetRole());
                notificationService.sendToRole(event.getTargetRole(), request);
            } else if (event.isBroadcast()) {
                System.out.println(">>> [DEBUG NotificationListener] Broadcasting to all employees...");
                notificationService.notifyAllEmployees(request);
            } else {
                System.out.println(">>> [DEBUG NotificationListener] Sending private notification to recipient ID: " + event.getRecipientId());
                notificationService.send(request);
            }
            System.out.println(">>> [DEBUG NotificationListener] Successfully processed NotificationEvent!");
        } catch (Exception e) {
            System.err.println(">>> [DEBUG NotificationListener] ERROR: Failed to handle NotificationEvent!");
            e.printStackTrace();
        }
    }
}
