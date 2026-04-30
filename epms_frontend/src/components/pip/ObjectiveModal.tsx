import React, { useState } from 'react';
import type { PipObjectiveRequest } from '../../features/pip/types';

interface ObjectiveModalProps {
    onClose: () => void;
    onSave: (data: Omit<PipObjectiveRequest, 'pipId'>) => Promise<void>;
}

const ObjectiveModal: React.FC<ObjectiveModalProps> = ({ onClose, onSave }) => {
    const [data, setData] = useState({ 
        title: '', 
        description: '', 
        successCriteria: '', 
        targetDate: '' 
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = async () => {
        if (!data.title || !data.targetDate) return;
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
                <h3 className="text-2xl font-bold mb-6">Add New Objective</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Title</label>
                        <input 
                            placeholder="e.g., Improve Code Quality" 
                            className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition" 
                            onChange={e => setData({ ...data, title: e.target.value })} 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Description</label>
                        <textarea 
                            placeholder="What needs to be achieved?" 
                            className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition" 
                            onChange={e => setData({ ...data, description: e.target.value })} 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Success Criteria</label>
                        <textarea 
                            placeholder="How will we measure success?" 
                            className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition" 
                            onChange={e => setData({ ...data, successCriteria: e.target.value })} 
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 uppercase mb-1 block">Target Completion Date</label>
                        <input 
                            type="date" 
                            className="w-full px-4 py-2 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition" 
                            onChange={e => setData({ ...data, targetDate: e.target.value })} 
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
                            className={`flex-1 px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2 ${isSaving ? 'opacity-70' : ''}`}
                        >
                            {isSaving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ObjectiveModal;
