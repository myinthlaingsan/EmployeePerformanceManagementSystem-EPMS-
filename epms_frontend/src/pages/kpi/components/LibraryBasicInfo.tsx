import React from 'react';

interface LibraryBasicInfoProps {
  formData: {
    title: string;
    description: string;
    positionId: number;
    targetLevelId: number;
  };
  positions: any[];
  jobLevels: any[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
}

const LibraryBasicInfo: React.FC<LibraryBasicInfoProps> = ({ formData, positions, jobLevels, onChange }) => {
  return (
    <section className="bg-white rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
      <div className="flex gap-4 mb-8">
        <div className="w-1 h-8 bg-[#0052CC] rounded-full"></div>
        <h2 className="text-xl font-black text-[#1A1C1E]">General Information</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Template Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={onChange}
            placeholder="e.g. Q1 Sales Performance Model"
            className="w-full bg-[#F4F5F7] border-none rounded-xl px-5 py-4 text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 transition placeholder-gray-300"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Target Position</label>
          <select
            name="positionId"
            value={formData.positionId}
            onChange={onChange}
            className="w-full bg-[#F4F5F7] border-none rounded-xl px-5 py-4 text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 transition"
          >
            <option value={0}>Select Position</option>
            {positions.map(p => (
              <option key={p.positionId} value={p.positionId}>{p.positionName}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Performance Context Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={onChange}
            rows={4}
            placeholder="Describe the strategic impact and core expectations for this role's performance cycle..."
            className="w-full bg-[#F4F5F7] border-none rounded-2xl px-5 py-4 text-gray-900 font-medium focus:ring-2 focus:ring-blue-500 transition resize-none placeholder-gray-300"
          />
        </div>
      </div>
    </section>
  );
};

export default LibraryBasicInfo;
