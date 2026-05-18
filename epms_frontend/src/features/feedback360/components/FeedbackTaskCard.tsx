import React from 'react';
import { ArrowRight } from 'lucide-react';
import StatusBadge from '../../../components/shared/StatusBadge';
import type { FeedbackRequestResponse } from '../feedback360Types';

interface FeedbackTaskCardProps {
  request: FeedbackRequestResponse;
  onAction: (id: number) => void;
}

const FeedbackTaskCard: React.FC<FeedbackTaskCardProps> = ({ request, onAction }) => {
  return (
    <div className="group bg-white p-6 rounded-[2rem] border border-slate-200/60 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex items-center justify-between">
      <div className="flex items-center gap-5">
        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 font-black text-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
          {request.targetUserName.charAt(0)}
        </div>
        <div>
          <h4 className="text-lg font-black text-slate-900">
            {request.targetUserName}
          </h4>
          <div className="flex items-center gap-3 mt-1">
            <StatusBadge type="relationship" value={request.relationship} />
            <span className="text-slate-300">•</span>
            <span className="text-sm text-slate-500 font-medium">{request.targetDepartmentName}</span>
          </div>
        </div>
      </div>
      
      <button
        onClick={() => onAction(request.id)}
        className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-2xl text-sm font-black hover:bg-indigo-600 shadow-lg shadow-slate-200 hover:shadow-indigo-200 transition-all active:scale-95"
      >
        Start Review
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default FeedbackTaskCard;
