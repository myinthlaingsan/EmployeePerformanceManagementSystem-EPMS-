import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  useGetAllFeedbacksQuery,
  useGetFeedbackTagsQuery,
  useCreateFeedbackMutation,
} from "../features/continuous/continuousApi";
import { useGetEmployeesQuery } from "../features/employee/employeeapi";
import { FeedbackType } from "../features/continuous/continuousTypes";
import { format } from "date-fns";

const FeedbackPage = () => {
  const { user, isManager, isAdmin, isHR } = useAuth();
  const canCreate = isManager || isAdmin || isHR;

  const { data: feedbacks, isLoading } = useGetAllFeedbacksQuery(undefined, { skip: !user });
  const { data: tags } = useGetFeedbackTagsQuery();
  const { data: employees } = useGetEmployeesQuery();
  const [createFeedback, { isLoading: isCreating }] = useCreateFeedbackMutation();

  const filteredEmployees = (isAdmin || isHR)
    ? employees
    : employees?.filter(emp => 
        emp.currentDepartmentId === user?.currentDepartmentId && 
        emp.id !== user?.id
      );

  const [showModal, setShowModal] = useState(false);
  const [newFeedback, setNewFeedback] = useState<{
    employeeId: number;
    tagId: number | "";
    feedbackType: FeedbackType;
    description: string;
    isPrivate: boolean;
  }>({
    employeeId: 0,
    tagId: "",
    feedbackType: FeedbackType.PRAISE,
    description: "",
    isPrivate: false
  });

  const selectedEmp = employees?.find(e => e.id === newFeedback.employeeId);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newFeedback.employeeId || !newFeedback.tagId) return;

    try {
      await createFeedback({
        employeeId: newFeedback.employeeId,
        tagId: newFeedback.tagId as number,
        feedbackType: newFeedback.feedbackType,
        description: newFeedback.description,
        isPrivate: newFeedback.isPrivate,
        managerId: user.id,
      }).unwrap();

      setShowModal(false);
      setNewFeedback({ employeeId: 0, tagId: "", feedbackType: FeedbackType.PRAISE, description: "", isPrivate: false });
    } catch (err) {
      console.error("Failed to create feedback", err);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading Feedbacks...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Continuous Feedback</h1>
          <p className="text-gray-500">Real-time performance insights and recognitions.</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Give Feedback
          </button>
        )}
      </header>

      <div className="grid gap-6">
        {feedbacks?.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">No feedback entries yet.</p>
          </div>
        )}

        {feedbacks?.map((fb) => (
          <div key={fb.feedbackId} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold ${fb.feedbackType === FeedbackType.PRAISE ? 'bg-emerald-100 text-emerald-600' :
                  fb.feedbackType === FeedbackType.IMPROVEMENT ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                  }`}>
                  {fb.managerName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {fb.managerName}
                    {fb.employeeId !== user?.id && <span className="text-gray-400 font-normal ml-1 text-sm">to {fb.employeeName}</span>}
                    {fb.employeeId === user?.id && fb.managerId === user?.id && <span className="text-gray-400 font-normal ml-1 text-sm">(Self)</span>}
                  </h3>
                  <p className="text-xs text-gray-400">{format(new Date(fb.createdAt), 'PPP p')}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${fb.feedbackType === FeedbackType.PRAISE ? 'bg-emerald-50 text-emerald-600' :
                fb.feedbackType === FeedbackType.IMPROVEMENT ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                }`}>
                {fb.feedbackType}
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold">#{fb.tag.tagName}</span>
                {fb.isPrivate && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    Private
                  </span>
                )}
              </div>
              <p className="text-gray-700 leading-relaxed">{fb.description}</p>
            </div>

            {/* Replies Section could be added here */}
          </div>
        ))}
      </div>

      {/* Create Feedback Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Give Performance Feedback</h2>
              <form onSubmit={handleCreate} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Select Employee</label>
                    <select
                      required
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                      value={newFeedback.employeeId}
                      onChange={e => setNewFeedback({ ...newFeedback, employeeId: Number(e.target.value) })}
                    >
                      <option value="">Choose Staff</option>
                      {filteredEmployees?.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.staffName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Feedback Category</label>
                    <select
                      required
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                      value={newFeedback.tagId}
                      onChange={e => setNewFeedback({ ...newFeedback, tagId: e.target.value === "" ? "" : Number(e.target.value) })}
                    >
                      <option value="">Select a Tag</option>
                      {tags?.map(tag => <option key={tag.tagId} value={tag.tagId}>{tag.tagName}</option>)}
                    </select>
                  </div>
                </div>

                {selectedEmp && (
                  <div className="flex gap-4 p-4 bg-blue-50 rounded-2xl animate-in fade-in slide-in-from-top-2">
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Department</p>
                      <p className="text-sm font-bold text-blue-900">{selectedEmp.currentDepartmentName || 'N/A'}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Position</p>
                      <p className="text-sm font-bold text-blue-900">{selectedEmp.positionName}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Feedback Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {Object.values(FeedbackType).map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewFeedback({ ...newFeedback, feedbackType: type })}
                        className={`px-3 py-2 rounded-xl text-[10px] font-bold border-2 transition ${newFeedback.feedbackType === type
                          ? type === FeedbackType.PRAISE ? 'border-emerald-500 bg-emerald-50 text-emerald-600' :
                            type === FeedbackType.IMPROVEMENT ? 'border-amber-500 bg-amber-50 text-amber-600' :
                            'border-rose-500 bg-rose-50 text-rose-600'
                          : 'border-transparent bg-gray-50 text-gray-400 hover:bg-gray-100'
                          }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Description</label>
                  <textarea
                    required
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition h-32 resize-none"
                    placeholder="Provide specific details about the performance..."
                    value={newFeedback.description}
                    onChange={e => setNewFeedback({ ...newFeedback, description: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-2 px-1">
                  <input
                    type="checkbox"
                    id="isPrivate"
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    checked={newFeedback.isPrivate}
                    onChange={e => setNewFeedback({ ...newFeedback, isPrivate: e.target.checked })}
                  />
                  <label htmlFor="isPrivate" className="text-sm font-medium text-gray-600">Mark as Private (Visible only to Employee and Manager)</label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition shadow-xl shadow-gray-200 disabled:opacity-50"
                  >
                    {isCreating ? "Saving..." : "Submit Feedback"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;
