import React from 'react';

interface FormProgressProps {
  currentSection: number;
  totalSections: number;
  categoryName: string;
}

const FormProgress: React.FC<FormProgressProps> = ({ currentSection, totalSections, categoryName }) => {
  const progress = ((currentSection + 1) / totalSections) * 100;

  return (
    <div className="space-y-3">
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-600 transition-all duration-700 ease-out shadow-[0_0_15px_rgba(79,70,229,0.5)]"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
          Section {currentSection + 1} of {totalSections}
        </span>
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
          {categoryName}
        </span>
      </div>
    </div>
  );
};

export default FormProgress;
