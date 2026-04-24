package ace.org.epms_backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@EnableScheduling
@SpringBootApplication
public class EpmsBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(EpmsBackendApplication.class, args);
	}

}
