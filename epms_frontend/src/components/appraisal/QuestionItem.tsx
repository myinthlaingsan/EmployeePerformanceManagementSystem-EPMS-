import React from 'react';
import RatingInput from './RatingInput';

interface QuestionItemProps {
  index: number;
  question: string;
  primaryType: 'RATING' | 'TEXT' | 'YESNO';
  secondaryType?: 'RATING' | 'TEXT' | 'YESNO' | 'NONE';
  ratingValue: number;
  isCompleted: boolean | null;
  textValue?: string;
  onRatingChange: (val: number) => void;
  onCompletionChange: (val: boolean) => void;
  onTextChange?: (val: string) => void;
  disabled?: boolean;
  employeeRating?: number;
  employeeCompletion?: boolean | null;
  employeeText?: string;
}

const QuestionItem: React.FC<QuestionItemProps> = ({
  index,
  question,
  primaryType,
  secondaryType = 'NONE',
  ratingValue,
  isCompleted,
  textValue = '',
  onRatingChange,
  onCompletionChange,
  onTextChange,
  disabled,
  employeeRating,
  employeeCompletion,
  employeeText,
}) => {
  
  const renderAssessment = (type: string, isSecondary: boolean) => {
    switch (type) {
      case 'YESNO':
        return (
          <div className="flex gap-2 items-center justify-center h-full px-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onCompletionChange(true)}
              className={`w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center ${isCompleted === true ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm' : 'border-slate-200 hover:border-indigo-400 text-slate-300'}`}
            >
              <span className="text-[10px] font-black">Y</span>
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onCompletionChange(false)}
              className={`w-8 h-8 rounded-lg border-2 transition-all flex items-center justify-center ${isCompleted === false ? 'bg-rose-500 border-rose-500 text-white shadow-sm' : 'border-slate-200 hover:border-rose-400 text-slate-300'}`}
            >
              <span className="text-[10px] font-black">N</span>
            </button>
          </div>
        );
      case 'RATING':
        return (
          <div className="flex gap-1 items-center justify-center h-full px-1">
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                key={rating}
                type="button"
                disabled={disabled}
                onClick={() => onRatingChange(rating)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border-2 transition-all ${ratingValue === rating ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-100 text-slate-300 hover:border-slate-200'}`}
              >
                {rating}
              </button>
            ))}
          </div>
        );
      case 'TEXT':
        return (
          <div className="px-2 py-2 h-full flex items-center">
            <input 
              type="text"
              value={textValue}
              disabled={disabled}
              onChange={(e) => onTextChange?.(e.target.value)}
              placeholder="Your note..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-[40px_1fr_auto_auto] items-stretch border-b border-slate-200 hover:bg-slate-50/50 transition-colors min-h-[64px]">
      {/* Index */}
      <div className="py-4 px-2 text-slate-400 font-bold text-xs border-r border-slate-100 flex items-center justify-center italic bg-slate-50/30">
        {index}
      </div>

      {/* Question */}
      <div className="py-4 px-6 text-slate-700 font-semibold text-sm leading-relaxed border-r border-slate-100 flex items-center">
        {question}
      </div>

      {/* Box 1 (Secondary) */}
      {secondaryType !== 'NONE' && (
        <div className="border-r border-slate-100 min-w-[120px] bg-slate-50/10">
          {renderAssessment(secondaryType, true)}
        </div>
      )}

      {/* Box 2 (Primary) */}
      <div className="min-w-[150px] relative">
        {renderAssessment(primaryType, false)}
        
        {/* Employee Rating Indicator */}
        {employeeRating !== undefined && employeeRating > 0 && (
          <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-black rounded-md border border-amber-200">
            Self: {employeeRating}
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionItem;
