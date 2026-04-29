import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetAllLibrariesQuery, useToggleLibraryStatusMutation } from '../../features/kpi/kpiApi';
import { useGetPositionsQuery } from '../../features/org/positionApi';

const KpiLibraryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState<number | 'all'>('all');
  
  const { data: librariesResponse, isLoading } = useGetAllLibrariesQuery();
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
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">KPI Library</h1>
          <p className="text-gray-600 mt-1">Manage performance templates across the organization.</p>
        </div>
        <button 
          onClick={() => navigate('/kpi/library/new')}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold shadow-sm hover:bg-blue-700 transition flex items-center gap-2"
        >
          <span>+</span>
          Create New Template
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <svg className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search templates or positions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>
        <select 
          value={positionFilter}
          onChange={(e) => setPositionFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
          className="bg-gray-50 border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
            className="group bg-white rounded-xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
          >
            <div className={`absolute top-0 left-0 w-1.5 h-full ${library.isActive ? 'bg-green-500' : 'bg-gray-200'}`}></div>
            
            <div className="flex justify-between items-start mb-4">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                library.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {library.isActive ? 'Active' : 'Inactive'}
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => navigate(`/kpi/library/edit/${library.id}`)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 transition"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </button>
              </div>
            </div>

            <h3 className="text-lg font-bold text-gray-900 mb-1 leading-tight">{library.title}</h3>
            <p className="text-sm text-gray-500 font-medium mb-4">{library.positionName || 'General Position'}</p>
            
            <div className="flex items-center gap-4 mb-6 py-3 border-y border-gray-50">
              <div className="flex-1 text-center">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">KPIs</p>
                <p className="text-base font-bold text-gray-700">{library.details?.length || 0}</p>
              </div>
              <div className="w-px h-6 bg-gray-100"></div>
              <div className="flex-1 text-center">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Level</p>
                <p className="text-base font-bold text-gray-700">{library.targetLevelId ? `L${library.targetLevelId}` : '---'}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => handleToggle(library.id, library.isActive)}
                className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition ${
                  library.isActive 
                    ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white' 
                    : 'bg-green-50 text-green-600 hover:bg-green-600 hover:text-white'
                }`}
              >
                {library.isActive ? 'Deactivate' : 'Activate'}
              </button>
              <button 
                onClick={() => navigate(`/kpi/library/view/${library.id}`)}
                className="px-3 py-2 bg-gray-50 text-gray-500 rounded-lg hover:bg-gray-100 transition border border-gray-100"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              </button>
            </div>
          </div>
        ))}

        {filteredLibraries.length === 0 && (
          <div className="col-span-full py-16 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-medium">No templates found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KpiLibraryDashboard;
