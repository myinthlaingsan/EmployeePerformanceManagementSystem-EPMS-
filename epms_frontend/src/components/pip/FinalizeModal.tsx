import React, { useState } from 'react';
import { PipOutcome } from '../../features/pip/types';

interface FinalizeModalProps {
    currentEndDate: string;
    existingReviewDates?: string[];
    onClose: () => void;
    onSave: (data: { outcome: PipOutcome; comment: string; newEndDate?: string; scheduledReviewDates?: string[] }) => Promise<void>;
}

const FinalizeModal: React.FC<FinalizeModalProps> = ({ currentEndDate, existingReviewDates = [], onClose, onSave }) => {
    const [data, setData] = useState<{ outcome: PipOutcome; comment: string; newEndDate?: string; scheduledReviewDates?: string[] }>({ 
        outcome: PipOutcome.PASS, 
        comment: '',
        scheduledReviewDates: [...existingReviewDates]
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        if (!data.comment) {
            alert("Please provide final comments/justification.");
            return;
        }
        if (data.outcome === PipOutcome.EXTEND && !data.newEndDate) {
            alert("Please select a new end date for the extension.");
            return;
        }

        if (data.outcome !== PipOutcome.EXTEND) {
            if (!window.confirm("Warning: Once the PIP is finalized, it cannot be reopened. Are you sure you want to proceed?")) {
                return;
            }
        }
        
        setIsSaving(true);
        try {
            await onSave(data);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200">
                <div className="p-8 pb-0 flex-shrink-0">
                    <h3 className="text-2xl font-bold mb-6">Finalize PIP</h3>
                </div>
                
                <div className="flex-grow overflow-y-auto px-8 py-2 space-y-4 custom-scrollbar">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Final Outcome</label>
                        <select 
                            className="w-full px-4 py-2.5 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition appearance-none bg-white" 
                            value={data.outcome}
                            onChange={e => setData({ ...data, outcome: e.target.value as PipOutcome })}
                        >
                            <option value={PipOutcome.PASS}>PASS - Performance Improved</option>
                            <option value={PipOutcome.EXTEND}>EXTEND - Needs More Time</option>
                            <option value={PipOutcome.FAIL}>FAIL - Unsatisfactory</option>
                        </select>
                    </div>

                    {data.outcome === PipOutcome.EXTEND && (
                        <div className="animate-in slide-in-from-top-2 duration-200 space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">New End Date</label>
                                <input 
                                    type="date" 
                                    className="w-full px-4 py-2 border rounded-xl border-yellow-200 bg-yellow-50/30 outline-none focus:ring-2 focus:ring-yellow-500 transition" 
                                    onChange={e => setData({ ...data, newEndDate: e.target.value })} 
                                    min={currentEndDate}
                                />
                                <p className="text-[10px] text-yellow-600 mt-1 font-medium italic">Selecting EXTEND will allow the employee more time to meet objectives.</p>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Scheduled Review Dates</label>
                                <div className="space-y-2">
                                    {data.scheduledReviewDates?.map((date, idx) => {
                                        const isPast = new Date(date) < new Date();
                                        return (
                                            <div key={idx} className="flex gap-2">
                                                <input 
                                                    type="date" 
                                                    className={`flex-1 px-3 py-1.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 ${isPast ? 'bg-gray-50 text-gray-400' : ''}`}
                                                    value={date}
                                                    disabled={isPast}
                                                    onChange={e => {
                                                        const newDates = [...(data.scheduledReviewDates || [])];
                                                        newDates[idx] = e.target.value;
                                                        setData({ ...data, scheduledReviewDates: newDates });
                                                    }}
                                                />
                                                {!isPast && (
                                                    <button 
                                                        onClick={() => {
                                                            const newDates = (data.scheduledReviewDates || []).filter((_, i) => i !== idx);
                                                            setData({ ...data, scheduledReviewDates: newDates });
                                                        }}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                                                    >
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        );
                                    })}
                                    <button 
                                        type="button"
                                        onClick={() => setData({ ...data, scheduledReviewDates: [...(data.scheduledReviewDates || []), ''] })}
                                        className="text-[10px] font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider flex items-center gap-1"
                                    >
                                        + Add Review Date
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Final Comments / Justification</label>
                        <textarea 
                            placeholder="Explain the reasoning behind this decision..." 
                            className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition" 
                            rows={4}
                            onChange={e => setData({ ...data, comment: e.target.value })} 
                        />
                    </div>
                </div>
                
                <div className="p-8 pt-4 flex-shrink-0 border-t border-gray-50">
                    <div className="flex gap-4">
                        <button 
                            onClick={onClose} 
                            className="flex-1 px-4 py-2.5 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSubmit} 
                            disabled={isSaving}
                            className={`flex-1 px-4 py-2.5 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 ${
                                data.outcome === PipOutcome.FAIL ? 'bg-red-600 hover:bg-red-700 shadow-lg shadow-red-100' : 
                                data.outcome === PipOutcome.EXTEND ? 'bg-yellow-600 hover:bg-yellow-700 shadow-lg shadow-yellow-100' :
                                'bg-green-600 hover:bg-green-700 shadow-lg shadow-green-100'
                            } ${isSaving ? 'opacity-70' : ''}`}
                        >
                            {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Finalize'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FinalizeModal;
