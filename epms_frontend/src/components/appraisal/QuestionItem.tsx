import React from 'react';
import RatingInput from './RatingInput';

interface QuestionItemProps {
  question: string;
  value: number;
  onChange: (val: number) => void;
  disabled?: boolean;
  employeeRating?: number; // Read-only view for manager
}

const QuestionItem: React.FC<QuestionItemProps> = ({
  question,
  value,
  onChange,
  disabled,
  employeeRating
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 border-b border-gray-50 last:border-0">
      <div className="flex-1">
        <p className="text-gray-800 font-medium leading-relaxed">{question}</p>
        {employeeRating !== undefined && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs font-bold text-gray-400 uppercase">Employee Rating:</span>
            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-black">{employeeRating}</span>
          </div>
        )}
      </div>
      <div className="shrink-0">
        <RatingInput value={value} onChange={onChange} disabled={disabled} />
      </div>
    </div>
  );
};

export default QuestionItem;
