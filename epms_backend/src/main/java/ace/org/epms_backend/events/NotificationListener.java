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

        if (event.isBroadcast()) {
            notificationService.notifyAllEmployees(request);
        } else {
            notificationService.send(request);
        }
    }
}
