import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  useGetAllFeedbacksQuery,
  useGetFeedbackTagsQuery,
  useCreateFeedbackMutation,
  useUpdateFeedbackMutation,
  useDeleteFeedbackMutation,
  useGetFeedbackRepliesQuery,
  useReplyToFeedbackMutation,
  useDeleteReplyMutation,
  useUpdateReplyMutation,
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
  const [updateFeedback, { isLoading: isUpdating }] = useUpdateFeedbackMutation();
  const [deleteFeedback] = useDeleteFeedbackMutation();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<number | null>(null);

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
    if (!user || !newFeedback.employeeId || !newFeedback.tagId) {
      alert("Please select an employee and a category.");
      return;
    }

    try {
      const body = {
        employeeId: newFeedback.employeeId,
        tagId: newFeedback.tagId as number,
        feedbackType: newFeedback.feedbackType,
        description: newFeedback.description,
        isPrivate: newFeedback.isPrivate,
        managerId: user.id,
      };

      if (editingId) {
        await updateFeedback({ id: editingId, body }).unwrap();
      } else {
        await createFeedback(body).unwrap();
      }

      setShowModal(false);
      setEditingId(null);
      setNewFeedback({ employeeId: 0, tagId: "", feedbackType: FeedbackType.PRAISE, description: "", isPrivate: false });
    } catch (err: any) {
      alert(err.data?.message || "Failed to save feedback");
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this feedback?")) {
      try {
        await deleteFeedback(id).unwrap();
      } catch (err: any) {
        alert(err.data?.message || "Failed to delete feedback");
      }
    }
  };

  const handleEdit = (fb: any) => {
    setEditingId(fb.feedbackId);
    setNewFeedback({
      employeeId: fb.employeeId,
      tagId: fb.tag?.tagId || 0,
      feedbackType: fb.feedbackType,
      description: fb.description,
      isPrivate: fb.isPrivate,
    });
    setShowModal(true);
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
          <div key={fb.feedbackId} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition group">
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
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${fb.feedbackType === FeedbackType.PRAISE ? 'bg-emerald-50 text-emerald-600' :
                    fb.feedbackType === FeedbackType.IMPROVEMENT ? 'bg-amber-50 text-amber-600' : 'bg-rose-50 text-rose-600'
                    }`}>
                    {fb.feedbackType}
                  </span>
                  {(fb.managerId === user?.id || isAdmin || isHR) && (
                    <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleEdit(fb)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit Feedback"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button 
                        onClick={() => handleDelete(fb.feedbackId)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Delete Feedback"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {fb.tag && <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-md text-[10px] font-bold">#{fb.tag.tagName}</span>}
                {fb.isPrivate && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                    Private
                  </span>
                )}
              </div>
              <p className="text-gray-700 leading-relaxed">{fb.description}</p>
            </div>
            <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
              <button 
                onClick={() => setExpandedFeedbackId(expandedFeedbackId === fb.feedbackId ? null : fb.feedbackId)}
                className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-indigo-600 transition group"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-indigo-50 flex items-center justify-center transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <span>Replies</span>
              </button>
            </div>

            {/* Replies Section */}
            {expandedFeedbackId === fb.feedbackId && (
              <FeedbackReplies feedbackId={fb.feedbackId} />
            )}
          </div>
        ))}
      </div>

      {/* Create Feedback Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">{editingId ? 'Edit Feedback' : 'Give Performance Feedback'}</h2>
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
                    onClick={() => {
                      setShowModal(false);
                      setEditingId(null);
                      setNewFeedback({ employeeId: 0, tagId: "", feedbackType: FeedbackType.PRAISE, description: "", isPrivate: false });
                    }}
                    className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || isUpdating}
                    className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition shadow-xl shadow-gray-200 disabled:opacity-50"
                  >
                    {isCreating || isUpdating ? "Saving..." : editingId ? "Update Feedback" : "Submit Feedback"}
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

const FeedbackReplies = ({ feedbackId }: { feedbackId: number }) => {
  const { user } = useAuth();
  const { data: replies, isLoading } = useGetFeedbackRepliesQuery(feedbackId);
  const [replyToFeedback, { isLoading: isReplying }] = useReplyToFeedbackMutation();
  const [deleteReply] = useDeleteReplyMutation();
  const [updateReply, { isLoading: isUpdatingReply }] = useUpdateReplyMutation();
  const [newReply, setNewReply] = useState("");
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [editReplyText, setEditReplyText] = useState("");

  const handleEditReply = (reply: any) => {
    setEditingReplyId(reply.replyId);
    setEditReplyText(reply.replyText);
  };

  const handleUpdateReply = async (replyId: number) => {
    if (!editReplyText.trim() || !user) return;
    try {
      await updateReply({
        replyId,
        feedbackId,
        body: { replyText: editReplyText, employeeId: user.id }
      }).unwrap();
      setEditingReplyId(null);
      setEditReplyText("");
    } catch (err) {
      console.error("Failed to update reply", err);
    }
  };

  const handleDeleteReply = async (replyId: number) => {
    if (window.confirm("Are you sure you want to delete this reply?")) {
      try {
        await deleteReply({ replyId, feedbackId }).unwrap();
      } catch (err) {
        console.error("Failed to delete reply", err);
      }
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim() || !user) return;

    try {
      await replyToFeedback({
        feedbackId,
        body: {
          replyText: newReply,
          employeeId: user.id
        }
      }).unwrap();
      setNewReply("");
    } catch (err) {
      console.error("Failed to reply", err);
    }
  };

  if (isLoading) return <div className="mt-4 text-[10px] text-gray-400">Loading replies...</div>;

  return (
    <div className="mt-6 pt-6 border-t border-gray-50 space-y-4">
      <div className="space-y-4">
        {replies?.map((reply) => (
          <div key={reply.replyId} className={`flex gap-3 ${reply.employeeId === user?.id ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
              reply.employeeId === user?.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}>
              {reply.employeeName?.charAt(0) || '?'}
            </div>
            <div className={`max-w-[80%] ${reply.employeeId === user?.id ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <div className={`px-4 py-2 rounded-2xl text-sm ${
                reply.employeeId === user?.id 
                  ? 'bg-indigo-600 text-white rounded-tr-none' 
                  : 'bg-gray-50 text-gray-700 rounded-tl-none'
              }`}>
                {editingReplyId === reply.replyId ? (
                  <div className="flex flex-col gap-2">
                    <input
                      type="text"
                      className="text-black px-2 py-1 rounded text-sm w-full outline-none"
                      value={editReplyText}
                      onChange={(e) => setEditReplyText(e.target.value)}
                      autoFocus
                    />
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => setEditingReplyId(null)} className="text-[10px] uppercase font-bold text-indigo-200 hover:text-white">Cancel</button>
                      <button onClick={() => handleUpdateReply(reply.replyId)} disabled={isUpdatingReply} className="text-[10px] uppercase font-bold text-white hover:text-indigo-200">Save</button>
                    </div>
                  </div>
                ) : (
                  reply.replyText
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
                  {reply.employeeName}
                </span>
                <span className="text-[10px] text-gray-300">•</span>
                <span className="text-[10px] text-gray-300">{reply.createdAt ? format(new Date(reply.createdAt), 'MMM d, p') : ''}</span>
                {reply.employeeId === user?.id && (
                  <div className="flex items-center">
                    <button 
                      onClick={() => handleEditReply(reply)}
                      className="ml-1 text-gray-300 hover:text-indigo-400 transition"
                      title="Edit Reply"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button 
                      onClick={() => handleDeleteReply(reply.replyId)}
                      className="ml-1 text-gray-300 hover:text-rose-500 transition"
                      title="Delete Reply"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <form onSubmit={handleReply} className="flex gap-2 pt-2">
        <input
          type="text"
          placeholder="Write a reply..."
          className="flex-1 px-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
          value={newReply}
          onChange={(e) => setNewReply(e.target.value)}
        />
        <button
          type="submit"
          disabled={isReplying || !newReply.trim()}
          className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-lg shadow-indigo-100"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
};

export default FeedbackPage;
