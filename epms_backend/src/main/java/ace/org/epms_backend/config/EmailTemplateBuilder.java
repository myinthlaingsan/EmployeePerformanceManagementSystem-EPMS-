package ace.org.epms_backend.config;

public class EmailTemplateBuilder {
    public static String buildSetPasswordEmail(String name, String link) {
        return """
                <html>
                    <body>
                        <h2>Hello %s,</h2>
                        <p>Welcome to our system.</p>
                        <p>Please click the button below to set your password:</p>
                        <a href="%s" 
                           style="padding:10px 20px; background-color:#4CAF50; color:white; text-decoration:none;">
                           Set Password
                        </a>
                        <p>This link will expire in 24 hours.</p>
                    </body>
                </html>
                """.formatted(name, link);
    }
}
