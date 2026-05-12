import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetAllLibrariesQuery, useToggleLibraryStatusMutation } from '../../services/kpiApi';
import { useGetPositionsQuery } from '../../features/org/positionApi';
import { 
  Search, 
  Plus, 
  ChevronDown, 
  LayoutGrid, 
  List, 
  ArrowRight,
  Terminal,
  Handshake,
  Brain,
  Filter,
  MoreHorizontal,
  FileUp
} from 'lucide-react';
import KpiImportModal from '../../components/kpi/KpiImportModal';

const KpiLibraryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

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

  const getIcon = (title: string) => {
    const t = title.toLowerCase();
    if (t.includes('engineer') || t.includes('technical') || t.includes('software')) 
      return <Terminal className="w-5 h-5 text-blue-600" />;
    if (t.includes('executive') || t.includes('sales') || t.includes('account')) 
      return <Handshake className="w-5 h-5 text-blue-600" />;
    return <Brain className="w-5 h-5 text-blue-600" />;
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-gray-100 pb-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">KPI Library</h1>
          <p className="text-gray-400 text-sm font-medium max-w-xl leading-relaxed">
            Manage and deploy standardized performance indicators across your organization.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="bg-white text-gray-700 border border-gray-200 px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-all flex items-center gap-2 active:scale-95"
          >
            <FileUp className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
            Import Library Template
          </button>
          <button
            onClick={() => navigate('/kpi/library/new')}
            className="bg-[#2563EB] text-white px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-blue-700 transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-5 h-5" strokeWidth={3} />
            Create New KPI
          </button>
        </div>
      </div>

      {/* Simplified Filter Toolbar */}
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, position, or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-gray-100 rounded-xl pl-10 pr-4 py-3 text-sm font-medium placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/20 transition-all shadow-sm"
          />
        </div>
        
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="relative">
            <select
              value={positionFilter}
              onChange={(e) => setPositionFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
              className="appearance-none bg-white px-5 py-3 pr-10 rounded-xl text-xs font-bold text-gray-600 shadow-sm border border-gray-100 hover:border-gray-200 transition-all cursor-pointer outline-none"
            >
              <option value="all">All Positions</option>
              {positions.map(p => (
                <option key={p.positionId} value={p.positionId}>{p.positionName}</option>
              ))}
            </select>
            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-100">
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Library Content */}
      <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-3"}>
        {filteredLibraries.map((library) => (
          viewMode === 'grid' ? (
            <div
              key={library.id}
              className="group bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-5">
                <div className="bg-gray-50 p-2.5 rounded-lg group-hover:bg-blue-50 transition-colors">
                  {getIcon(library.title)}
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${
                  library.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {library.isActive ? 'Active' : 'Draft'}
                </span>
              </div>

              <div className="flex-1 space-y-1">
                <h3 className="text-lg font-bold text-gray-900 leading-tight">
                  {library.title}
                </h3>
                <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wide">
                  {library.positionName || 'General'}
                </p>
                <p className="text-gray-500 text-xs leading-relaxed line-clamp-2 mt-3 font-medium">
                  {library.description || "Performance metrics and competency standards for this role."}
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-gray-50 flex items-center justify-end">
                <button 
                  onClick={() => navigate(`/kpi/library/edit/${library.id}`)}
                  className="text-gray-900 text-xs font-black flex items-center gap-1.5 hover:text-blue-600 transition-all"
                >
                  View Details
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div 
              key={library.id}
              className="bg-white px-5 py-4 rounded-xl border border-gray-100 flex items-center justify-between hover:border-blue-100 transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-gray-50 p-2 rounded-lg group-hover:bg-blue-50">
                  {getIcon(library.title)}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">{library.title}</h3>
                  <p className="text-[10px] font-bold text-blue-500 uppercase">{library.positionName || 'General'}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                  library.isActive ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {library.isActive ? 'Active' : 'Draft'}
                </span>
                <button 
                  onClick={() => navigate(`/kpi/library/edit/${library.id}`)}
                  className="p-1.5 text-gray-300 hover:text-blue-600 transition-all"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        ))}

        {filteredLibraries.length === 0 && (
          <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
            <Search className="w-8 h-8 text-gray-200 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-gray-400">No results found</h3>
          </div>
        )}
      </div>

      <KpiImportModal 
        isOpen={isImportModalOpen} 
        onClose={() => setIsImportModalOpen(false)} 
      />
    </div>
  );
};

export default KpiLibraryDashboard;

