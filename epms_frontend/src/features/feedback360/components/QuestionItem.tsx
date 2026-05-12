import React from 'react';
import { MessageSquare } from 'lucide-react';
import StarRating from '../../../components/shared/StarRating';
import type { FormField } from '../feedback360Types';

interface QuestionItemProps {
  question: FormField;
  index: number;
  score: number;
  comment: string;
  onScoreChange: (score: number) => void;
  onCommentChange: (comment: string) => void;
}

const QuestionItem: React.FC<QuestionItemProps> = ({
  question,
  index,
  score,
  comment,
  onScoreChange,
  onCommentChange
}) => {
  return (
    <div className="space-y-8 group">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
        <div className="space-y-2 max-w-xl">
          <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">Question {index + 1}</span>
          <p className="text-lg font-black text-slate-800 leading-relaxed">
            {question.questionText}
            <span className="text-indigo-500 ml-1">*</span>
          </p>
        </div>
        
        <StarRating 
          rating={score} 
          onRatingChange={onScoreChange}
          size={48}
        />
      </div>

      <div className="relative">
        <div className="absolute left-6 top-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
          <MessageSquare className="w-5 h-5" />
        </div>
        <textarea
          placeholder="Provide additional context or specific examples (optional)..."
          value={comment}
          onChange={(e) => onCommentChange(e.target.value)}
          rows={2}
          className="w-full bg-slate-50 border border-slate-100 rounded-[1.5rem] pl-16 pr-8 py-5 text-sm font-medium outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 focus:bg-white transition-all resize-none"
        />
      </div>
    </div>
  );
};

export default QuestionItem;
