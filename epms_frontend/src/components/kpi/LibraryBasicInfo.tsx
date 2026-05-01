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

const LibraryBasicInfo: React.FC<LibraryBasicInfoProps> = ({ formData, positions, onChange }) => {
  return (
    <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">General Information</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">Template Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={onChange}
            placeholder="e.g. Q1 Sales Performance Model"
            className="w-full border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm font-semibold text-gray-700">Target Position</label>
          <select
            name="positionId"
            value={formData.positionId}
            onChange={onChange}
            className="w-full border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value={0}>Select Position</option>
            {positions.map(p => (
              <option key={p.positionId} value={p.positionId}>{p.positionName}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2 space-y-1">
          <label className="text-sm font-semibold text-gray-700">Performance Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={onChange}
            rows={3}
            placeholder="Describe the strategic impact and core expectations..."
            className="w-full border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 transition resize-none"
          />
        </div>
      </div>
    </section>
  );
};

export default LibraryBasicInfo;
