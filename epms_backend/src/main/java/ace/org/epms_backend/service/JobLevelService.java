package ace.org.epms_backend.service;

import ace.org.epms_backend.dto.org.JobLevelRequest;
import ace.org.epms_backend.dto.org.JobLevelResponse;

import java.util.List;

public interface JobLevelService {
    JobLevelResponse createJobLevel(JobLevelRequest request);
    List<JobLevelResponse> getAllJobLevels();
    JobLevelResponse getJobLevelById(Long id);
    JobLevelResponse updateJobLevel(Long id, JobLevelRequest request);
    void deleteJobLevel(Long id);
    List<JobLevelResponse> getJobLevelsByDepartment(Long deptId);
}
