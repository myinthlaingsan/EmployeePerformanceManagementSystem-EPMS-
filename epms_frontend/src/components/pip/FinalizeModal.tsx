import React, { useState } from 'react';
import { PipOutcome } from '../../features/pip/types';

interface FinalizeModalProps {
    onClose: () => void;
    onSave: (data: { outcome: PipOutcome; comment: string; newEndDate?: string }) => Promise<void>;
}

const FinalizeModal: React.FC<FinalizeModalProps> = ({ onClose, onSave }) => {
    const [data, setData] = useState<{ outcome: PipOutcome; comment: string; newEndDate?: string }>({ 
        outcome: PipOutcome.PASS, 
        comment: '' 
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        if (!data.comment) return;
        if (data.outcome === PipOutcome.EXTEND && !data.newEndDate) return;
        
        setIsSaving(true);
        try {
            await onSave(data);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in fade-in zoom-in duration-200">
                <h3 className="text-2xl font-bold mb-6">Finalize PIP</h3>
                <div className="space-y-4">
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
                        <div className="animate-in slide-in-from-top-2 duration-200">
                            <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">New End Date</label>
                            <input 
                                type="date" 
                                className="w-full px-4 py-2 border rounded-xl border-yellow-200 bg-yellow-50/30 outline-none focus:ring-2 focus:ring-yellow-500 transition" 
                                onChange={e => setData({ ...data, newEndDate: e.target.value })} 
                                min={new Date().toISOString().split('T')[0]}
                            />
                            <p className="text-[10px] text-yellow-600 mt-1 font-medium italic">Selecting EXTEND will allow the employee more time to meet objectives.</p>
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
                    
                    <div className="flex gap-4 pt-4">
                        <button 
                            onClick={onClose} 
                            className="flex-1 px-4 py-2 bg-gray-100 rounded-xl font-bold hover:bg-gray-200 transition"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSubmit} 
                            disabled={isSaving}
                            className={`flex-1 px-4 py-2 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 ${
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
