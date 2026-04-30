package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.notification.NotificationResponse;
import ace.org.epms_backend.model.Notification;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface NotificationMapper {
    @Mapping(target = "type", source = "notificationType")
    @Mapping(target = "isRead",
            expression = "java(notification.getReadAt() != null)")
    NotificationResponse toResponse(Notification notification);

    List<NotificationResponse> toResponseList(List<Notification> notifications);
}
