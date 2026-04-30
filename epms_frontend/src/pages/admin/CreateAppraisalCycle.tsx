import React from 'react';
import CycleForm from '../../components/appraisal/CycleForm';
import { Calendar } from 'lucide-react';

const CreateAppraisalCycle: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50/50 py-12 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <div className="p-3 bg-blue-600 rounded-2xl text-white">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Appraisal Management</h1>
            <p className="text-slate-500 font-medium">Configure new review cycles and timelines.</p>
          </div>
        </div>

        <CycleForm />
      </div>
    </div>
  );
};

export default CreateAppraisalCycle;
