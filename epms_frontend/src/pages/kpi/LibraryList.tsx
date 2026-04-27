import React from 'react';
import { useGetAllLibrariesQuery, useToggleLibraryStatusMutation } from '../../features/kpi/kpiApi';
import { Link } from 'react-router-dom';

const LibraryList: React.FC = () => {
  const { data: librariesResponse, isLoading, error } = useGetAllLibrariesQuery();
  const [toggleStatus] = useToggleLibraryStatusMutation();

  const handleToggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await toggleStatus({ id, active: !currentStatus }).unwrap();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  if (isLoading) return <div className="p-6">Loading libraries...</div>;
  if (error) return <div className="p-6 text-red-500">Error loading libraries</div>;

  const libraries = librariesResponse?.data || [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">KPI Library</h1>
        <Link
          to="/kpi/library/new"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-sm"
        >
          Create New Template
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {libraries.map((library) => (
              <tr key={library.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{library.title}</div>
                  <div className="text-sm text-gray-500">{library.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {library.positionName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {library.details.length} Items
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    library.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {library.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleToggleStatus(library.id, library.isActive)}
                    className={`${
                      library.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'
                    } mr-4`}
                  >
                    {library.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <Link to={`/kpi/library/edit/${library.id}`} className="text-blue-600 hover:text-blue-900">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {libraries.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                  No KPI templates found. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LibraryList;
