import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, X } from 'lucide-react';
import {
  useGetKpiCategoriesQuery,
  useCreateKpiCategoryMutation,
  useUpdateKpiCategoryMutation,
  useDeleteKpiCategoryMutation
} from '../../../services/kpiApi';
import type { KpiCategory } from '../../../features/kpi/kpiTypes';

const inputStyle: React.CSSProperties = { background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 8, padding: '7px 12px', fontSize: 13, color: '#111827', outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: 'inherit' };

const KpiCategoryManager: React.FC = () => {
  const { data: response, isLoading } = useGetKpiCategoriesQuery();
  const categories = response?.data || [];

  const [createCategory, { isLoading: isCreating }] = useCreateKpiCategoryMutation();
  const [updateCategory, { isLoading: isUpdating }] = useUpdateKpiCategoryMutation();
  const [deleteCategory] = useDeleteKpiCategoryMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<KpiCategory | null>(null);
  const [formName, setFormName] = useState('');

  const filteredCategories = categories.filter(c =>
    (c.categoryName || c.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (category?: KpiCategory) => {
    if (category) { setEditingCategory(category); setFormName(category.categoryName || category.name || ''); }
    else { setEditingCategory(null); setFormName(''); }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); setEditingCategory(null); setFormName(''); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) { alert("Category name is required."); return; }
    try {
      if (editingCategory) {
        if (!editingCategory.id) throw new Error("Cannot update: Category ID is missing.");
        await updateCategory({ id: editingCategory.id, name: formName.trim() }).unwrap();
      } else {
        await createCategory({ name: formName.trim() }).unwrap();
      }
      handleCloseModal();
    } catch (err: any) {
      console.error('Category Save Error:', err);
      alert(`Error: ${err?.data?.message || err?.message || 'Failed to save category.'}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try { await deleteCategory(id).unwrap(); }
      catch (err: any) { alert(err?.data?.message || 'Failed to delete category'); }
    }
  };

  if (isLoading) return <div style={{ padding: '48px', textAlign: 'center', fontSize: 13, color: '#9EA3B0' }}>Loading categories...</div>;

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 3 }}>Framework › Categories</p>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: '#111827' }}>KPI Category Management</h1>
          <p style={{ fontSize: 12, color: '#9EA3B0', marginTop: 2 }}>Define and organize the pillars of your organizational performance framework.</p>
        </div>
        <button onClick={() => handleOpenModal()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#1A56DB', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '7px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          className="hover:opacity-90 transition-opacity">
          <Plus size={15} /> Create New Category
        </button>
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{ padding: '10px 16px', borderBottom: '0.5px solid #E4E6EC', background: '#F5F6F8', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <div style={{ position: 'relative', width: 240 }}>
            <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9EA3B0' }} />
            <input type="text" placeholder="Search categories..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              style={{ ...inputStyle, paddingLeft: 30, width: 240 }} />
          </div>
          <span style={{ fontSize: 12, color: '#9EA3B0' }}>Displaying {filteredCategories.length} categories</span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #E4E6EC', background: '#F5F6F8' }}>
                <th style={{ padding: '9px 16px', fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'left' }}>Category Name</th>
                <th style={{ padding: '9px 16px', fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCategories.length === 0 ? (
                <tr><td colSpan={2} style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: '#9EA3B0' }}>No categories found.</td></tr>
              ) : (
                filteredCategories.map((cat, idx) => (
                  <tr key={cat.id} style={{ borderBottom: idx < filteredCategories.length - 1 ? '0.5px solid #F0F2F6' : 'none' }}
                    className="hover:bg-[#FAFBFF] transition-colors group">
                    <td style={{ padding: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: 3, height: 48, background: '#1A56DB', borderRadius: '0 2px 2px 0', marginRight: 16, flexShrink: 0 }} />
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, color: '#111827' }}>{cat.categoryName || cat.name}</p>
                          <p style={{ fontSize: 10, color: '#9EA3B0', marginTop: 1 }}>ID: CAT-{cat.id.toString().padStart(3, '0')}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 4, opacity: 0 }} className="group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleOpenModal(cat)}
                          style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '0.5px solid #E4E6EC', borderRadius: 6, color: '#9EA3B0', cursor: 'pointer' }}
                          className="hover:border-[#1A56DB] hover:text-[#1A56DB] transition-colors" title="Edit">
                          <Edit2 size={13} />
                        </button>
                        <button onClick={() => handleDelete(cat.id)}
                          style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'none', border: '0.5px solid #E4E6EC', borderRadius: 6, color: '#9EA3B0', cursor: 'pointer' }}
                          className="hover:border-[#F5BFBF] hover:text-[#791F1F] transition-colors" title="Delete">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,0.5)' }}>
          <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, width: '100%', maxWidth: 420, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '0.5px solid #E4E6EC', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111827' }}>
              <h3 style={{ fontSize: 14, fontWeight: 500, color: '#FFFFFF' }}>
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button onClick={handleCloseModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', display: 'flex' }}
                className="hover:text-white transition-colors">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSave} style={{ padding: '18px 20px' }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 6 }}>
                Category Name *
              </label>
              <input type="text" required value={formName} onChange={e => setFormName(e.target.value)}
                placeholder="e.g. Technical Excellence" style={inputStyle} />
              <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button type="button" onClick={handleCloseModal}
                  style={{ padding: '7px 14px', fontSize: 13, fontWeight: 500, color: '#5A6070', background: '#F5F6F8', border: '0.5px solid #E4E6EC', borderRadius: 8, cursor: 'pointer' }}
                  className="hover:border-[#9EA3B0] transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={isCreating || isUpdating}
                  style={{ padding: '7px 16px', fontSize: 13, fontWeight: 500, background: '#1A56DB', color: '#FFFFFF', border: 'none', borderRadius: 8, cursor: 'pointer', opacity: (isCreating || isUpdating) ? 0.6 : 1 }}
                  className="hover:opacity-90 transition-opacity">
                  {(isCreating || isUpdating) ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default KpiCategoryManager;
