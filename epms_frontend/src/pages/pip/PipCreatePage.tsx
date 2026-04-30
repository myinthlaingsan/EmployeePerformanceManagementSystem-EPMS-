import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreatePipMutation, useCreateObjectiveMutation } from '../../services/pipApi';
import { useGetEmployeesQuery } from '../../features/employee/employeeapi';
import { useGetDepartmentsQuery } from '../../features/org/departmentApi';
import type { PipCreateRequest, PipObjectiveRequest } from '../../features/pip/types';

// Local type for objectives before they have a PIP ID
interface LocalObjective {
    title: string;
    description: string;
    successCriteria: string;
    targetDate: string;
    weight: number;
}

const PipCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const [createPip, { isLoading: isCreating }] = useCreatePipMutation();
    const [createObjective] = useCreateObjectiveMutation();
    
    const { data: departments, isLoading: isDepartmentsLoading } = useGetDepartmentsQuery();
    const { data: employees, isLoading: isEmployeesLoading } = useGetEmployeesQuery();

    const [activeStep, setActiveStep] = useState(1);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number>(0);
    
    const [formData, setFormData] = useState<PipCreateRequest>({
        employeeId: 0,
        managerId: 0,
        startDate: '',
        endDate: '',
        reason: ''
    });

    const [objectives, setObjectives] = useState<LocalObjective[]>([
        { title: '', description: '', successCriteria: '', targetDate: '', weight: 0 }
    ]);

    const [error, setError] = useState<string | null>(null);
    const [showAutoSave, setShowAutoSave] = useState(true);

    const totalWeight = useMemo(() => objectives.reduce((sum, obj) => sum + obj.weight, 0), [objectives]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        // Validations
        if (!formData.employeeId || !formData.startDate || !formData.endDate || !formData.reason) {
            setError('Please complete all required fields in the Identification section.');
            setActiveStep(1);
            return;
        }

        if (objectives.length === 0) {
            setError('Please add at least one improvement objective.');
            setActiveStep(2);
            return;
        }

        if (totalWeight !== 100) {
            setError(`Total weight must equal 100%. Current total: ${totalWeight}%`);
            setActiveStep(2);
            return;
        }

        try {
            // 1. Create the PIP
            const pipResponse = await createPip(formData).unwrap();
            const newPipId = pipResponse.data.pipId;

            // 2. Create all objectives associated with this PIP
            const objectivePromises = objectives.map(obj => 
                createObjective({
                    ...obj,
                    pipId: newPipId,
                    targetDate: obj.targetDate || formData.endDate // Default to PIP end date if not set
                }).unwrap()
            );

            await Promise.all(objectivePromises);
            
            navigate('/pip');
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to create PIP. Please check your inputs.');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name.includes('Id') ? parseInt(value) : value
        }));
    };

    const handleObjectiveChange = (index: number, field: keyof LocalObjective, value: string | number) => {
        const newObjectives = [...objectives];
        newObjectives[index] = { 
            ...newObjectives[index], 
            [field]: field === 'weight' ? (value === '' ? 0 : parseInt(value.toString())) : value 
        };
        setObjectives(newObjectives);
    };

    const addObjective = () => {
        setObjectives([...objectives, { title: '', description: '', successCriteria: '', targetDate: '', weight: 0 }]);
    };

    const removeObjective = (index: number) => {
        setObjectives(objectives.filter((_, i) => i !== index));
    };

    const handleDepartmentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const deptId = parseInt(e.target.value);
        setSelectedDepartmentId(deptId);
        setFormData(prev => ({
            ...prev,
            employeeId: 0,
            managerId: 0
        }));
    };

    const filteredEmployees = employees?.filter(emp => selectedDepartmentId === 0 || emp.currentDepartmentId === selectedDepartmentId) || [];
    
    if (isEmployeesLoading || isDepartmentsLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-surface-base">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-base flex">
            {/* Left Sidebar Stepper */}
            <aside className="w-64 bg-white border-r border-surface-border p-6 flex flex-col fixed h-full">
                <div className="mb-10">
                    <h2 className="text-xl font-bold text-text-title tracking-tight">EPMS</h2>
                    <p className="text-[10px] text-text-muted uppercase tracking-[0.2em] font-bold">Precision Performance</p>
                </div>

                <nav className="flex-1 space-y-8">
                    {[
                        { id: 1, title: 'IDENTIFICATION', sub: 'Employee & Core Issue' },
                        { id: 2, title: 'FRAMEWORK', sub: 'Improvement Objectives' },
                        { id: 3, title: 'LOGISTICS', sub: 'Timeline & Resources' },
                        { id: 4, title: 'GOVERNANCE', sub: 'Follow-up Schedule' }
                    ].map((step) => (
                        <div key={step.id} className="flex gap-4 items-start group cursor-pointer" onClick={() => setActiveStep(step.id)}>
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all shadow-sm
                                ${activeStep === step.id ? 'bg-brand-primary text-white scale-110 shadow-brand-primary/20' : 'bg-surface-base text-text-muted group-hover:bg-gray-100'}`}>
                                {step.id}
                            </div>
                            <div>
                                <p className={`text-[10px] font-bold tracking-wider transition-colors ${activeStep === step.id ? 'text-brand-primary' : 'text-text-muted'}`}>
                                    {step.title}
                                </p>
                                <p className={`text-xs font-medium transition-colors ${activeStep === step.id ? 'text-text-title' : 'text-text-muted'}`}>
                                    {step.sub}
                                </p>
                            </div>
                        </div>
                    ))}
                </nav>

                <div className="mt-auto pt-6 border-t border-surface-border">
                    <button className="flex items-center gap-2 text-text-muted hover:text-text-title transition text-sm font-medium">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Help Center
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 ml-64 p-10 max-w-6xl">
                {/* Header Section */}
                <header className="mb-10">
                    <button onClick={() => navigate('/pip')} className="flex items-center gap-2 text-brand-secondary hover:text-brand-primary transition text-sm font-semibold mb-4">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Return to Active Plans
                    </button>
                    <h1 className="text-3xl font-bold text-text-title mb-2">Create Performance Improvement Plan</h1>
                    <p className="text-text-muted max-w-2xl text-lg">
                        Establish a clear, supportive framework for employee growth. Define objectives, timelines, and measurable success criteria.
                    </p>
                </header>

                <div className="space-y-10 relative">
                    {/* Floating Toast (Mockup) */}
                    {showAutoSave && (
                        <div className="fixed top-10 right-10 z-50 bg-[#1e293b] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-bounce-subtle">
                            <div className="bg-emerald-500 rounded-full p-1">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <div>
                                <p className="text-xs font-bold">Draft Mode Active</p>
                                <p className="text-[10px] text-gray-400">All changes are saved locally</p>
                            </div>
                            <button onClick={() => setShowAutoSave(false)} className="ml-2 text-gray-500 hover:text-white">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 animate-pulse">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Section 1: Identification */}
                    <section id="step-1" className="bg-white rounded-3xl border border-surface-border shadow-premium overflow-hidden">
                        <div className="p-8 flex gap-8">
                            <div className="w-1.5 h-auto bg-brand-primary rounded-full"></div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="p-2 bg-brand-primary/10 rounded-xl">
                                        <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-bold text-text-title">Employee Selection & Core Issue</h3>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Department</label>
                                        <select
                                            value={selectedDepartmentId}
                                            onChange={handleDepartmentChange}
                                            className="w-full bg-surface-base border border-surface-border rounded-xl px-5 py-4 focus:ring-2 focus:ring-brand-primary outline-none font-medium transition"
                                        >
                                            <option value={0}>Select a department...</option>
                                            {departments?.map(dept => (
                                                <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Target Employee</label>
                                        <select
                                            name="employeeId"
                                            value={formData.employeeId}
                                            onChange={handleChange}
                                            className="w-full bg-surface-base border border-surface-border rounded-xl px-5 py-4 focus:ring-2 focus:ring-brand-primary outline-none font-medium transition"
                                        >
                                            <option value={0}>Select an employee from your team...</option>
                                            {filteredEmployees.map(emp => (
                                                <option key={emp.id} value={emp.id}>{emp.staffName} ({emp.employeeCode})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Severity Level</label>
                                        <div className="flex gap-2">
                                            {['Standard', 'Urgent', 'Critical'].map((level) => (
                                                <button
                                                    key={level}
                                                    type="button"
                                                    className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all border
                                                        ${level === 'Standard' ? 'bg-[#fffbeb] border-[#fde68a] text-[#92400e] shadow-inner' : 'bg-surface-base border-surface-border text-text-muted hover:border-gray-300'}`}
                                                >
                                                    {level}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Reason for Plan (Core Performance Issues)</label>
                                        <textarea
                                            name="reason"
                                            value={formData.reason}
                                            onChange={handleChange}
                                            rows={5}
                                            className="w-full bg-surface-base border border-surface-border rounded-xl px-5 py-4 focus:ring-2 focus:ring-brand-primary outline-none font-medium transition placeholder:text-text-muted/50"
                                            placeholder="Provide a detailed, objective description of the performance gap. Reference specific examples or missed targets."
                                        ></textarea>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Objectives */}
                    <section id="step-2" className="bg-white rounded-3xl border border-surface-border shadow-premium overflow-hidden p-8">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-brand-primary/10 rounded-xl">
                                    <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-bold text-text-title">Improvement Objectives</h3>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className={`text-sm font-bold flex items-center gap-2 ${totalWeight === 100 ? 'text-emerald-600' : 'text-red-600'}`}>
                                    Total Weight: {totalWeight}%
                                    {totalWeight === 100 ? (
                                         <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                        </svg>
                                    ) : (
                                        <span className="text-[10px] font-medium">(Must be 100%)</span>
                                    )}
                                </div>
                                <button 
                                    type="button" 
                                    onClick={addObjective}
                                    className="bg-brand-primary text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-brand-primary/90 transition shadow-lg shadow-brand-primary/10"
                                >
                                    <span className="text-lg">+</span> Add Objective
                                </button>
                            </div>
                        </div>

                        <div className="bg-surface-base rounded-2xl overflow-hidden border border-surface-border">
                            <table className="w-full text-left">
                                <thead className="bg-gray-100/50 border-b border-surface-border">
                                    <tr>
                                        <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest w-1/3">Objective & Description</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest w-1/3">Success Criteria (KPI)</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center w-24">Weight (%)</th>
                                        <th className="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center w-16"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-border">
                                    {objectives.map((obj, index) => (
                                        <tr key={index} className="group hover:bg-white transition-colors">
                                            <td className="px-6 py-6">
                                                <input
                                                    type="text"
                                                    value={obj.title}
                                                    onChange={(e) => handleObjectiveChange(index, 'title', e.target.value)}
                                                    placeholder="Objective Title (e.g. Code Quality)"
                                                    className="w-full bg-transparent border-b border-transparent focus:border-brand-secondary outline-none font-bold text-sm text-text-title mb-2 placeholder:font-normal placeholder:text-text-muted/40"
                                                />
                                                <textarea
                                                    value={obj.description}
                                                    onChange={(e) => handleObjectiveChange(index, 'description', e.target.value)}
                                                    placeholder="Describe the expectation..."
                                                    className="w-full bg-transparent border-none outline-none text-xs italic text-text-body font-serif resize-none placeholder:text-text-muted/40"
                                                    rows={2}
                                                />
                                            </td>
                                            <td className="px-6 py-6">
                                                <textarea
                                                    value={obj.successCriteria}
                                                    onChange={(e) => handleObjectiveChange(index, 'successCriteria', e.target.value)}
                                                    placeholder="Measurable KPI (e.g. Reduce bugs by 20%)"
                                                    className="w-full bg-transparent border border-transparent focus:border-brand-secondary/30 rounded-lg p-2 outline-none text-xs text-text-muted transition-all placeholder:text-text-muted/40"
                                                    rows={3}
                                                />
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                <input
                                                    type="number"
                                                    value={obj.weight || ''}
                                                    onChange={(e) => handleObjectiveChange(index, 'weight', e.target.value)}
                                                    className="w-16 text-center bg-brand-primary/5 text-brand-primary px-2 py-1.5 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary"
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="px-6 py-6 text-center">
                                                {objectives.length > 1 && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeObjective(index)}
                                                        className="text-text-muted hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Section 3: Timeline */}
                    <section id="step-3" className="bg-white rounded-3xl border border-surface-border shadow-premium p-8">
                         <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-brand-primary/10 rounded-xl">
                                <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-text-title">Timeline & Support</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <div className="md:col-span-2 space-y-8">
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">Duration</label>
                                    <div className="flex gap-4">
                                        <button type="button" className="flex-1 p-4 rounded-2xl border-2 border-brand-primary bg-brand-primary/5 text-left group">
                                            <p className="font-bold text-sm text-brand-primary">30 Days</p>
                                            <p className="text-[10px] text-brand-primary/70">Accelerated Review</p>
                                        </button>
                                        <button type="button" className="flex-1 p-4 rounded-2xl border border-surface-border bg-surface-base text-left group hover:border-gray-300">
                                            <p className="font-bold text-sm text-text-title">60 Days</p>
                                            <p className="text-[10px] text-text-muted">Standard Duration</p>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Start Date</label>
                                        <input
                                            type="date"
                                            name="startDate"
                                            value={formData.startDate}
                                            onChange={handleChange}
                                            className="w-full bg-surface-base border border-surface-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-primary outline-none font-medium"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">End Date</label>
                                        <input
                                            type="date"
                                            name="endDate"
                                            value={formData.endDate}
                                            onChange={handleChange}
                                            className="w-full bg-surface-base border border-surface-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-primary outline-none font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-surface-base rounded-2xl p-6 border border-surface-border">
                                <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">Resources & Support Provided</label>
                                <div className="space-y-3">
                                    {[
                                        'Weekly 1:1 Mentorship',
                                        'Advanced Refactoring Course',
                                        'Pair Programming Sessions'
                                    ].map((resource, idx) => (
                                        <label key={resource} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-surface-border cursor-pointer hover:border-brand-secondary transition shadow-sm">
                                            <input type="checkbox" defaultChecked={idx < 2} className="w-4 h-4 rounded border-surface-border text-brand-primary focus:ring-brand-primary" />
                                            <span className="text-xs font-bold text-text-body">{resource}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Follow-up */}
                    <section id="step-4" className="bg-white rounded-3xl border border-surface-border shadow-premium p-8">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-brand-primary/10 rounded-xl">
                                <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-text-title">Follow-up Schedule</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {[
                                { id: 1, date: 'Nov 14, 2023' },
                                { id: 2, date: 'Nov 28, 2023' }
                            ].map((check) => (
                                <div key={check.id} className="bg-surface-base rounded-2xl p-6 border border-surface-border group relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Check-in #{check.id}</p>
                                        <button className="text-text-muted hover:text-brand-primary transition">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="text-lg font-bold text-text-title mb-1">{check.date}</p>
                                    <p className="text-[10px] text-text-muted">Bi-weekly status review</p>
                                </div>
                            ))}
                            <button className="rounded-2xl border-2 border-dashed border-brand-primary/30 bg-brand-primary/5 p-6 flex flex-col items-center justify-center gap-2 hover:bg-brand-primary/10 hover:border-brand-primary/50 transition">
                                <div className="w-8 h-8 rounded-full bg-brand-primary flex items-center justify-center text-white shadow-lg shadow-brand-primary/20">
                                    <span className="text-xl font-bold">+</span>
                                </div>
                                <p className="text-xs font-bold text-brand-primary uppercase tracking-widest">Add Review Date</p>
                            </button>
                        </div>
                    </section>

                    {/* Footer Actions */}
                    <div className="flex justify-between items-center py-10 border-t border-surface-border">
                        <button 
                            type="button" 
                            onClick={() => navigate('/pip')}
                            className="bg-gray-100 text-text-body px-8 py-3 rounded-xl text-sm font-bold hover:bg-gray-200 transition shadow-sm"
                        >
                            Discard Draft
                        </button>
                        <div className="flex gap-4">
                            <button 
                                type="button" 
                                className="bg-white border-2 border-brand-secondary text-brand-secondary px-8 py-3 rounded-xl text-sm font-bold hover:bg-brand-secondary/5 transition shadow-sm"
                            >
                                Save Draft
                            </button>
                            <button 
                                type="button"
                                onClick={handleSubmit}
                                disabled={isCreating}
                                className="bg-brand-primary text-white px-10 py-3 rounded-xl text-sm font-bold shadow-xl shadow-brand-primary/20 hover:bg-brand-primary/90 transition flex items-center gap-2"
                            >
                                {isCreating ? 'Activating...' : 'Activate Performance Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default PipCreatePage;

