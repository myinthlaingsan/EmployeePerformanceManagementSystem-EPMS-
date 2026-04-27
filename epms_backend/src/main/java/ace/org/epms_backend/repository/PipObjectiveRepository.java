package ace.org.epms_backend.repository;

import ace.org.epms_backend.model.pip.PipObjective;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PipObjectiveRepository extends JpaRepository<PipObjective, Long> {

    List<PipObjective> findByPip_PipId(Long pipId);
}