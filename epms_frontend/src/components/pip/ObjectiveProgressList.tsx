import React from 'react';
import { useGetProgressByObjectiveQuery } from '../../services/pipApi';

interface ObjectiveProgressListProps {
    objectiveId: number;
}

const ObjectiveProgressList: React.FC<ObjectiveProgressListProps> = ({ objectiveId }) => {
    const { data: logsResponse, isLoading } = useGetProgressByObjectiveQuery(objectiveId);
    const logs = logsResponse?.data || [];

    if (isLoading) return <div className="py-2 text-center text-[10px] text-gray-400">Loading progress logs...</div>;

    if (logs.length === 0) {
        return (
            <div className="py-4 text-center border-t border-gray-50 mt-2">
                <p className="text-[10px] text-gray-400 italic">No progress logs recorded for this objective.</p>
            </div>
        );
    }

    return (
        <div className="mt-4 pt-4 border-t border-gray-50 space-y-3">
            <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Progress History</h5>
            <div className="space-y-3">
                {logs.map((log) => (
                    <div key={log.logId} className="flex gap-3 group">
                        <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 ring-4 ring-blue-50"></div>
                            <div className="w-[1px] h-full bg-gray-100 group-last:hidden"></div>
                        </div>
                        <div className="flex-1 pb-3">
                            <div className="flex justify-between items-start mb-1">
                                <span className="text-[11px] font-bold text-gray-900">{log.progressPercent}% Completed</span>
                            </div>
                            <p className="text-[11px] text-gray-600 leading-relaxed bg-gray-50/50 p-2 rounded-lg border border-gray-100/50">
                                {log.progressNote}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ObjectiveProgressList;
