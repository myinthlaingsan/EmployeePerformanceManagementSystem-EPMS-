import { Info } from 'lucide-react';

interface SuppressionNoticeProps {
  relationship?: string;
}

const REL_LABEL: Record<string, string> = {
  DIRECT_MANAGER: 'manager',
  PEER:           'peer',
  SUBORDINATE:    'subordinate',
  SELF:           'self',
};

const SuppressionNotice = ({ relationship }: SuppressionNoticeProps) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 12px',
    background: '#F5F6F8',
    borderRadius: 8,
    fontSize: 12,
    color: '#9EA3B0',
  }}>
    <Info size={14} color="#9EA3B0" />
    <span>
      {relationship
        ? `${REL_LABEL[relationship] ?? relationship} comments hidden — fewer than the minimum required.`
        : 'Comments from this group are hidden — fewer than the minimum required.'}
    </span>
  </div>
);

export default SuppressionNotice;
