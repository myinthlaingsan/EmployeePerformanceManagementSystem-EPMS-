import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    useGetPipByIdQuery,
    useGetObjectivesByPipQuery,
    useGetReviewsByPipQuery,
} from '../../services/pipApi';
import { useGetEmployeesQuery } from '../../features/employee/employeeapi';
import { useAuth } from '../../hooks/useAuth';
import {
    Plus,
    Lock,
    Calendar,
    ChevronRight,
    MessageSquare,
    TrendingUp,
    FileText,
    CheckCircle2,
    AlertCircle,
    Play
} from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

import ObjectiveStatusBadge from '../../components/pip/ObjectiveStatusBadge';
import PipStatusBadge from '../../components/pip/PipStatusBadge';
import ReviewModal from '../../components/pip/ReviewModal';
import ObjectiveModal from '../../components/pip/ObjectiveModal';
import ProgressModal from '../../components/pip/ProgressModal';
import FinalizeModal from '../../components/pip/FinalizeModal';
import ObjectiveProgressList from '../../components/pip/ObjectiveProgressList';
import {
    useActivatePipMutation,
    useDeletePipMutation,
    useExtendPipMutation,
    useUpdatePipMutation,
    useCreateReviewMutation,
    useCreateObjectiveMutation,
    useAddProgressMutation,
    useFinalizePipMutation,
    useUpdateObjectiveMutation,
    useUpdateObjectiveStatusMutation
} from '../../services/pipApi';
import { PipStatus, PipOutcome, ObjectiveStatus } from '../../features/pip/types';

const PipDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const pipId = Number(id);

    const { data: pipResponse, isLoading: isPipLoading } = useGetPipByIdQuery(pipId);
    const { data: objectivesResponse } = useGetObjectivesByPipQuery(pipId);
    const { data: reviewsResponse } = useGetReviewsByPipQuery(pipId);

    const pip = pipResponse?.data;
    const objectives = objectivesResponse?.data ?? [];
    const reviews = reviewsResponse?.data ?? [];
    const { user, isHR, isManager: hasManagerRole, isEmployee: hasEmployeeRole } = useAuth();

    const isCurrentEmployee = user?.id === pip?.employeeId;
    const isCurrentManager = user?.id === pip?.managerId;

    const [activatePip] = useActivatePipMutation();
    const [deletePip] = useDeletePipMutation();
    const [extendPip] = useExtendPipMutation();
    const [updatePip] = useUpdatePipMutation();
    const [createReview] = useCreateReviewMutation();
    const [createObjective] = useCreateObjectiveMutation();
    const [updateObjective] = useUpdateObjectiveMutation();
    const [updateObjectiveStatus] = useUpdateObjectiveStatusMutation();
    const [addProgress] = useAddProgressMutation();
    const [finalizePip] = useFinalizePipMutation();

    const { data: employeesData } = useGetEmployeesQuery({ page: 0, size: 1000 });
    const allEmployees = employeesData?.content || [];

    const [reflection, setReflection] = useState('');
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
    const [isObjectiveModalOpen, setIsObjectiveModalOpen] = useState(false);
    const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
    const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
    const [selectedObjectiveId, setSelectedObjectiveId] = useState<number | null>(null);
    const [editingObjective, setEditingObjective] = useState<any>(null);
    const [expandedObjectives, setExpandedObjectives] = useState<number[]>([]);
    const [privateNote, setPrivateNote] = useState('');
    const [isEditingReason, setIsEditingReason] = useState(false);
    const [editedReason, setEditedReason] = useState('');



    useEffect(() => {
        if (pip) {
            setPrivateNote(isCurrentEmployee ? (pip.employeePrivateNote || '') : (pip.managerPrivateNote || ''));
            setEditedReason(pip.reason || '');
        }
    }, [pip, isCurrentEmployee]);

    if (isPipLoading || !pip) {
        return <div className="flex items-center justify-center h-64 text-slate-400 font-bold uppercase tracking-widest text-[10px]">Orchestrating Workspace...</div>;
    }

    const canManage = isHR || isCurrentManager;

    // Metrics
    const totalObjectives = objectives.length;
    const achievedObjectives = objectives.filter(o => o.status === 'COMPLETED').length;
    const avgProgress = totalObjectives > 0
        ? Math.round(objectives.reduce((acc, obj) => acc + (obj.currentProgress || 0), 0) / totalObjectives)
        : 0;

    const daysElapsed = differenceInDays(new Date(), parseISO(pip.startDate));
    const totalDuration = differenceInDays(parseISO(pip.endDate), parseISO(pip.startDate));

    const nextReviewDate = pip.scheduledReviewDates?.find(d => parseISO(d) > new Date());

    const handleActivate = async () => {
        try {
            await activatePip(pipId).unwrap();
            toast.success("PIP Activated Successfully!");
        } catch (err: any) {
            console.error('Failed to activate PIP:', err);
            toast.error("Failed to activate PIP: " + (err.data?.message || "Check permissions or state."));
        }
    };

    const handleDelete = async () => {
        if (window.confirm('Are you sure you want to delete this PIP? This action cannot be undone.')) {
            try {
                await deletePip(pipId).unwrap();
                navigate('/pip');
            } catch (err: any) {
                console.error('Failed to delete PIP:', err);
                toast.error('Failed to delete PIP: ' + (err?.data?.message || 'Check permissions.'));
            }
        }
    };

    const handleCreateReview = async (data: any) => {
        try {
            await createReview({ ...data, pipId }).unwrap();
            setIsReviewModalOpen(false);
            toast.success("Review added successfully!");
        } catch (err: any) {
            console.error('Failed to create review:', err);
            toast.error("Failed to add review: " + (err?.data?.message || "Check permissions."));
        }
    };

    const handleCreateObjective = async (data: any) => {
        try {
            await createObjective({ ...data, pipId }).unwrap();
            setIsObjectiveModalOpen(false);
        } catch (err) {
            console.error('Failed to create objective:', err);
            throw err;
        }
    };

    const handleEditObjective = async (data: any) => {
        try {
            await updateObjective({ id: editingObjective.objectiveId, body: data }).unwrap();
            setEditingObjective(null);
        } catch (err) {
            console.error('Failed to update objective:', err);
            throw err;
        }
    };

    const handleSaveReason = async () => {
        try {
            await updatePip({ id: pipId, body: { reason: editedReason } }).unwrap();
            setIsEditingReason(false);
            toast.success("PIP Reason updated successfully!");
        } catch (err: any) {
            console.error('Failed to save reason:', err);
            toast.error("Failed to update reason: " + (err?.data?.message || "Check permissions."));
        }
    };

    const handleStatusChange = async (objectiveId: number, status: ObjectiveStatus) => {
        try {
            await updateObjectiveStatus({ id: objectiveId, status }).unwrap();
        } catch (err: any) {
            console.error('Failed to update objective status:', err);
            toast.error('Failed to update objective status: ' + (err?.data?.message || 'Check permissions.'));
        }
    };

    const handleAddProgress = async (data: any) => {
        try {
            await addProgress({ ...data, objectiveId: selectedObjectiveId }).unwrap();

            // Intelligent Progress Syncing:
            // If progress reaches 100%, automatically flip status to COMPLETED
            const objective = objectives.find(o => o.objectiveId === selectedObjectiveId);
            if (data.progressPercent === 100 && objective?.status !== 'COMPLETED') {
                await updateObjectiveStatus({ id: selectedObjectiveId, status: ObjectiveStatus.COMPLETED }).unwrap();
            } else if (data.progressPercent < 100 && objective?.status === 'COMPLETED') {
                await updateObjectiveStatus({ id: selectedObjectiveId, status: ObjectiveStatus.IN_PROGRESS }).unwrap();
            }

            setIsProgressModalOpen(false);
            toast.success("Progress logged successfully!");
        } catch (err: any) {
            console.error('Failed to add progress:', err);
            toast.error("Failed to log progress: " + (err?.data?.message || "Check permissions."));
        }
    };

    const handleFinalize = async (data: { outcome: PipOutcome; comment: string; newEndDate?: string; scheduledReviewDates?: string[] }) => {
        try {
            if (data.outcome === PipOutcome.EXTEND && data.newEndDate) {
                await extendPip({ 
                    id: pipId, 
                    body: { 
                        newEndDate: data.newEndDate,
                        scheduledReviewDates: data.scheduledReviewDates 
                    } 
                }).unwrap();
            }
            await finalizePip({
                pipId,
                outcome: data.outcome,
                comment: data.comment
            }).unwrap();

            setIsFinalizeModalOpen(false);
            toast.success(`PIP Finalized as ${data.outcome}`);
        } catch (err: any) {
            console.error('Failed to finalize PIP:', err);
            toast.error("Failed to finalize: " + (err.data?.message || "Check fields and permissions."));
        }
    };

    const handleSavePrivateNote = async () => {
        try {
            const body = isCurrentEmployee
                ? { employeePrivateNote: privateNote }
                : { managerPrivateNote: privateNote };
            await updatePip({ id: pipId, body }).unwrap();
            toast.success("Private note saved successfully!");
        } catch (err: any) {
            console.error('Failed to save private note:', err);
            toast.error("Failed to save private note: " + (err?.data?.message || "Check permissions."));
        }
    };

    const toggleObjectiveHistory = (id: number) => {
        setExpandedObjectives(prev =>
            prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
        );
    };

    return (
        <div className="bg-[#f8f9fa] min-h-screen text-[#2b3437] font-sans antialiased pb-20">

            {/* ── BREADCRUMB & EDITORIAL HEADER ───────────────────────── */}
            <div className="px-6 pt-6 pb-8">
                <nav className="flex items-center gap-2 mb-3">
                    <span className="text-[9px] font-black text-[#586064] uppercase tracking-[0.05rem]">PIPS</span>
                    <ChevronRight className="w-2.5 h-2.5 text-[#abb3b7]" strokeWidth={4} />
                    <span className="text-[9px] font-black text-[#005db5] uppercase tracking-[0.05rem]">
                        {isCurrentEmployee ? user?.staffName?.toUpperCase() : `PIP ID: ${pip.pipId}`}
                    </span>
                </nav>

                <div className="flex items-start justify-between">
                    <div>
                        {isEditingReason ? (
                            <div className="flex items-center gap-2 mb-2">
                                <input
                                    value={editedReason}
                                    onChange={e => setEditedReason(e.target.value)}
                                    className="text-[20px] font-black tracking-[-0.02em] text-[#2b3437] leading-tight bg-[#ffffff] rounded-xl px-4 py-2 border-2 border-[#005db5]/20 focus:border-[#005db5] outline-none w-[400px] shadow-sm"
                                />
                                <button onClick={handleSaveReason} className="bg-[#005db5] text-white px-4 py-2.5 rounded-lg text-[10px] font-black uppercase shadow-sm">SAVE</button>
                                <button onClick={() => setIsEditingReason(false)} className="bg-white text-[#586064] ring-1 ring-[#abb3b7]/30 px-4 py-2.5 rounded-lg text-[10px] font-black uppercase shadow-sm">CANCEL</button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-[28px] font-black tracking-[-0.02em] text-[#2b3437] leading-tight">
                                    {pip.reason || 'Performance Improvement Plan'}
                                </h1>
                                {canManage && pip.status !== PipStatus.COMPLETED && pip.status !== PipStatus.CLOSED && (
                                    <button onClick={() => setIsEditingReason(true)} className="text-[10px] font-black text-[#abb3b7] hover:text-[#005db5] uppercase tracking-widest transition-colors">EDIT</button>
                                )}
                            </div>
                        )}
                        <p className="text-[12px] font-medium text-[#586064] mt-2">
                            Started: {format(parseISO(pip.startDate), 'MMM dd, yyyy')} &nbsp;•&nbsp; Duration: {totalDuration} Days &nbsp;•&nbsp;
                            Subject: <span className="text-[#2b3437] font-bold">{allEmployees.find(e => e.id === pip.employeeId)?.staffName || `ID ${pip.employeeId}`}</span> &nbsp;•&nbsp;
                            Orchestrated by: <span className="text-[#005db5] font-bold">{allEmployees.find(e => e.id === pip.managerId)?.staffName || `ID ${pip.managerId}`}</span>
                        </p>
                    </div>

                    <div className="flex gap-3 mt-4">
                        <PipStatusBadge status={pip.status} />

                        {pip.status === PipStatus.DRAFT && canManage && (
                            <button
                                onClick={handleActivate}
                                className="bg-[#005db5] text-white px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.05rem] hover:bg-[#0052a0] transition-all shadow-sm flex items-center gap-2"
                            >
                                <Play className="w-3 h-3 fill-current" /> ACTIVATE PIP
                            </button>
                        )}

                        {canManage && pip.status !== PipStatus.COMPLETED && pip.status !== PipStatus.CLOSED && (
                            <button
                                onClick={() => setIsFinalizeModalOpen(true)}
                                className="bg-white text-[#005db5] px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.05rem] hover:bg-[#f1f4f6] transition-all ring-1 ring-[#005db5]/30 shadow-sm"
                            >
                                FINALIZE PIP
                            </button>
                        )}

                        {isHR && pip.status === PipStatus.DRAFT && (
                            <button
                                onClick={handleDelete}
                                className="bg-white text-red-500 px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.05rem] hover:bg-red-50 transition-all ring-1 ring-red-500/30 shadow-sm"
                            >
                                DELETE PIP
                            </button>
                        )}

                        <button className="bg-white text-[#586064] px-6 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-[0.05rem] hover:bg-[#f1f4f6] transition-all ring-1 ring-[#abb3b7]/15 shadow-sm">
                            EXPORT REPORT
                        </button>
                    </div>
                </div>
            </div>

            {/* ── LAYOUT GRID ────────────────────────────────────────── */}
            <div className="px-6 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6 items-start">

                {/* ────────── LEFT COLUMN (PRIMARY CONTENT) ────────── */}
                <div className="space-y-6">

                    {/* Overall Progress Card */}
                    <div className="bg-[#ffffff] rounded-2xl p-8 ring-1 ring-[#abb3b7]/15 shadow-sm">
                        <div className="flex items-end justify-between mb-6">
                            <span className="text-[10px] font-black text-[#586064] uppercase tracking-[0.05rem]">PERFORMANCE PROGRESS</span>
                            <span className="text-[48px] font-black text-[#005db5] leading-none tracking-tighter">{avgProgress}%</span>
                        </div>

                        <div className="h-3 w-full bg-[#dbe4e7] rounded-full overflow-hidden mb-8">
                            <div
                                className="h-full bg-gradient-to-r from-[#005db5] to-[#4c9eff] rounded-full transition-all duration-1000 ease-out"
                                style={{ width: `${avgProgress}%` }}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            {[
                                { label: 'TIME ELAPSED', value: `${daysElapsed} Days`, icon: TrendingUp },
                                { label: 'OBJECTIVES MET', value: `${achievedObjectives} / ${totalObjectives}`, icon: FileText },
                                { label: 'NEXT CHECK-IN', value: nextReviewDate ? format(parseISO(nextReviewDate), 'MMM dd') : 'None Set', icon: Calendar },
                            ].map((stat, i) => (
                                <div key={i} className="bg-[#f1f4f6] rounded-xl p-5">
                                    <div className="flex items-center gap-2.5 mb-2">
                                        <stat.icon className="w-3.5 h-3.5 text-[#005db5]" />
                                        <p className="text-[9px] font-black text-[#586064] uppercase tracking-[0.05rem]">{stat.label}</p>
                                    </div>
                                    <p className="text-[20px] font-black text-[#2b3437] leading-none tracking-tight">{stat.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Improvement Objectives */}
                    <div className="bg-[#ffffff] rounded-2xl overflow-hidden ring-1 ring-[#abb3b7]/15 shadow-sm">
                        <div className="bg-[#e3e9ec] px-8 py-4 border-b border-[#005db5]/5 flex justify-between items-center">
                            <h3 className="text-[10px] font-black text-[#2b3437] uppercase tracking-[0.1rem]">IMPROVEMENT OBJECTIVES</h3>
                            {canManage && pip.status !== PipStatus.CLOSED && pip.status !== PipStatus.COMPLETED && (
                                <button
                                    onClick={() => setIsObjectiveModalOpen(true)}
                                    className="flex items-center gap-1.5 text-[10px] font-black text-[#005db5] uppercase tracking-[0.05rem]"
                                >
                                    <Plus className="w-3.5 h-3.5" strokeWidth={3} /> ADD OBJECTIVE
                                </button>
                            )}
                        </div>
                        <div className="p-8 space-y-12">
                            {objectives.length > 0 ? (
                                objectives.map((objective) => (
                                    <div key={objective.objectiveId} className="flex gap-8 group">
                                        <div className={`w-1 rounded-full shrink-0 transition-all duration-300 ${objective.status === 'COMPLETED' ? 'bg-[#10b981]' :
                                            objective.status === 'IN_PROGRESS' ? 'bg-[#005db5]' :
                                                'bg-[#abb3b7]'
                                            }`}></div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-3">
                                                    <h4 className="text-[17px] font-black text-[#2b3437] tracking-tight leading-snug">{objective.title}</h4>
                                                    {canManage && pip.status !== PipStatus.COMPLETED && pip.status !== PipStatus.CLOSED && (
                                                        <button
                                                            onClick={() => setEditingObjective(objective)}
                                                            className="text-[9px] font-black text-[#abb3b7] uppercase tracking-widest hover:text-[#005db5] transition-colors"
                                                        >
                                                            EDIT
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex gap-3 items-center">
                                                    <ObjectiveStatusBadge status={objective.status} />
                                                    {canManage && pip.status !== PipStatus.DRAFT && pip.status !== PipStatus.CLOSED && (
                                                        <select
                                                            value={objective.status}
                                                            onChange={(e) => handleStatusChange(objective.objectiveId, e.target.value as ObjectiveStatus)}
                                                            className="text-[9px] font-black text-[#586064] bg-[#f1f4f6] rounded px-2 py-1 outline-none cursor-pointer uppercase tracking-widest hover:bg-[#e3e9ec] transition-colors"
                                                        >
                                                            {objective.status === 'NOT_STARTED' && (
                                                                <option value="NOT_STARTED">NOT STARTED</option>
                                                            )}
                                                            <option value="IN_PROGRESS">IN PROGRESS</option>
                                                            <option value="COMPLETED">COMPLETED</option>
                                                        </select>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-[13px] text-[#586064] leading-relaxed max-w-2xl mb-4">
                                                {objective.description}
                                            </p>
                                            <div className="flex items-center gap-4 text-[11px] font-bold text-[#586064]">
                                                <span className="flex items-center gap-1.5">
                                                    <Calendar className="w-3 h-3" />
                                                    Target: {format(parseISO(objective.targetDate), 'MMM dd, yyyy')}
                                                </span>
                                                <span className="bg-[#f1f4f6] px-2 py-0.5 rounded text-[9px] uppercase tracking-wider">
                                                    {objective.successCriteria}
                                                </span>
                                                {isCurrentEmployee && pip.status !== PipStatus.CLOSED && pip.status !== PipStatus.COMPLETED && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedObjectiveId(objective.objectiveId);
                                                            setIsProgressModalOpen(true);
                                                        }}
                                                        className="ml-auto text-[#005db5] hover:underline uppercase tracking-tighter text-[9px]"
                                                    >
                                                        LOG PROGRESS
                                                    </button>
                                                )}
                                            </div>

                                            {/* Progress Bar Display */}
                                            <div className="mb-6 p-4 bg-[#f1f4f6]/50 rounded-xl ring-1 ring-[#abb3b7]/10">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-[10px] font-black text-[#586064] uppercase tracking-wider">CURRENT PROGRESS</span>
                                                    <span className="text-[12px] font-black text-[#005db5]">{objective.currentProgress || 0}%</span>
                                                </div>
                                                <div className="h-2 w-full bg-white rounded-full overflow-hidden shadow-inner">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-[#005db5] to-[#0052a0] rounded-full transition-all duration-1000 ease-out"
                                                        style={{ width: `${objective.currentProgress || 0}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Collapsible Progress History */}
                                            <div className="mt-8">
                                                <button
                                                    onClick={() => toggleObjectiveHistory(objective.objectiveId)}
                                                    className="flex items-center gap-2 text-[10px] font-black text-[#abb3b7] uppercase tracking-[0.15rem] hover:text-[#005db5] transition-colors"
                                                >
                                                    PROGRESS HISTORY
                                                    <ChevronRight className={`w-3.5 h-3.5 transition-transform duration-300 ${expandedObjectives.includes(objective.objectiveId) ? 'rotate-90 text-[#005db5]' : ''}`} strokeWidth={4} />
                                                </button>

                                                {expandedObjectives.includes(objective.objectiveId) && (
                                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                        <ObjectiveProgressList objectiveId={objective.objectiveId} hideTitle />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-slate-400 text-[11px] font-black uppercase tracking-widest">No objectives defined for this PIP</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ────────── RIGHT COLUMN (SECONDARY ARCHITECTURE) ────────── */}
                <aside className="space-y-6">

                    {/* Milestone Timeline */}
                    <div className="bg-[#ffffff] rounded-2xl p-7 ring-1 ring-[#abb3b7]/15 shadow-sm">
                        <h3 className="text-[9px] font-black text-[#586064] uppercase tracking-[0.1rem] mb-8">MILESTONE TIMELINE</h3>
                        <div className="relative pl-9 space-y-9">
                            <div className="absolute left-[11px] top-2 bottom-2 w-[1px] bg-[#f1f4f6]" />

                            {/* Start Milestone */}
                            <div className="relative">
                                <div className="absolute -left-[35px] top-0.5 w-[22px] h-[22px] rounded-full border-4 border-[#ffffff] shadow-sm flex items-center justify-center bg-[#10b981]">
                                    <CheckCircle2 className="w-3 h-3 text-white" />
                                </div>
                                <p className="text-[9px] font-black text-[#abb3b7] mb-1">{format(parseISO(pip.startDate), 'MMM dd')}</p>
                                <h4 className="text-[13px] font-extrabold text-[#2b3437] leading-tight">PIP Initiation</h4>
                            </div>

                            {/* Scheduled Reviews */}
                            {pip.scheduledReviewDates?.map((date, i) => {
                                const mDate = parseISO(date);
                                const isPast = mDate < new Date();
                                // Milestone "Check-off" Logic:
                                // Flexible matching - count as done if a review exists within +/- 3 days of the scheduled milestone
                                const isDone = reviews.some(r => {
                                    const rDate = parseISO(r.reviewDate);
                                    const diff = Math.abs(differenceInDays(rDate, mDate));
                                    return diff <= 3;
                                });
                                return (
                                    <div key={i} className="relative">
                                        <div className={`absolute -left-[35px] top-0.5 w-[22px] h-[22px] rounded-full border-4 border-[#ffffff] shadow-sm flex items-center justify-center ${isDone ? 'bg-[#10b981]' : isPast ? 'bg-[#ef4444]' : 'bg-[#005db5]'
                                            }`}>
                                            {isDone ? <CheckCircle2 className="w-3 h-3 text-white" /> : isPast ? <AlertCircle className="w-3 h-3 text-white" /> : null}
                                        </div>
                                        <p className="text-[9px] font-black text-[#abb3b7] mb-1">{format(parseISO(date), 'MMM dd')}</p>
                                        <h4 className="text-[13px] font-extrabold text-[#2b3437] leading-tight">Check-in Session</h4>
                                    </div>
                                );
                            })}

                            {/* End Milestone */}
                            <div className="relative">
                                <div className={`absolute -left-[35px] top-0.5 w-[22px] h-[22px] rounded-full border-4 border-[#ffffff] shadow-sm flex items-center justify-center ${pip.status === 'COMPLETED' ? 'bg-[#10b981]' : 'bg-[#f1f4f6]'
                                    }`}>
                                    {pip.status === 'COMPLETED' && <CheckCircle2 className="w-3 h-3 text-white" />}
                                </div>
                                <p className="text-[9px] font-black text-[#abb3b7] mb-1">{format(parseISO(pip.endDate), 'MMM dd')}</p>
                                <h4 className="text-[13px] font-extrabold text-[#2b3437] leading-tight">Final Determination</h4>
                            </div>
                        </div>
                    </div>

                    {/* Role-Specific Private Notes */}
                    {(isCurrentEmployee || isCurrentManager) && (
                        <div className="bg-[#f1f4f6] rounded-2xl p-7 ring-1 ring-[#005db5]/5">
                            <div className="flex items-center gap-3 mb-8 text-[#005db5]">
                                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <Lock className="w-4 h-4" strokeWidth={3} />
                                </div>
                                <h3 className="text-[10px] font-black uppercase tracking-[0.12rem]">
                                    {isCurrentEmployee ? 'EMPLOYEE PRIVATE NOTES' : "MANAGER'S PRIVATE NOTES"}
                                </h3>
                            </div>

                            <textarea
                                value={privateNote}
                                onChange={e => setPrivateNote(e.target.value)}
                                className="w-full bg-white rounded-xl p-5 text-[13px] text-[#005db5] outline-none border border-transparent focus:border-[#005db5]/10 transition-all placeholder:text-[#abb3b7] min-h-[120px] shadow-sm mb-4"
                                placeholder={isCurrentEmployee ? "Your private thoughts (only visible to you)..." : "Private manager notes (not visible to employee)..."}
                            />

                            <button
                                onClick={handleSavePrivateNote}
                                className="w-full bg-[#005db5] text-white py-3.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15rem] hover:bg-[#0052a0] transition-all shadow-sm shadow-blue-100/50"
                            >
                                SAVE PRIVATE NOTE
                            </button>
                        </div>
                    )}
                </aside>
            </div>

            {/* ── BOTTOM SECTIONS ─────────────────────────────── */}
            <div className="px-6 mt-10">
                {/* Minimalist Progress Reviews */}
                <div className="bg-white rounded-3xl overflow-hidden ring-1 ring-[#abb3b7]/15 shadow-sm">
                    <div className="px-10 py-6 border-b border-[#f1f4f6] flex justify-between items-center bg-[#fcfdfe]">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-6 bg-[#005db5] rounded-full" />
                            <h3 className="text-[11px] font-black text-[#2b3437] uppercase tracking-[0.2rem]">PROGRESS LEDGER</h3>
                        </div>
                        {canManage && pip.status !== PipStatus.CLOSED && pip.status !== PipStatus.COMPLETED && (
                            <button
                                onClick={() => setIsReviewModalOpen(true)}
                                className="flex items-center gap-1.5 text-[9px] font-black text-[#005db5] bg-blue-50 px-4 py-2 rounded-full uppercase tracking-widest hover:bg-blue-100 transition-all"
                            >
                                <Plus className="w-3 h-3" /> ADD ENTRY
                            </button>
                        )}
                    </div>

                    <div className="divide-y divide-[#f1f4f6]">
                        {reviews.length > 0 ? (
                            reviews.map((log) => (
                                <div key={log.reviewId} className="p-8 hover:bg-[#fafbfc]/50 transition-colors">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="text-[10px] font-black text-[#005db5] bg-blue-50 px-3 py-1 rounded-md tracking-wider uppercase">
                                                {format(parseISO(log.reviewDate), 'MMM dd, yyyy')}
                                            </div>
                                            <div className="text-[11px] font-bold text-[#586064] flex items-center gap-2">
                                                <MessageSquare className="w-3.5 h-3.5" />
                                                Formal Review by <span className="text-[#005db5]">{allEmployees.find(e => e.id === log.createdBy)?.staffName || 'Manager'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                        <div className="lg:col-span-2">
                                            <p className="text-[14px] text-[#2b3437] leading-relaxed font-medium">
                                                {log.progressSummary}
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            {log.managerFeedback && (
                                                <div className="p-4 bg-[#f8fafb] rounded-2xl border border-[#f1f4f6]">
                                                    <h5 className="text-[8px] font-black text-[#abb3b7] uppercase tracking-widest mb-2">FEEDBACK</h5>
                                                    <p className="text-[12px] text-[#586064] leading-relaxed">
                                                        {log.managerFeedback}
                                                    </p>
                                                </div>
                                            )}

                                            {log.nextAction && (
                                                <div className="flex items-center gap-3 px-4 py-3 bg-[#f1f4f6]/50 rounded-xl">
                                                    <TrendingUp className="w-3.5 h-3.5 text-[#005db5]" />
                                                    <span className="text-[11px] text-[#2b3437] font-bold truncate">
                                                        {log.nextAction}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-16">
                                <p className="text-[#abb3b7] text-[11px] font-black uppercase tracking-widest">No entries in ledger</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {/* Modals */}
            {isReviewModalOpen && (
                <ReviewModal
                    onClose={() => setIsReviewModalOpen(false)}
                    onSave={handleCreateReview}
                />
            )}
            {isObjectiveModalOpen && (
                <ObjectiveModal
                    pipStartDate={pip.startDate}
                    onClose={() => setIsObjectiveModalOpen(false)}
                    onSave={handleCreateObjective}
                />
            )}
            {editingObjective && (
                <ObjectiveModal
                    initialData={editingObjective}
                    onClose={() => setEditingObjective(null)}
                    onSave={handleEditObjective}
                />
            )}
            {isProgressModalOpen && selectedObjectiveId && (
                <ProgressModal
                    onClose={() => setIsProgressModalOpen(false)}
                    onSave={handleAddProgress}
                    initialProgress={objectives.find(o => o.objectiveId === selectedObjectiveId)?.currentProgress || 0}
                />
            )}
            {isFinalizeModalOpen && (
                <FinalizeModal
                    currentEndDate={pip.endDate}
                    existingReviewDates={pip.scheduledReviewDates}
                    onClose={() => setIsFinalizeModalOpen(false)}
                    onSave={handleFinalize}
                />
            )}
        </div>
    );
};

export default PipDetailsPage;
