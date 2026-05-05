package ace.org.epms_backend.dto.notification;

import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class NotificationEvent {
    private Long recipientId;
    private Long senderId;
    private NotificationType type;
    private String title;
    private String message;
    private ReferenceType referenceType;
    private Long referenceId;
    private String actionUrl;
    private boolean broadcast;
}
