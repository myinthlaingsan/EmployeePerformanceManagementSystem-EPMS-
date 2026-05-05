import React from 'react';

const LibrarySyncInfo: React.FC = () => {
  return (
    <div className="bg-blue-50 rounded-xl p-4 flex items-start gap-3 border border-blue-100 shadow-sm">
      <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0">i</div>
      <div>
        <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-0.5">Validation Rules</h4>
        <p className="text-xs text-blue-700 leading-relaxed font-medium">
          Weights must sum to 100% and individual goals cannot exceed 35%.
          Use TAB to navigate cells quickly.
        </p>
      </div>
    </div>
  );
};

export default LibrarySyncInfo;
