import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreatePipMutation } from '../../services/pipApi';
import { useGetEmployeesQuery } from '../../features/employee/employeeapi';
import type { PipCreateRequest } from '../../features/pip/types';

const PipCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const [createPip, { isLoading: isCreating }] = useCreatePipMutation();
    const { data: employees, isLoading: isEmployeesLoading } = useGetEmployeesQuery();

    const [formData, setFormData] = useState<PipCreateRequest>({
        employeeId: 0,
        managerId: 0,
        startDate: '',
        endDate: '',
        reason: ''
    });

    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!formData.employeeId || !formData.managerId || !formData.startDate || !formData.endDate || !formData.reason) {
            setError('Please fill in all fields.');
            return;
        }

        try {
            await createPip(formData).unwrap();
            navigate('/pip');
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to create PIP. Please try again.');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name.includes('Id') ? parseInt(value) : value
        }));
    };

    if (isEmployeesLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => navigate('/pip')}
                    className="p-2 hover:bg-gray-100 rounded-full transition"
                >
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                </button>
                <h1 className="text-2xl font-bold text-gray-900">Create New Performance Improvement Plan</h1>
            </div>

            <div className="bg-white shadow-xl border border-gray-100 rounded-2xl p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Employee</label>
                            <select
                                name="employeeId"
                                value={formData.employeeId}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                required
                            >
                                <option value={0}>Select Employee</option>
                                {employees?.map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.staffName} ({emp.employeeCode})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Assign Manager</label>
                            <select
                                name="managerId"
                                value={formData.managerId}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                required
                            >
                                <option value={0}>Select Manager</option>
                                {employees?.filter(emp => emp.roles.includes('ROLE_MANAGER') || emp.roles.includes('ROLE_HR')).map(emp => (
                                    <option key={emp.id} value={emp.id}>
                                        {emp.staffName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Start Date</label>
                            <input
                                type="date"
                                name="startDate"
                                value={formData.startDate}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">End Date</label>
                            <input
                                type="date"
                                name="endDate"
                                value={formData.endDate}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Reason for PIP</label>
                        <textarea
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            rows={4}
                            placeholder="Describe the performance issues and why this plan is being initiated..."
                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                            required
                        ></textarea>
                    </div>

                    <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => navigate('/pip')}
                            className="px-6 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium hover:bg-gray-50 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isCreating}
                            className={`px-8 py-2.5 rounded-xl bg-blue-600 text-white font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 transition flex items-center gap-2 ${isCreating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {isCreating ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    Creating...
                                </>
                            ) : (
                                'Create Plan'
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PipCreatePage;
