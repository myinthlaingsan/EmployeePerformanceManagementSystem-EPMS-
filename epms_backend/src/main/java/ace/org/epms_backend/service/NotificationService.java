package ace.org.epms_backend.service;

public interface NotificationService {
    void notifyAllEmployees(String title, String message);
    void notifyEmployee(Long employeeId, String title, String message);
}
