import React from 'react';

const LibrarySyncInfo: React.FC = () => {
  return (
    <div className="mt-10 bg-[#E9F2FF] rounded-2xl p-6 flex items-start gap-5 border border-[#D0E4FF] shadow-sm">
      <div className="w-8 h-8 bg-[#0052CC] rounded-full flex items-center justify-center text-white font-bold italic shrink-0 shadow-md">i</div>
      <div>
        <h4 className="text-[10px] font-black text-[#0052CC] uppercase tracking-widest mb-1">Spreadsheet Sync</h4>
        <p className="text-xs font-bold text-[#4C81CC] leading-relaxed">
          Changes are auto-validated against role-level benchmarks. Use TAB to navigate cells quickly. 
          Weights must sum to 100% and individual goals cannot exceed 35%.
        </p>
      </div>
    </div>
  );
};

export default LibrarySyncInfo;
