import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    useGetPipByIdQuery, 
    useGetObjectivesByPipQuery, 
    useGetReviewsByPipQuery,
    useCreateObjectiveMutation,
    useUpdateObjectiveStatusMutation,
    useAddProgressMutation,
    useCreateReviewMutation,
    useFinalizePipMutation,
    useActivatePipMutation,
    useExtendPipMutation,
    useDeletePipMutation
} from '../../services/pipApi';
import { useGetEmployeesQuery } from '../../features/employee/employeeapi';
import { useAuth } from '../../hooks/useAuth';
import PipStatusBadge from '../../components/pip/PipStatusBadge';
import ObjectiveStatusBadge from '../../components/pip/ObjectiveStatusBadge';
import ObjectiveModal from '../../components/pip/ObjectiveModal';
import ProgressModal from '../../components/pip/ProgressModal';
import ReviewModal from '../../components/pip/ReviewModal';
import FinalizeModal from '../../components/pip/FinalizeModal';
import ObjectiveProgressList from '../../components/pip/ObjectiveProgressList';
import { 
    ObjectiveStatus, 
    PipOutcome, 
    PipStatus 
} from '../../features/pip/types';

const PipDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const pipId = parseInt(id || '0');
    const navigate = useNavigate();
    const { isHR, isManager, isEmployee } = useAuth();

    const { data: pip, isLoading: isPipLoading } = useGetPipByIdQuery(pipId);
    const { data: objectivesResponse } = useGetObjectivesByPipQuery(pipId);
    const { data: reviewsResponse } = useGetReviewsByPipQuery(pipId);
    const { data: employees } = useGetEmployeesQuery();

    const [createObjective] = useCreateObjectiveMutation();
    const [updateStatus] = useUpdateObjectiveStatusMutation();
    const [addProgress] = useAddProgressMutation();
    const [createReview] = useCreateReviewMutation();
    const [finalizePip] = useFinalizePipMutation();
    const [activatePip] = useActivatePipMutation();
    const [extendPip] = useExtendPipMutation();
    const [deletePip] = useDeletePipMutation();

    // UI States
    const [showObjModal, setShowObjModal] = useState(false);
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [selectedObjectiveId, setSelectedObjectiveId] = useState<number | null>(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showFinalizeModal, setShowFinalizeModal] = useState(false);
    const [expandedObjectives, setExpandedObjectives] = useState<number[]>([]);

    const getEmployeeName = (id: number) => {
        return employees?.find(emp => emp.id === id)?.staffName || `ID: ${id}`;
    };

    const toggleObjective = (id: number) => {
        setExpandedObjectives(prev => 
            prev.includes(id) ? prev.filter(oid => oid !== id) : [...prev, id]
        );
    };

    const handleFinalize = async (data: { outcome: PipOutcome; comment: string; newEndDate?: string }) => {
        try {
            if (data.outcome === PipOutcome.EXTEND && data.newEndDate) {
                await extendPip({ id: pipId, body: { newEndDate: data.newEndDate } }).unwrap();
                await createReview({ 
                    pipId, 
                    reviewDate: new Date().toISOString().split('T')[0],
                    progressSummary: "PIP extension decision recorded.",
                    managerFeedback: "PIP Extended", 
                    nextAction: data.comment 
                }).unwrap();
            } else {
                await finalizePip({ pipId, outcome: data.outcome, comment: data.comment }).unwrap();
            }
            navigate('/pip');
        } catch (err) {
            console.error("Failed to finalize PIP", err);
        }
    };

    const handleDelete = async () => {
        if (window.confirm("Are you sure you want to delete this Draft PIP?")) {
            try {
                await deletePip(pipId).unwrap();
                navigate('/pip');
            } catch (err) {
                console.error("Failed to delete PIP", err);
            }
        }
    };

    const objectives = objectivesResponse?.data || [];
    const reviews = reviewsResponse?.data || [];

    if (isPipLoading) {
        return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
    }

    if (!pip) return <div className="p-8 text-center text-red-500 font-bold">PIP Not Found</div>;

    return (
        <div className="space-y-8 pb-12">
            {/* Header Section */}
            <div className="bg-white shadow-xl border border-gray-100 rounded-3xl p-8">
                <div className="flex flex-col md:flex-row justify-between gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-bold text-gray-900">PIP Details</h1>
                            <PipStatusBadge status={pip.status} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                            <div className="flex items-center gap-2 text-gray-600">
                                <span className="font-semibold w-24">Employee:</span>
                                <span>{getEmployeeName(pip.employeeId)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <span className="font-semibold w-24">Manager:</span>
                                <span>{getEmployeeName(pip.managerId)}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <span className="font-semibold w-24">Starts:</span>
                                <span>{pip.startDate}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-600">
                                <span className="font-semibold w-24">Ends:</span>
                                <span>{pip.endDate}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col gap-3">
                        {(isHR || isManager) && pip.status === PipStatus.DRAFT && (
                            <>
                                <button 
                                    onClick={() => activatePip(pipId)}
                                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition"
                                >
                                    Activate Plan
                                </button>
                                {isHR && (
                                    <button 
                                        onClick={handleDelete}
                                        className="bg-red-50 text-red-600 border border-red-200 px-6 py-2.5 rounded-2xl font-bold hover:bg-red-100 transition"
                                    >
                                        Delete Plan
                                    </button>
                                )}
                            </>
                        )}
                        {(isHR || isManager) && (pip.status === PipStatus.ACTIVE || pip.status === PipStatus.EXTENDED) && (
                            <button 
                                onClick={() => setShowFinalizeModal(true)}
                                className="bg-red-600 text-white px-6 py-2.5 rounded-2xl font-bold shadow-lg shadow-red-100 hover:bg-red-700 transition"
                            >
                                Finalize PIP
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="mt-8 pt-8 border-t border-gray-100">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Reason for Plan</h3>
                    <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-2xl italic">"{pip.reason}"</p>
                </div>
            </div>

            {/* Objectives Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Objectives</h2>
                    {(isHR || isManager) && pip.status === PipStatus.DRAFT && (
                        <button 
                            onClick={() => setShowObjModal(true)}
                            className="text-blue-600 flex items-center gap-1 font-bold hover:underline"
                        >
                            + Add Objective
                        </button>
                    )}
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                    {objectives.length > 0 ? (
                        objectives.map(obj => (
                            <div key={obj.objectiveId} className="bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden hover:shadow-md transition">
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <h4 className="text-lg font-bold text-gray-900">{obj.title}</h4>
                                            <p className="text-sm text-gray-500 mt-1">{obj.description}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <ObjectiveStatusBadge status={obj.status} />
                                            <span className="text-[10px] text-gray-400 font-medium">Target: {obj.targetDate}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-blue-50/50 p-3 rounded-xl mb-4 border border-blue-100/50">
                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Success Criteria</span>
                                        <p className="text-xs text-blue-900 mt-1">{obj.successCriteria}</p>
                                    </div>

                                    <div className="flex justify-between items-center">
                                        <button 
                                            onClick={() => toggleObjective(obj.objectiveId)}
                                            className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hover:text-blue-600 transition flex items-center gap-1"
                                        >
                                            {expandedObjectives.includes(obj.objectiveId) ? 'Hide History' : 'View History'}
                                            <svg className={`w-3 h-3 transition-transform ${expandedObjectives.includes(obj.objectiveId) ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </button>
                                        
                                        <div className="flex gap-3">
                                            {isEmployee && (pip.status === PipStatus.ACTIVE || pip.status === PipStatus.EXTENDED) && (
                                                <button 
                                                    onClick={() => { setSelectedObjectiveId(obj.objectiveId); setShowProgressModal(true); }}
                                                    className="text-xs bg-white border border-blue-200 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-50 transition"
                                                >
                                                    Log Progress
                                                </button>
                                            )}
                                            {(isHR || isManager) && (
                                                <select 
                                                    value={obj.status}
                                                    onChange={(e) => updateStatus({ id: obj.objectiveId, status: e.target.value as ObjectiveStatus })}
                                                    className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500"
                                                >
                                                    <option value={ObjectiveStatus.NOT_STARTED}>Mark Not Started</option>
                                                    <option value={ObjectiveStatus.IN_PROGRESS}>Mark In Progress</option>
                                                    <option value={ObjectiveStatus.COMPLETED}>Mark Completed</option>
                                                </select>
                                            )}
                                        </div>
                                    </div>

                                    {expandedObjectives.includes(obj.objectiveId) && (
                                        <ObjectiveProgressList objectiveId={obj.objectiveId} />
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                            <p className="text-gray-400 font-medium">No objectives defined for this plan yet.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Reviews Section */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-gray-900">Progress Reviews</h2>
                    {(isHR || isManager) && (pip.status === PipStatus.ACTIVE || pip.status === PipStatus.EXTENDED) && (
                        <button 
                            onClick={() => setShowReviewModal(true)}
                            className="text-blue-600 flex items-center gap-1 font-bold hover:underline"
                        >
                            + New Review
                        </button>
                    )}
                </div>

                <div className="bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden">
                    {reviews.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                            {reviews.map(rev => (
                                <div key={rev.reviewId} className="p-6 hover:bg-gray-50/50 transition">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{rev.reviewDate}</span>
                                        <span className="text-[10px] text-gray-400">By {getEmployeeName(rev.createdBy)}</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-1">Manager Feedback</h5>
                                            <p className="text-sm text-gray-700">{rev.managerFeedback}</p>
                                        </div>
                                        <div>
                                            <h5 className="text-[10px] font-bold text-gray-400 uppercase mb-1">Next Actions</h5>
                                            <p className="text-sm text-gray-700">{rev.nextAction}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-8 text-center text-gray-400 italic">No reviews recorded yet.</div>
                    )}
                </div>
            </div>

            {/* Simple Modals */}
            {showObjModal && (
                <ObjectiveModal 
                    pipStartDate={pip.startDate}
                    onClose={() => setShowObjModal(false)} 
                    onSave={(data) => createObjective({ ...data, pipId }).unwrap().then(() => setShowObjModal(false))} 
                />
            )}
            {showProgressModal && (
                <ProgressModal 
                    onClose={() => setShowProgressModal(false)} 
                    onSave={(data) => addProgress({ ...data, objectiveId: selectedObjectiveId! }).unwrap().then(() => setShowProgressModal(false))} 
                />
            )}
            {showReviewModal && (
                <ReviewModal 
                    onClose={() => setShowReviewModal(false)} 
                    onSave={(data) => createReview({ ...data, pipId }).unwrap().then(() => setShowReviewModal(false))} 
                />
            )}
            {showFinalizeModal && (
                <FinalizeModal 
                    currentEndDate={pip.endDate}
                    onClose={() => setShowFinalizeModal(false)} 
                    onSave={handleFinalize} 
                />
            )}
        </div>
    );
};

export default PipDetailsPage;
