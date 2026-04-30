import { Link } from 'react-router-dom';
import { useGetFormsQuery, useDeleteFormMutation } from '../../features/appraisal/formApiSlice';
import type { FormTemplate } from '../../types/form';
import { Plus, Edit, Trash2, FileText, ChevronRight, AlertCircle } from 'lucide-react';

const AppraisalFormList = () => {
  const { data: forms = [], isLoading, error } = useGetFormsQuery();
  const [deleteForm] = useDeleteFormMutation();

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteForm(id).unwrap();
      } catch (err) {
        console.error('Failed to delete form', err);
      }
    }
  };

  const getStatusBadge = (status: FormTemplate['status']) => {
    const styles = {
      ACTIVE: 'bg-green-100 text-green-700 border-green-200',
      DRAFT: 'bg-amber-100 text-amber-700 border-amber-200',
      ARCHIVED: 'bg-gray-100 text-gray-700 border-gray-200',
    };

    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status]}`}>
        {status}
      </span>
    );
  };

  // Graceful Error Handling Logic
  const hasNoForms = error || forms.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Appraisal Forms</h1>
          <p className="text-gray-500 mt-1">Manage templates for employee performance evaluations.</p>
        </div>
        <Link
          to="/appraisal-forms/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-sm gap-2"
        >
          <Plus className="w-5 h-5" />
          Create New Form
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : hasNoForms ? (
        /* Graceful handling for both errors and empty states */
        <div className="bg-white rounded-3xl border border-dashed border-gray-200 p-16 text-center shadow-sm">
          <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
            {error ? <AlertCircle className="w-10 h-10 text-slate-400" /> : <FileText className="w-10 h-10 text-slate-400" />}
          </div>
          <h3 className="text-xl font-bold text-slate-900 italic">"There is no form available"</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto font-medium">
            {error ? "We encountered a problem loading the forms. Please try again later or create a new one." : "No templates have been created yet."}
          </p>
          <Link
            to="/appraisal-forms/new"
            className="mt-8 inline-flex items-center px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold hover:bg-black transition-all shadow-lg gap-2"
          >
            <Plus className="w-5 h-5" />
            Create First Template
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Form Title</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Sections</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Total Weight</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-center">Last Updated</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {forms.map((form) => (
                <tr key={form.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-5">
                    <div className="font-bold text-gray-900">{form.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs font-medium">{form.description}</div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {getStatusBadge(form.status)}
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-sm font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                      {form.sections?.length || 0}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-sm font-black text-blue-600">
                      {form.totalWeightage}%
                    </span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="text-sm text-gray-500 font-medium">
                      {new Date(form.updatedAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-3">
                      <Link
                        to={`/appraisal-forms/edit/${form.id}`}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Edit Form"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(form.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Delete Form"
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
      )}
    </div>
  );
};

export default AppraisalFormList;
