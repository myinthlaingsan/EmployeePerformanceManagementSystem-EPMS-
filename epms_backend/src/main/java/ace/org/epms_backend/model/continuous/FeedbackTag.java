package ace.org.epms_backend.model.continuous;

import ace.org.epms_backend.model.BaseEntity;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

@Entity
@Table(name = "feedback_tag")
@SQLDelete(sql = "UPDATE feedback_tag SET is_deleted = true, deleted_at = NOW() WHERE tag_id = ?")
@SQLRestriction("is_deleted = false OR is_deleted IS NULL")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
@SuperBuilder
public class FeedbackTag extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long tagId;

    @Column(nullable = false)
    private String tagName;
}
