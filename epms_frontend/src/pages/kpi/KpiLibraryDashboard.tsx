import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetAllLibrariesQuery, useToggleLibraryStatusMutation } from '../../features/kpi/kpiApi';
import { useGetPositionsQuery } from '../../features/org/positionApi';

const KpiLibraryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState<number | 'all'>('all');
  
  const { data: librariesResponse, isLoading, error } = useGetAllLibrariesQuery();
  const { data: positions = [] } = useGetPositionsQuery();
  const [toggleStatus] = useToggleLibraryStatusMutation();

  const libraries = librariesResponse?.data || [];

  const filteredLibraries = libraries.filter(lib => {
    const matchesSearch = lib.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          lib.positionName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPosition = positionFilter === 'all' || lib.positionId === positionFilter;
    return matchesSearch && matchesPosition;
  });

  const handleToggle = async (id: number, currentStatus: boolean) => {
    try {
      await toggleStatus({ id, active: !currentStatus }).unwrap();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">KPI Library</h1>
          <p className="text-gray-500 mt-2 font-medium">Standardize and manage performance templates across the organization.</p>
        </div>
        <button 
          onClick={() => navigate('/kpi/library/new')}
          className="bg-[#0052CC] text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-[#0747A6] transition transform active:scale-95 flex items-center gap-2"
        >
          <span className="text-xl">+</span>
          Create New Template
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <svg className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search templates or positions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-2xl pl-12 pr-6 py-3 text-sm font-medium focus:ring-2 focus:ring-blue-500 transition"
          />
        </div>
        <select 
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
          className="bg-gray-50 border-none rounded-2xl px-6 py-3 text-sm font-bold text-gray-600 focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
        >
          <option value="all">All Positions</option>
          {positions.map(p => (
            <option key={p.positionId} value={p.positionId}>{p.positionName}</option>
          ))}
        </select>
      </div>

      {/* Library Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredLibraries.map((library) => (
          <div 
            key={library.id} 
            className="group bg-white rounded-[2rem] border border-gray-100 p-8 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-2 h-full ${library.isActive ? 'bg-green-500' : 'bg-gray-200'}`}></div>
            
            <div className="flex justify-between items-start mb-6">
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                library.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {library.isActive ? 'Active' : 'Inactive'}
              </span>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => navigate(`/kpi/library/edit/${library.id}`)}
                  className="p-2 text-gray-400 hover:text-blue-600 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              </div>
            </div>

            <h3 className="text-xl font-black text-gray-900 mb-2 leading-tight">{library.title}</h3>
            <p className="text-sm text-gray-400 font-bold uppercase tracking-tighter mb-6">{library.positionName || 'General Position'}</p>
            
            <div className="flex items-center gap-6 mb-8">
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">KPIs</p>
                <p className="text-lg font-black text-gray-700">{library.details?.length || 0}</p>
              </div>
              <div className="h-8 w-px bg-gray-100"></div>
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Level</p>
                <p className="text-lg font-black text-gray-700">{library.targetLevelId ? `L${library.targetLevelId}` : '---'}</p>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => handleToggle(library.id, library.isActive)}
                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition shadow-sm ${
                  library.isActive 
                    ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white' 
                    : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'
                }`}
              >
                {library.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button 
                onClick={() => navigate(`/kpi/library/view/${library.id}`)}
                className="px-4 py-3 bg-gray-50 text-gray-400 rounded-xl hover:bg-gray-100 transition"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </button>
            </div>
          </div>
        ))}

        {filteredLibraries.length === 0 && (
          <div className="col-span-full py-20 text-center bg-gray-50 rounded-[2rem] border border-dashed border-gray-200">
            <p className="text-gray-400 font-bold">No templates found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KpiLibraryDashboard;
