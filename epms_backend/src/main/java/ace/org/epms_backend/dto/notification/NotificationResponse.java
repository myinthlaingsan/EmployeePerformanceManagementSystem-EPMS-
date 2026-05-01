package ace.org.epms_backend.dto.notification;

import ace.org.epms_backend.enums.NotificationType;
import ace.org.epms_backend.enums.ReferenceType;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class NotificationResponse {

    private Long id;
    private String title;
    private String message;
    private NotificationType type;
    private ReferenceType referenceType;
    private Long referenceId;
    private String actionUrl;
    private Boolean isRead;
    private Instant createdAt;
}
