import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useGetPipsQuery, useGetPipsByInvolvedUserQuery } from '../../services/pipApi';
import { useGetEmployeesQuery } from '../../features/employee/employeeapi';
import { useAuth } from '../../hooks/useAuth';
import PipStatusBadge from '../../components/pip/PipStatusBadge';
import type { PipResponse } from '../../features/pip/types';

const PipListPage: React.FC = () => {
    const navigate = useNavigate();
    const { isHR, isAdmin, user } = useAuth();

    // Fetch PIPs based on role
    // For HR/Admin, we fetch all. For others, we fetch their own for now.
    // In a real scenario, managers would see their team's PIPs too.
    const { data: pipsResponse, isLoading: isPipsLoading } = (isHR || isAdmin)
        ? useGetPipsQuery()
        : useGetPipsByInvolvedUserQuery(user?.id || 0);

    const pips = pipsResponse?.data;
    const { data: employees } = useGetEmployeesQuery();

    const getEmployeeName = (id: number) => {
        return employees?.find(emp => emp.id === id)?.staffName || `ID: ${id}`;
    };

    if (isPipsLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Performance Improvement Plans</h1>
                    <p className="text-sm text-gray-500">Manage and track employee performance improvements.</p>
                </div>
                {(isHR || isAdmin) && (
                    <button
                        onClick={() => navigate('/pip/new')}
                        className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-blue-700 transition shadow-sm"
                    >
                        Create New PIP
                    </button>
                )}
            </div>

            <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Manager</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {pips && pips.length > 0 ? (
                                pips.map((pip: PipResponse) => (
                                    <tr key={pip.pipId} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{getEmployeeName(pip.employeeId)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500">{getEmployeeName(pip.managerId)}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900">{pip.startDate} to {pip.endDate}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <PipStatusBadge status={pip.status} />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => navigate(`/pip/${pip.pipId}`)}
                                                className="text-blue-600 hover:text-blue-900 font-semibold"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                        No Performance Improvement Plans found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default PipListPage;
