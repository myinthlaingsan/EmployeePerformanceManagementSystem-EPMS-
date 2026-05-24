import React from 'react';
import CycleForm from '../../components/appraisal/CycleForm';
import { Calendar } from 'lucide-react';

const CreateAppraisalCycle: React.FC = () => {
  return (
    <div className="space-y-4 pb-8">
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EEF3FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Calendar size={18} color="#1A56DB" />
          </div>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 500, color: '#111827' }}>Appraisal Management</h1>
            <p style={{ fontSize: 12, color: '#9EA3B0', marginTop: 2 }}>Configure new review cycles and timelines.</p>
          </div>
        </div>
      </div>

      <CycleForm />
    </div>
  );
};

export default CreateAppraisalCycle;
