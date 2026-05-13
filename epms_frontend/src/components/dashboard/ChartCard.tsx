import React from 'react';

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, children }) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-full">
      <h3 className="text-lg font-semibold text-gray-800 mb-6">{title}</h3>
      <div className="h-[300px] w-full">
        {children}
      </div>
    </div>
  );
};

export default ChartCard;
