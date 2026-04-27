import React from 'react';

interface RatingInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  max?: number;
  theme?: 'indigo' | 'emerald';
}

const RatingInput: React.FC<RatingInputProps> = ({ 
  value, 
  onChange, 
  disabled = false, 
  max = 5,
  theme = 'indigo' 
}) => {
  const activeClass = theme === 'indigo' ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-emerald-600 border-emerald-600 text-white';
  const hoverClass = theme === 'indigo' ? 'hover:border-indigo-300' : 'hover:border-emerald-300';

  return (
    <div className="flex gap-3">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          disabled={disabled}
          onClick={() => onChange(star)}
          className={`w-11 h-11 rounded-xl border-2 transition-all font-bold text-sm ${
            value === star 
              ? `${activeClass} scale-110 shadow-lg` 
              : `bg-white border-slate-100 text-slate-400 ${!disabled ? hoverClass : ''}`
          } disabled:cursor-not-allowed disabled:opacity-70`}
        >
          {star}
        </button>
      ))}
    </div>
  );
};

export default RatingInput;
