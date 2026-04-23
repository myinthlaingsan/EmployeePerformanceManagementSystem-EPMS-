package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.continuous.PerformanceHistoryResponse;
import ace.org.epms_backend.enums.SourceType;
import ace.org.epms_backend.exception.NotFoundException;
import ace.org.epms_backend.mapper.continuous.PerformanceHistoryMapper;
import ace.org.epms_backend.model.continuous.PerformanceHistory;
import ace.org.epms_backend.repository.PerformanceHistoryRepository;
import ace.org.epms_backend.service.PerformanceHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PerformanceHistoryServiceImpl implements PerformanceHistoryService {

    private final PerformanceHistoryRepository historyRepository;
    private final PerformanceHistoryMapper historyMapper;

    @Override
    public List<PerformanceHistoryResponse> getHistoryByEmployee(Long employeeId) {
        return historyRepository.findByEmployee_Id(employeeId).stream()
                .map(historyMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<PerformanceHistoryResponse> getHistoryBySource(SourceType sourceType, Long sourceId) {
        return historyRepository.findBySourceTypeAndSourceId(sourceType, sourceId).stream()
                .map(historyMapper::toResponse)
                .collect(Collectors.toList());
    }

    @Override
    public PerformanceHistoryResponse getHistoryById(Long historyId) {
        PerformanceHistory history = historyRepository.findById(historyId)
                .orElseThrow(() -> new NotFoundException("Performance history not found with id: " + historyId));
        return historyMapper.toResponse(history);
    }
}
