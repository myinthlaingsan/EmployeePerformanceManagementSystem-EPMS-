package ace.org.epms_backend.service.impl;

import ace.org.epms_backend.dto.appraisal.AppraisalFormRequest;
import ace.org.epms_backend.dto.appraisal.AppraisalFormResponse;
import ace.org.epms_backend.exception.ResourceNotFoundException;
import ace.org.epms_backend.mapper.AppraisalFormMapper;
import ace.org.epms_backend.model.appraisal.AppraisalForm;
import ace.org.epms_backend.repository.AppraisalFormRepository;
import ace.org.epms_backend.service.AppraisalFormService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AppraisalFormServiceImpl implements AppraisalFormService {

    private final AppraisalFormRepository appraisalFormRepository;
    private final AppraisalFormMapper appraisalFormMapper;

    @Override
    @Transactional
    public AppraisalFormResponse create(AppraisalFormRequest request) {
        AppraisalForm form = appraisalFormMapper.toEntity(request);
        form = appraisalFormRepository.save(form);
        return appraisalFormMapper.toResponse(form);
    }

    @Override
    public List<AppraisalFormResponse> getAll() {
        List<AppraisalForm> forms = appraisalFormRepository.findAll();
        return appraisalFormMapper.toResponseList(forms);
    }

    @Override
    public AppraisalFormResponse getById(Long id) {
        AppraisalForm form = getFormById(id);
        return appraisalFormMapper.toResponse(form);
    }

    @Override
    @Transactional
    public AppraisalFormResponse update(Long id, AppraisalFormRequest request) {
        AppraisalForm form = getFormById(id);
        appraisalFormMapper.updateEntityFromRequest(request, form);
        form = appraisalFormRepository.save(form);
        return appraisalFormMapper.toResponse(form);
    }

    @Override
    @Transactional
    public void delete(Long id) {
        if (!appraisalFormRepository.existsById(id)) {
            throw new ResourceNotFoundException("AppraisalForm not found with id: " + id);
        }
        appraisalFormRepository.deleteById(id);
    }

    private AppraisalForm getFormById(Long id) {
        return appraisalFormRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AppraisalForm not found with id: " + id));
    }
}
