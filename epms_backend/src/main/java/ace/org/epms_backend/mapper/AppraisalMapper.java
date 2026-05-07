package ace.org.epms_backend.mapper;

import ace.org.epms_backend.dto.appraisal.AppraisalResponse;
import ace.org.epms_backend.model.appraisal.Appraisal;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AppraisalMapper {

    @Mapping(target = "employeeId", source = "employee.id")
    @Mapping(target = "employeeName", source = "employee.staffName")
    @Mapping(target = "employeeCode", source = "employee.employeeCode")

    @Mapping(target = "managerId", source = "manager.id")
    @Mapping(target = "managerName", source = "manager.staffName")
    @Mapping(target = "cycleId", source = "cycle.cycleId")
    @Mapping(target = "cycleName", source = "cycle.cycleName")
    @Mapping(target = "formId", source = "form.formId")
    @Mapping(target = "formName", source = "form.formName")
    AppraisalResponse toResponse(Appraisal appraisal);

    List<AppraisalResponse> toResponseList(List<Appraisal> appraisals);
}
