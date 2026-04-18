package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.org.JobLevelRequest;
import ace.org.epms_backend.dto.org.JobLevelResponse;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.JobLevelMapper;
import ace.org.epms_backend.model.employee.JobLevel;
import ace.org.epms_backend.repository.EmployeeRepository;
import ace.org.epms_backend.repository.JobLevelRepository;
import ace.org.epms_backend.service.JobLevelService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class JobLevelServiceImpl implements JobLevelService {

    private final JobLevelRepository jobLevelRepository;
    private final EmployeeRepository employeeRepository;
    private final JobLevelMapper jobLevelMapper;

    @Override
    public JobLevelResponse createJobLevel(JobLevelRequest request) {
        if (jobLevelRepository.existsByLevelCode(request.getLevelCode())) {
            throw new RuntimeException("Job level code already exists");
        }
        if (jobLevelRepository.existsByLevelRank(request.getLevelRank())) {
            throw new RuntimeException("Job level rank already exists");
        }
        JobLevel jobLevel = jobLevelMapper.toEntity(request);
        jobLevel = jobLevelRepository.save(jobLevel);
        return jobLevelMapper.toResponse(jobLevel);
    }

    @Override
    public List<JobLevelResponse> getAllJobLevels() {
        return jobLevelRepository.findAll().stream()
                .map(jobLevelMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public JobLevelResponse getJobLevelById(Long id) {
        JobLevel jobLevel = jobLevelRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Job level not found"));
        return jobLevelMapper.toResponse(jobLevel);
    }

    @Override
    public JobLevelResponse updateJobLevel(Long id, JobLevelRequest request) {
        JobLevel jobLevel = jobLevelRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Job level not found"));

        if (!jobLevel.getLevelCode().equals(request.getLevelCode()) &&
            jobLevelRepository.existsByLevelCode(request.getLevelCode())) {
            throw new RuntimeException("Job level code already exists");
        }
        if (!jobLevel.getLevelRank().equals(request.getLevelRank()) &&
            jobLevelRepository.existsByLevelRank(request.getLevelRank())) {
            throw new RuntimeException("Job level rank already exists");
        }

        jobLevelMapper.updateEntity(request, jobLevel);
        jobLevel = jobLevelRepository.save(jobLevel);
        return jobLevelMapper.toResponse(jobLevel);
    }

    @Override
    public void deleteJobLevel(Long id) {
        JobLevel jobLevel = jobLevelRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Job level not found"));

        if (employeeRepository.existsByLevel(jobLevel)) {
            throw new RuntimeException("Cannot delete job level as it is assigned to one or more employees");
        }

        jobLevelRepository.delete(jobLevel);
    }
}
