import React, { useState } from 'react';
import {
  useGetPerformanceCategoriesQuery,
  useCreatePerformanceCategoryMutation,
  useUpdatePerformanceCategoryMutation,
  useDeletePerformanceCategoryMutation
} from '../../features/appraisal/performanceCategoryApi';
import type { PerformanceCategory, PerformanceGrade } from '../../types/appraisal';
import {
  Plus,
  Trash2,
  Edit2,
  Layers,
  Target,
  BarChart3,
  X,
  Check
} from 'lucide-react';

const GRADES: PerformanceGrade[] = [
  'OUTSTANDING',
  'EXCEEDS_EXPECTATIONS',
  'MEETS_EXPECTATIONS',
  'NEEDS_IMPROVEMENT',
  'UNSATISFACTORY'
];

const PerformanceCategoryManagement: React.FC = () => {
  const { data: response, isLoading } = useGetPerformanceCategoriesQuery();
  const categories = response?.data || [];

  const [createCategory] = useCreatePerformanceCategoryMutation();
  const [updateCategory] = useUpdatePerformanceCategoryMutation();
  const [deleteCategory] = useDeletePerformanceCategoryMutation();

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PerformanceCategory>({
    name: '',
    minScore: 0,
    maxScore: 100,
    ratingValue: 3,
    grade: 'MEETS_EXPECTATIONS',
    description: ''
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      name: '',
      minScore: 0,
      maxScore: 100,
      ratingValue: 3,
      grade: 'MEETS_EXPECTATIONS',
      description: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (category: PerformanceCategory) => {
    setEditingId(category.id!);
    setFormData({ ...category });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || formData.minScore === undefined || formData.maxScore === undefined) {
      alert('Please fill required fields');
      return;
    }

    try {
      if (editingId) {
        await updateCategory({ id: editingId, category: formData }).unwrap();
      } else {
        await createCategory(formData).unwrap();
      }
      setShowModal(false);
    } catch (err) {
      alert('Failed to save performance category');
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this category? This may affect final appraisal calculations.')) {
      await deleteCategory(id);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Performance Categories</h2>
          <p className="text-slate-500 font-medium">Define grading bands and score ranges for final appraisals.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add New Category
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Categories</p>
            <p className="text-xl font-black text-slate-900">{categories.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Score System</p>
            <p className="text-xl font-black text-slate-900">0 - 100 Scale</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Rating Range</p>
            <p className="text-xl font-black text-slate-900">1 - 5 Values</p>
          </div>
        </div>
      </div>

      {/* Category List */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/50">
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Grade Name</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Score Range</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Rating Value</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">System Enum</th>
              <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium">Loading categories...</td></tr>
            ) : categories.length === 0 ? (
              <tr><td colSpan={5} className="px-8 py-12 text-center text-slate-400 font-medium">No performance categories defined.</td></tr>
            ) : categories.map((cat) => (
              <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-8 py-6">
                  <div>
                    <p className="font-bold text-slate-900">{cat.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium line-clamp-1 max-w-[200px]">{cat.description}</p>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-200">
                    {cat.minScore} - {cat.maxScore}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className={`w-1.5 h-4 rounded-full ${i < cat.ratingValue ? 'bg-indigo-500' : 'bg-slate-200'}`}></div>
                    ))}
                    <span className="ml-2 font-bold text-slate-700">{cat.ratingValue}</span>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {cat.grade}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      title="Edit"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(cat.id!)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{editingId ? 'Edit Category' : 'New Category'}</h3>
                <p className="text-slate-400 font-medium text-sm">Configure how scores translate to performance grades.</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-10 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Display Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Outstanding Performance"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Min Score (0-100)</label>
                  <input
                    type="number"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                    value={formData.minScore}
                    onChange={e => setFormData({ ...formData, minScore: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Max Score (0-100)</label>
                  <input
                    type="number"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                    value={formData.maxScore}
                    onChange={e => setFormData({ ...formData, maxScore: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Rating Value (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                    value={formData.ratingValue}
                    onChange={e => setFormData({ ...formData, ratingValue: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">System Grade (Enum)</label>
                  <select
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 appearance-none"
                    value={formData.grade}
                    onChange={e => setFormData({ ...formData, grade: e.target.value as PerformanceGrade })}
                  >
                    {GRADES.map(pg => (
                      <option key={pg} value={pg}>{pg}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Describe the characteristics of this performance level..."
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700 resize-none"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="p-10 bg-slate-50 flex gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-4 text-slate-400 font-bold hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" /> {editingId ? 'Update Category' : 'Create Category'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceCategoryManagement;
