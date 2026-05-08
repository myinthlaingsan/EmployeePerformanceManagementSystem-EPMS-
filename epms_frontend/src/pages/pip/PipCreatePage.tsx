import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreatePipMutation, useCreateObjectiveMutation, useActivatePipMutation } from '../../services/pipApi';
import { useGetEmployeesQuery } from '../../features/employee/employeeapi';
import { useGetDepartmentsQuery } from '../../features/org/departmentApi';
import { PipSeverity } from '../../features/pip/types';
import type { PipCreateRequest } from '../../features/pip/types';

// Local type for objectives before they have a PIP ID
interface LocalObjective {
    title: string;
    description: string;
    successCriteria: string;
    targetDate: string;
}

const PipCreatePage: React.FC = () => {
    const navigate = useNavigate();
    const [createPip, { isLoading: isCreating }] = useCreatePipMutation();
    const [createObjective] = useCreateObjectiveMutation();
    const [activatePip, { isLoading: isActivating }] = useActivatePipMutation();
    
    const { data: departments, isLoading: isDepartmentsLoading } = useGetDepartmentsQuery();
    const { data: employeeData, isLoading: isEmployeesLoading } = useGetEmployeesQuery({ page: 0, size: 1000 });
    const employees = employeeData?.content;

    const [activeStep, setActiveStep] = useState(1);
    const [selectedDepartmentId, setSelectedDepartmentId] = useState<number>(0);
    
    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const stepId = parseInt(entry.target.id.replace('step-', ''));
                    setActiveStep(stepId);
                }
            });
        }, { threshold: 0.3, rootMargin: "-10% 0px -40% 0px" });

        setTimeout(() => {
            [1, 2, 3, 4].forEach(id => {
                const el = document.getElementById(`step-${id}`);
                if (el) observer.observe(el);
            });
        }, 100);

        return () => observer.disconnect();
    }, [departments, employees]);

    const scrollToStep = (id: number) => {
        setActiveStep(id);
        const element = document.getElementById(`step-${id}`);
        if (element) {
            const y = element.getBoundingClientRect().top + window.scrollY - 40;
            window.scrollTo({ top: y, behavior: 'smooth' });
        }
    };
    
    const [formData, setFormData] = useState<PipCreateRequest>({
        employeeId: 0,
        managerId: 0,
        startDate: '',
        endDate: '',
        severity: PipSeverity.STANDARD,
        reason: '',
        scheduledReviewDates: []
    });

    const [objectives, setObjectives] = useState<LocalObjective[]>([
        { title: '', description: '', successCriteria: '', targetDate: '' }
    ]);

    const [error, setError] = useState<string | null>(null);
    const [showAutoSave, setShowAutoSave] = useState(true);



    const submitForm = async (isDraft: boolean) => {
        setError(null);

        // Validations
        if (!formData.employeeId || !formData.managerId || !formData.startDate || !formData.endDate || !formData.reason) {
            setError('Please complete all required fields in the Identification section (Employee, Manager, Dates, Reason).');
            scrollToStep(1);
            return;
        }

        if (objectives.length === 0) {
            setError('Please add at least one improvement objective.');
            scrollToStep(3);
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
            
            // 3. Activate if not draft
            if (!isDraft) {
                await activatePip(newPipId).unwrap();
            }
            
            navigate('/pip');
        } catch (err: any) {
            setError(err?.data?.message || 'Failed to process PIP. Please check your inputs.');
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const newData = {
                ...prev,
                [name]: name.includes('Id') ? parseInt(value) : value
            };
            if (name === 'startDate' && newData.endDate && new Date(value) > new Date(newData.endDate)) {
                newData.endDate = '';
            }
            return newData;
        });
    };

    const handleDurationClick = (days: number) => {
        const start = formData.startDate ? new Date(formData.startDate) : new Date();
        const end = new Date(start);
        end.setDate(end.getDate() + days);
        setFormData(prev => ({
            ...prev,
            startDate: start.toISOString().split('T')[0],
            endDate: end.toISOString().split('T')[0]
        }));
    };

    const durationDiff = formData.startDate && formData.endDate 
        ? Math.round((new Date(formData.endDate).getTime() - new Date(formData.startDate).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const addReviewDate = () => {
        setFormData(prev => ({
            ...prev,
            scheduledReviewDates: [...(prev.scheduledReviewDates || []), '']
        }));
    };

    const removeReviewDate = (index: number) => {
        setFormData(prev => ({
            ...prev,
            scheduledReviewDates: (prev.scheduledReviewDates || []).filter((_, i) => i !== index)
        }));
    };

    const handleReviewDateChange = (index: number, dateValue: string) => {
        setFormData(prev => {
            const newDates = [...(prev.scheduledReviewDates || [])];
            newDates[index] = dateValue;
            return { ...prev, scheduledReviewDates: newDates };
        });
    };

    const handleObjectiveChange = (index: number, field: keyof LocalObjective, value: string | number) => {
        const newObjectives = [...objectives];
        newObjectives[index] = { 
            ...newObjectives[index], 
            [field]: value 
        };
        setObjectives(newObjectives);
    };

    const addObjective = () => {
        setObjectives([...objectives, { title: '', description: '', successCriteria: '', targetDate: '' }]);
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

    const handleSeverityChange = (level: PipSeverity) => {
        setFormData(prev => ({
            ...prev,
            severity: level
        }));
    };

    const filteredEmployees = useMemo(() => {
        if (!employees) return [];
        return employees.filter(emp => {
            const matchesDept = selectedDepartmentId === 0 || emp.currentDepartmentId === selectedDepartmentId;
            return matchesDept;
        });
    }, [employees, selectedDepartmentId]);

    const filteredManagers = useMemo(() => {
        if (!employees) return [];
        return employees.filter(emp => {
            const matchesDept = selectedDepartmentId === 0 || emp.currentDepartmentId === selectedDepartmentId;
            const isManager = emp.roles.some(r => r.toUpperCase().includes('MANAGER'));
            return matchesDept && isManager;
        });
    }, [employees, selectedDepartmentId]);
    
    if (isEmployeesLoading || isDepartmentsLoading) {
        return (
            <div className="flex justify-center items-center h-screen bg-surface-base">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface-base flex flex-col">
            {/* Header Section on Top */}
            <header className="pt-10 px-10 pb-8 max-w-7xl mx-auto w-full">
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

            <div className="flex max-w-7xl mx-auto w-full px-10 gap-10 pb-20">
                {/* Left Sidebar Stepper */}
                <aside className="w-56 flex-shrink-0">
                    <nav className="sticky top-10 space-y-8">
                        {[
                            { id: 1, title: 'IDENTIFICATION', sub: 'Employee & Core Issue' },
                            { id: 2, title: 'LOGISTICS', sub: 'Timeline & Resources' },
                            { id: 3, title: 'FRAMEWORK', sub: 'Improvement Objectives' },
                            { id: 4, title: 'GOVERNANCE', sub: 'Follow-up Schedule' }
                        ].map((step) => (
                            <div key={step.id} className="flex gap-4 items-start group cursor-pointer" onClick={() => scrollToStep(step.id)}>
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
                </aside>

            {/* Main Content Area */}
            <main className="flex-1 max-w-4xl">
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
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Reviewing Manager</label>
                                        <select
                                            name="managerId"
                                            value={formData.managerId}
                                            onChange={handleChange}
                                            className="w-full bg-surface-base border border-surface-border rounded-xl px-5 py-4 focus:ring-2 focus:ring-brand-primary outline-none font-medium transition"
                                        >
                                            <option value={0}>
                                                {selectedDepartmentId === 0
                                                    ? 'Select a department first...'
                                                    : filteredManagers.length === 0
                                                        ? 'No managers found in this department'
                                                        : 'Select a manager...'}
                                            </option>
                                            {filteredManagers.map(mgr => (
                                                <option key={mgr.id} value={mgr.id}>{mgr.staffName} ({mgr.employeeCode})</option>
                                            ))}
                                        </select>
                                        {selectedDepartmentId !== 0 && filteredManagers.length === 0 && (
                                            <p className="text-[10px] text-amber-600 font-bold mt-1.5">
                                                ⚠ No users with MANAGER role found in this department.
                                            </p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Severity Level</label>
                                        <div className="flex gap-2">
                                            {(Object.keys(PipSeverity) as Array<keyof typeof PipSeverity>).map((key) => {
                                                const level = PipSeverity[key];
                                                const isSelected = formData.severity === level;
                                                return (
                                                    <button
                                                        key={level}
                                                        type="button"
                                                        onClick={() => handleSeverityChange(level)}
                                                        className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all border
                                                            ${isSelected 
                                                                ? (level === PipSeverity.CRITICAL ? 'bg-red-50 border-red-200 text-red-600 shadow-inner' : 
                                                                   level === PipSeverity.URGENT ? 'bg-orange-50 border-orange-200 text-orange-600 shadow-inner' :
                                                                   'bg-[#fffbeb] border-[#fde68a] text-[#92400e] shadow-inner')
                                                                : 'bg-surface-base border-surface-border text-text-muted hover:border-gray-300'}`}
                                                    >
                                                        {level.charAt(0) + level.slice(1).toLowerCase()}
                                                    </button>
                                                );
                                            })}
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

                    {/* Section 2: Timeline */}
                    <section id="step-2" className="bg-white rounded-3xl border border-surface-border shadow-premium p-8">
                         <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-brand-primary/10 rounded-xl">
                                <svg className="w-6 h-6 text-brand-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-text-title">Timeline & Support</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <div className="md:col-span-3 space-y-8">
                                <div>
                                    <label className="block text-[10px] font-bold text-text-muted uppercase tracking-widest mb-4">Duration</label>
                                    <div className="flex gap-4">
                                        <button type="button" onClick={() => handleDurationClick(30)} className={`flex-1 p-4 rounded-2xl border-2 text-left group transition-all ${durationDiff === 30 ? 'border-brand-primary bg-brand-primary/5' : 'border-surface-border bg-surface-base hover:border-gray-300'}`}>
                                            <p className={`font-bold text-sm ${durationDiff === 30 ? 'text-brand-primary' : 'text-text-title'}`}>30 Days</p>
                                            <p className={`text-[10px] ${durationDiff === 30 ? 'text-brand-primary/70' : 'text-text-muted'}`}>Accelerated Review</p>
                                        </button>
                                        <button type="button" onClick={() => handleDurationClick(60)} className={`flex-1 p-4 rounded-2xl border-2 text-left group transition-all ${durationDiff === 60 ? 'border-brand-primary bg-brand-primary/5' : 'border-surface-border bg-surface-base hover:border-gray-300'}`}>
                                            <p className={`font-bold text-sm ${durationDiff === 60 ? 'text-brand-primary' : 'text-text-title'}`}>60 Days</p>
                                            <p className={`text-[10px] ${durationDiff === 60 ? 'text-brand-primary/70' : 'text-text-muted'}`}>Standard Duration</p>
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
                                            min={formData.startDate || undefined}
                                            onChange={handleChange}
                                            className="w-full bg-surface-base border border-surface-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-primary outline-none font-medium"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Objectives */}
                    <section id="step-3" className="bg-white rounded-3xl border border-surface-border shadow-premium overflow-hidden p-8">
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
                                        <th className="px-4 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest w-[25%]">Objective & Description</th>
                                        <th className="px-4 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest w-[40%]">Success Criteria (KPI)</th>
                                        <th className="px-4 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest w-40">Target Date</th>
                                        <th className="px-4 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center w-12"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-surface-border">
                                    {objectives.map((obj, index) => (
                                        <tr key={index} className="group hover:bg-white transition-colors">
                                            <td className="px-4 py-6 align-top">
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
                                            <td className="px-4 py-6 align-top">
                                                <textarea
                                                    value={obj.successCriteria}
                                                    onChange={(e) => handleObjectiveChange(index, 'successCriteria', e.target.value)}
                                                    placeholder="Measurable KPI (e.g. Reduce bugs by 20%)"
                                                    className="w-full bg-transparent border border-transparent focus:border-brand-secondary/30 rounded-lg p-2 outline-none text-xs text-text-muted transition-all placeholder:text-text-muted/40"
                                                    rows={3}
                                                />
                                            </td>
                                            <td className="px-4 py-6 align-top">
                                                <input
                                                    type="date"
                                                    value={obj.targetDate}
                                                    min={formData.startDate || undefined}
                                                    max={formData.endDate || undefined}
                                                    onChange={(e) => handleObjectiveChange(index, 'targetDate', e.target.value)}
                                                    className="w-full bg-surface-base border border-surface-border rounded-lg px-3 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-brand-primary transition"
                                                />
                                                {!obj.targetDate && formData.endDate && (
                                                    <p className="text-[9px] text-text-muted mt-1">Defaults to end date</p>
                                                )}
                                            </td>

                                            <td className="px-4 py-6 text-center align-top">
                                                {objectives.length > 1 && (
                                                    <button 
                                                        type="button" 
                                                        onClick={() => removeObjective(index)}
                                                        className="text-text-muted hover:text-red-500 transition opacity-0 group-hover:opacity-100 mt-1"
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
                            {(formData.scheduledReviewDates || []).map((date, index) => (
                                <div key={index} className="bg-surface-base rounded-2xl p-6 border border-surface-border group relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">Check-in #{index + 1}</p>
                                        <button 
                                            type="button" 
                                            onClick={() => removeReviewDate(index)}
                                            className="text-text-muted hover:text-red-500 transition"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </button>
                                    </div>
                                    <input
                                        type="date"
                                        value={date}
                                        min={formData.startDate || undefined}
                                        max={formData.endDate || undefined}
                                        onChange={(e) => handleReviewDateChange(index, e.target.value)}
                                        className="w-full bg-white border border-surface-border rounded-lg px-3 py-2 text-sm font-bold outline-none focus:ring-2 focus:ring-brand-primary transition"
                                    />
                                    <p className="text-[10px] text-text-muted mt-2">Planned status review</p>
                                </div>
                            ))}
                            <button 
                                type="button" 
                                onClick={addReviewDate}
                                className="rounded-2xl border-2 border-dashed border-brand-primary/30 bg-brand-primary/5 p-6 flex flex-col items-center justify-center gap-2 hover:bg-brand-primary/10 hover:border-brand-primary/50 transition"
                            >
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
                                onClick={() => submitForm(true)}
                                disabled={isCreating || isActivating}
                                className="bg-white border-2 border-brand-secondary text-brand-secondary px-8 py-3 rounded-xl text-sm font-bold hover:bg-brand-secondary/5 transition shadow-sm"
                            >
                                {isCreating && !isActivating ? 'Saving...' : 'Save Draft'}
                            </button>
                            <button 
                                type="button"
                                onClick={() => submitForm(false)}
                                disabled={isCreating || isActivating}
                                className="bg-brand-primary text-white px-10 py-3 rounded-xl text-sm font-bold shadow-xl shadow-brand-primary/20 hover:bg-brand-primary/90 transition flex items-center gap-2"
                            >
                                {isActivating ? 'Activating...' : 'Activate Performance Plan'}
                            </button>
                        </div>
                    </div>
                </div>
            </main>
            </div>
        </div>
    );
};

export default PipCreatePage;

