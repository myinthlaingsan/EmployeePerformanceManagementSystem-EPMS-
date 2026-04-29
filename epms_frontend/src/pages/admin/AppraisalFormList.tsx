import { Link } from 'react-router-dom';
import { useGetFormsQuery, useDeleteFormMutation } from '../../features/appraisal/formApiSlice';
import type { FormTemplate } from '../../types/form';
import { Plus, Edit, Trash2, FileText, ChevronRight } from 'lucide-react';

const AppraisalFormList = () => {
  const { data: forms = [], isLoading, error, refetch } = useGetFormsQuery();
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
      ) : error ? (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
          {'status' in error
            ? `Error: ${error.status} - Failed to load forms`
            : error.message || 'Failed to load appraisal forms'}
        </div>
      ) : forms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900">No forms found</h3>
          <p className="text-gray-500 mt-1 max-w-sm mx-auto">
            Get started by creating your first appraisal form template.
          </p>
          <Link
            to="/appraisal-forms/new"
            className="mt-6 inline-flex items-center text-blue-600 font-bold hover:underline gap-1"
          >
            Create template <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Form Title</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Sections</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Total Weight</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {forms.map((form) => (
                <tr key={form.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-bold text-gray-900">{form.title}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">{form.description}</div>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(form.status)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-700">
                      {form.sections?.length || 0} sections
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-900">
                      {form.totalWeightage}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">
                      {new Date(form.updatedAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/appraisal-forms/edit/${form.id}`}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Form"
                      >
                        <Edit className="w-5 h-5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(form.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
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
