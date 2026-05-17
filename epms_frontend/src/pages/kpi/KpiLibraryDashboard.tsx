import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetAllLibrariesQuery } from '../../services/kpiApi';
import { useGetPositionsQuery } from '../../features/org/positionApi';
import {
  Search, Plus, ChevronDown, LayoutGrid, List, ArrowRight,
  Terminal, Handshake, Brain, Filter
} from 'lucide-react';
import KpiImportModal from '../../components/kpi/KpiImportModal';
import KpiLibraryHistoryModal from '../../components/kpi/KpiLibraryHistoryModal';

const KpiLibraryDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState<number | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [historyModalState, setHistoryModalState] = useState<{ isOpen: boolean; positionId: number; positionName: string }>({
    isOpen: false,
    positionId: 0,
    positionName: ''
  });

  const { data: librariesResponse, isLoading } = useGetAllLibrariesQuery();
  const { data: positions = [] } = useGetPositionsQuery();

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
      return <Terminal size={16} style={{ color: '#1A56DB' }} />;
    if (t.includes('executive') || t.includes('sales') || t.includes('account'))
      return <Handshake size={16} style={{ color: '#1A56DB' }} />;
    return <Brain size={16} style={{ color: '#1A56DB' }} />;
  };

  const inputStyle: React.CSSProperties = {
    background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 8,
    padding: '7px 12px', fontSize: 13, color: '#111827', outline: 'none', fontFamily: 'inherit',
  };

  if (isLoading) return (
    <div style={{ padding: '48px 24px', textAlign: 'center', fontSize: 13, color: '#9EA3B0' }}>Loading library…</div>
  );

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3" style={{ paddingBottom: 14, borderBottom: '0.5px solid #E4E6EC' }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: '#111827' }}>KPI Library</h1>
          <p style={{ fontSize: 12, color: '#9EA3B0', marginTop: 2 }}>
            Manage and deploy standardized performance indicators across your organization.
          </p>
        </div>
        <button onClick={() => navigate('/kpi/library/new')}
          className="inline-flex items-center gap-2 transition-colors self-start sm:self-auto"
          style={{ background: '#1A56DB', color: '#FFFFFF', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, border: 'none' }}>
          <Plus size={14} strokeWidth={3} /> Create New KPI
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9EA3B0' }} />
          <input type="text" placeholder="Search by title, position, or keyword…"
            style={{ ...inputStyle, width: '100%', paddingLeft: 30 }}
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Filter size={12} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9EA3B0' }} />
            <select style={{ ...inputStyle, paddingLeft: 28, paddingRight: 28, appearance: 'none' as any }}
              value={positionFilter}
              onChange={e => setPositionFilter(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}>
              <option value="all">All Positions</option>
              {positions.map(p => <option key={p.positionId} value={p.positionId}>{p.positionName}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9EA3B0' }} />
          </div>
          {/* View toggle */}
          <div className="flex" style={{ background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 8, padding: 3 }}>
            <button onClick={() => setViewMode('grid')}
              style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: viewMode === 'grid' ? '#EEF3FD' : 'transparent', color: viewMode === 'grid' ? '#1A56DB' : '#9EA3B0' }}>
              <LayoutGrid size={13} />
            </button>
            <button onClick={() => setViewMode('list')}
              style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, background: viewMode === 'list' ? '#EEF3FD' : 'transparent', color: viewMode === 'list' ? '#1A56DB' : '#9EA3B0' }}>
              <List size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Library content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLibraries.map(library => (
            <div key={library.id}
              style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '16px 18px', display: 'flex', flexDirection: 'column', height: '100%' }}
              className="hover:border-[#1A56DB] transition-colors">
              <div className="flex items-start justify-between" style={{ marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EEF3FD', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {getIcon(library.title)}
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px',
                  background: library.isActive ? '#EAF3DE' : '#F1EFE8',
                  color: library.isActive ? '#27500A' : '#444441',
                  border: `0.5px solid ${library.isActive ? '#B8DCA0' : '#DDDBD2'}`,
                  borderRadius: 20, padding: '2px 7px',
                }}>
                  {library.isActive ? 'Active' : 'Draft'}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 500, color: '#111827', marginBottom: 2 }}>{library.title}</p>
                <p style={{ fontSize: 10, fontWeight: 500, color: '#1A56DB', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                  {library.positionName || 'General'}
                </p>
                <p style={{ fontSize: 12, color: '#9EA3B0', lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as any }}>
                  {library.description || 'Performance metrics and competency standards for this role.'}
                </p>
              </div>
              <div className="flex justify-end" style={{ paddingTop: 12, marginTop: 12, borderTop: '0.5px solid #F0F2F6' }}>
                <button onClick={() => navigate(`/kpi/library/edit/${library.id}`)}
                  className="inline-flex items-center gap-1.5 transition-colors"
                  style={{ fontSize: 12, fontWeight: 500, color: '#111827' }}>
                  View Details <ArrowRight size={12} />
                </button>
                <button 
                  onClick={() => setHistoryModalState({
                    isOpen: true,
                    positionId: library.positionId || 0,
                    positionName: library.positionName || library.title
                  })}
                  className="text-blue-600 text-xs font-bold flex items-center gap-1.5 hover:text-blue-700 transition-all ml-4"
                >
                  <History className="w-3.5 h-3.5" />
                  History
                </button>
              </div>
            </div>
          ))}
          {filteredLibraries.length === 0 && (
            <div className="col-span-full" style={{ padding: '48px 24px', textAlign: 'center', background: '#F5F6F8', border: '0.5px dashed #E0E2E8', borderRadius: 12 }}>
              <Search size={24} style={{ color: '#E0E2E8', margin: '0 auto 10px' }} />
              <p style={{ fontSize: 13, color: '#9EA3B0' }}>No results found</p>
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, overflow: 'hidden' }}>
          {filteredLibraries.map((library, idx) => (
            <div key={library.id}
              style={{ padding: '12px 18px', borderBottom: idx < filteredLibraries.length - 1 ? '0.5px solid #F0F2F6' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
              className="hover:bg-[#FAFBFF] transition-colors">
              <div className="flex items-center gap-3">
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#EEF3FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {getIcon(library.title)}
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{library.title}</p>
                  <p style={{ fontSize: 10, color: '#1A56DB', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{library.positionName || 'General'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span style={{
                  fontSize: 9, fontWeight: 500, textTransform: 'uppercase',
                  background: library.isActive ? '#EAF3DE' : '#F1EFE8',
                  color: library.isActive ? '#27500A' : '#444441',
                  border: `0.5px solid ${library.isActive ? '#B8DCA0' : '#DDDBD2'}`,
                  borderRadius: 20, padding: '2px 7px',
                }}>
                  {library.isActive ? 'Active' : 'Draft'}
                </span>
                <button onClick={() => navigate(`/kpi/library/edit/${library.id}`)}
                  style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9EA3B0', borderRadius: 6 }}
                  className="hover:bg-[#EEF3FD] hover:text-[#1A56DB] transition-colors">
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
          {filteredLibraries.length === 0 && (
            <div style={{ padding: '32px 18px', textAlign: 'center', fontSize: 13, color: '#9EA3B0' }}>No results found.</div>
          )}
        </div>
      )}
    </div>
  );
};

export default KpiLibraryDashboard;
