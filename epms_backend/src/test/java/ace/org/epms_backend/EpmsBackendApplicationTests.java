package ace.org.epms_backend;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import net.sf.jasperreports.engine.JasperCompileManager;

import java.io.InputStream;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.fail;

@SpringBootTest
class EpmsBackendApplicationTests {

	@Test
	void contextLoads() {
	}

	@Test
	void testAllReportTemplatesCompile() {
		try {
			PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
			Resource[] resources = resolver.getResources("classpath:reports/**/*.jrxml");
			for (Resource resource : resources) {
				System.out.println("Compiling report template: " + resource.getFilename());
				try (InputStream is = resource.getInputStream()) {
					assertNotNull(JasperCompileManager.compileReport(is), "Failed to compile: " + resource.getFilename());
				}
			}
		} catch (Exception e) {
			e.printStackTrace();
			fail("Compilation of report templates failed: " + e.getMessage());
		}
	}

}
