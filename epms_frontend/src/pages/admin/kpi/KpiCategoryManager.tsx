import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, X } from 'lucide-react';
import { 
  useGetKpiCategoriesQuery, 
  useCreateKpiCategoryMutation, 
  useUpdateKpiCategoryMutation, 
  useDeleteKpiCategoryMutation 
} from '../../../services/kpiApi';
import type { KpiCategory } from '../../../features/kpi/kpiTypes';

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
    if (category) {
      setEditingCategory(category);
      setFormName(category.categoryName || category.name || '');
    } else {
      setEditingCategory(null);
      setFormName('');
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    setFormName('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Category name is required.");
      return;
    }

    try {
      if (editingCategory) {
        if (!editingCategory.id) {
          throw new Error("Cannot update: Category ID is missing.");
        }
        await updateCategory({ id: editingCategory.id, name: formName.trim() }).unwrap();
      } else {
        await createCategory({ name: formName.trim() }).unwrap();
      }
      handleCloseModal();
    } catch (err: any) {
      console.error('Category Save Error:', err);
      const errorMessage = err?.data?.message || err?.message || 'Failed to save category. Check console for details.';
      alert(`Error: ${errorMessage}`);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this category?")) {
      try {
        await deleteCategory(id).unwrap();
      } catch (err: any) {
        alert(err?.data?.message || 'Failed to delete category');
      }
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading categories...</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
            Framework &gt; Categories
          </div>
          <h1 className="text-2xl font-bold text-gray-900">KPI Category Management</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Define and organize the architectural pillars of your organizational performance framework.
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Create New Category
        </button>
      </div>

      {/* Toolbar & Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none transition"
            />
          </div>
          <div className="text-xs font-semibold text-gray-500">
            Displaying {filteredCategories.length} categories
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/30">
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Category Name</th>
                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-6 py-12 text-center text-gray-400 text-sm">
                    No categories found.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((cat) => (
                  <tr key={cat.id} className="hover:bg-gray-50 transition group">
                    <td className="px-0 py-0">
                      <div className="flex items-center">
                        <div className="w-1 h-14 bg-blue-500 rounded-r-md mr-6"></div>
                        <div>
                          <p className="font-bold text-gray-900">{cat.categoryName || cat.name}</p>
                          <p className="text-[10px] text-gray-400 font-bold tracking-widest uppercase">ID: CAT-{cat.id.toString().padStart(3, '0')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                        <button 
                          onClick={() => handleOpenModal(cat)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(cat.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button 
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest mb-2">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Technical Excellence"
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                  />
                </div>
              </div>
              
              <div className="mt-8 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating || isUpdating}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
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
