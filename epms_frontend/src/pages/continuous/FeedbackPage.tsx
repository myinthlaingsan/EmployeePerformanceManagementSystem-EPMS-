import React, { useState, useEffect, useRef } from "react";

import { useAuth } from "../../hooks/useAuth";
import {
  useGetAllFeedbacksQuery,
  useGetFeedbackTagsQuery,
  useCreateFeedbackMutation,
  useUpdateFeedbackMutation,
  useDeleteFeedbackMutation,
  useCreateFeedbackTagMutation,
  useUpdateFeedbackTagMutation,
  useDeleteFeedbackTagMutation,
  useGetFeedbackRepliesQuery,
  useReplyToFeedbackMutation,
  useDeleteReplyMutation,
  useUpdateReplyMutation,
} from "../../features/continuous/continuousApi";
import { useGetEmployeesQuery } from "../../features/employee/employeeapi";
import { FeedbackType } from "../../features/continuous/continuousTypes";
import { format } from "date-fns";
import { formatRelativeTime } from "../../utils/timeUtils";

const FeedbackSnapshot = ({ stats }: { stats: { praise: number; improvement: number; correction: number } }) => {
  const { isManager, isAdmin, isHR } = useAuth();
  const showTips = isManager || isAdmin || isHR;

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 space-y-6">
      <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Feedback Snapshot</h3>
      <div className="space-y-4">
        {/* Praise */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-bold text-gray-600">Praise</span>
            <span className="font-black text-emerald-500">{stats.praise}%</span>
          </div>
          <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
              style={{ width: `${stats.praise}%` }}
            />
          </div>
        </div>

        {/* Improvement */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-bold text-gray-600">Improvement</span>
            <span className="font-black text-amber-500">{stats.improvement}%</span>
          </div>
          <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 rounded-full transition-all duration-500" 
              style={{ width: `${stats.improvement}%` }}
            />
          </div>
        </div>

        {/* Correction */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-bold text-gray-600">Correction</span>
            <span className="font-black text-rose-500">{stats.correction}%</span>
          </div>
          <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
            <div 
              className="h-full bg-rose-500 rounded-full transition-all duration-500" 
              style={{ width: `${stats.correction}%` }}
            />
          </div>
        </div>
      </div>

      {showTips && (
        <div className="pt-6 mt-4 bg-[#0052cc] rounded-[1.5rem] p-6 text-white space-y-6 shadow-xl shadow-blue-100">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="text-lg font-bold">Manager Tips</h3>
          </div>
          
          <p className="text-sm leading-relaxed text-blue-50">
            Giving constructive feedback works best when it's specific, actionable, and delivered within 24 hours of the observed behavior.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-white/10 p-4 rounded-xl border border-white/5">
              <svg className="w-4 h-4 mt-0.5 text-blue-200 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-xs font-medium leading-tight">Use the "Situation-Behavior-Impact" model.</p>
            </div>
            
            <div className="flex items-start gap-3 bg-white/10 p-4 rounded-xl border border-white/5">
              <svg className="w-4 h-4 mt-0.5 text-blue-200 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
              <p className="text-xs font-medium leading-tight">Balance praise with growth opportunities.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const feedbackTypeConfig = {
  [FeedbackType.PRAISE]: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
      </svg>
    ),
    label: "Praise",
    activeClass: "bg-white text-emerald-600 shadow-sm ring-1 ring-black/5",
    inactiveClass: "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50",
  },
  [FeedbackType.IMPROVEMENT]: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    label: "Improvement",
    activeClass: "bg-white text-amber-600 shadow-sm ring-1 ring-black/5",
    inactiveClass: "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50",
  },
  [FeedbackType.WARNING]: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    label: "Correction",
    activeClass: "bg-white text-rose-600 shadow-sm ring-1 ring-black/5",
    inactiveClass: "text-gray-400 hover:text-gray-600 hover:bg-gray-100/50",
  },
};

const ReplyItem = ({ 
  reply, 
  allReplies, 
  user, 
  authorId, 
  highlightedReplyId,
  editingReplyId,
  editReplyText,
  setEditReplyText,
  setEditingReplyId,
  handleUpdateReply,
  handleScrollToParent,
  onContextMenu,
  isUpdatingReply
}: { 
  reply: any; 
  allReplies: any[];
  user: any;
  authorId: number;
  highlightedReplyId: number | null;
  editingReplyId: number | null;
  editReplyText: string;
  setEditReplyText: (val: string) => void;
  setEditingReplyId: (val: number | null) => void;
  handleUpdateReply: (id: number) => void;
  handleScrollToParent: (parentId: number) => void;
  onContextMenu: (e: React.MouseEvent, reply: any) => void;
  isUpdatingReply: boolean;
}) => {
  const isCurrentUser = reply.employeeId === user?.id;
  const isAuthor = reply.employeeId === authorId;

  return (
    <div 
      id={`reply-${reply.replyId}`} 
      className={`space-y-3`}
      onContextMenu={(e) => onContextMenu(e, reply)}
    >
      <div className={`flex gap-3 px-3 py-2 rounded-2xl transition-all duration-500 group relative ${
        highlightedReplyId === reply.replyId 
          ? 'bg-blue-100 ring-4 ring-blue-300 scale-[1.02] shadow-lg'
          : isCurrentUser ? 'flex-row-reverse bg-blue-50/30 border-l-4 border-blue-500' : 'bg-gray-50/30'
      }`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-sm transition-colors duration-500 ${
          highlightedReplyId === reply.replyId
            ? 'bg-blue-600 text-white'
            : isCurrentUser ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-100'
        }`}>
          {reply.employeeName?.charAt(0) || '?'}
        </div>
        
        <div className={`max-w-[85%] ${isCurrentUser ? 'items-end text-right' : 'items-start'} flex flex-col gap-1`}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-900 uppercase tracking-tight">
              {isCurrentUser ? 'You' : reply.employeeName}
            </span>
            {isAuthor && <span className="px-1.5 py-0.5 bg-gray-900 text-white text-[8px] font-black rounded uppercase tracking-widest leading-none">Author</span>}
            <span className="text-[10px] text-gray-400 font-medium">{reply.createdAt ? format(new Date(reply.createdAt), 'h:mm a') : ''}</span>
          </div>


          <div className={`px-3 py-2 rounded-2xl text-sm transition-all shadow-sm relative min-w-[120px] ${
            isCurrentUser 
              ? 'bg-[#e7f9f2] text-gray-800 rounded-tr-none border border-[#d1f0e4]' 
              : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
          }`}>
            <button 
              onClick={(e) => onContextMenu(e as any, reply)}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>

            {reply.parentId && (
              (() => {
                const parent = allReplies?.find(r => String(r.replyId) === String(reply.parentId));
                if (!parent) return null;
                return (
                  <div 
                    onClick={() => handleScrollToParent(parent.replyId)}
                    className={`mb-2 p-2 rounded-lg border-l-4 flex flex-col gap-1 shadow-sm cursor-pointer hover:opacity-80 transition-opacity ${
                      isCurrentUser ? 'bg-[#d1f0e4] border-[#4bb08b]' : 'bg-gray-100 border-gray-400'
                    }`}
                  >
                    <div className={`text-[10px] font-black uppercase tracking-tight ${isCurrentUser ? 'text-[#3e8e71]' : 'text-gray-600'}`}>
                      {parent.employeeName}
                    </div>
                    <div className={`text-[11px] leading-tight ${isCurrentUser ? 'text-gray-700' : 'text-gray-500'} italic line-clamp-2`}>
                      "{parent.replyText}"
                    </div>
                  </div>
                );
              })()
            )}

            <div className="flex flex-col gap-1">
              {editingReplyId === reply.replyId ? (
                <div className="space-y-2 mt-1">
                  <input
                    className="bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-sm w-full outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    value={editReplyText}
                    onChange={(e) => setEditReplyText(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingReplyId(null)} className="text-[10px] font-black text-gray-400">Cancel</button>
                    <button 
                      disabled={isUpdatingReply}
                      onClick={() => handleUpdateReply(reply.replyId)} 
                      className="text-[10px] font-black text-blue-600 disabled:opacity-50"
                    >
                      {isUpdatingReply ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="leading-relaxed">{reply.replyText}</span>
                  <div className="flex justify-end items-center gap-1 mt-1">
                    <span className={`text-[8px] font-semibold tracking-tighter uppercase ${isCurrentUser ? 'text-[#4bb08b]/60' : 'text-gray-400/80'}`}>
                      {formatRelativeTime(reply.createdAt)}
                    </span>
                    {isCurrentUser && (
                      <svg className="w-2.5 h-2.5 text-[#4bb08b]/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

const FeedbackPage = () => {
  const { user, isManager, isAdmin, isHR } = useAuth();
  const canCreate = isManager; // Admins and HR are restricted to history only

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState("");

  const { data: feedbackResponse, isLoading } = useGetAllFeedbacksQuery(
    { page: currentPage - 1, size: itemsPerPage },
    { skip: !user }
  );
  const feedbacks = feedbackResponse?.content || [];
  const { data: tags } = useGetFeedbackTagsQuery();
  const { data: employeeData } = useGetEmployeesQuery({ page: 0, size: 1000, excludeSelf: true });
  const employees = employeeData?.content || [];
  const [createFeedback, { isLoading: isCreating }] = useCreateFeedbackMutation();
  const [updateFeedback, { isLoading: isUpdating }] = useUpdateFeedbackMutation();
  const [deleteFeedback] = useDeleteFeedbackMutation();
  const [createFeedbackTag, { isLoading: isCreatingTag }] = useCreateFeedbackTagMutation();
  const [updateFeedbackTag, { isLoading: isUpdatingTag }] = useUpdateFeedbackTagMutation();
  const [deleteFeedbackTag] = useDeleteFeedbackTagMutation();

  const [isAddingTag, setIsAddingTag] = useState(false);
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [tagToDelete, setTagToDelete] = useState<number | null>(null);
  const [feedbackToDelete, setFeedbackToDelete] = useState<number | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [expandedFeedbackId, setExpandedFeedbackId] = useState<number | null>(null);

  const filteredEmployees = (isAdmin || isHR)
    ? employees
    : employees?.filter(emp => 
        emp.currentDepartmentName && user?.currentDepartmentName &&
        emp.currentDepartmentName === user?.currentDepartmentName && 
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

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      if (editingTagId) {
        await updateFeedbackTag({ id: editingTagId, body: { tagName: newTagName } }).unwrap();
      } else {
        const response = await createFeedbackTag({ tagName: newTagName }).unwrap();
        setNewFeedback({ ...newFeedback, tagId: response.tagId });
      }
      setIsAddingTag(false);
      setEditingTagId(null);
      setNewTagName("");
    } catch (err: any) {
      alert(err.data?.message || "Failed to save tag");
    }
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;
    try {
      await deleteFeedbackTag(tagToDelete).unwrap();
      if (newFeedback.tagId === tagToDelete) {
        setNewFeedback({ ...newFeedback, tagId: "" });
      }
      setTagToDelete(null);
    } catch (err: any) {
      alert(err.data?.message || "Failed to delete tag");
    }
  };

  const handleDelete = async () => {
    if (!feedbackToDelete) return;
    try {
      await deleteFeedback(feedbackToDelete).unwrap();
      setFeedbackToDelete(null);
    } catch (err: any) {
      alert(err.data?.message || "Failed to delete feedback");
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

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setGoToPage("");
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleGoToPage = (e: React.FormEvent) => {
    e.preventDefault();
    const pageNum = parseInt(goToPage);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
      handlePageChange(pageNum);
    } else {
      setGoToPage("");
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
    </div>
  );

  const totalItems = feedbackResponse?.totalElements || 0;
  const totalPages = feedbackResponse?.totalPages || 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + feedbacks.length;

  const stats = feedbacks ? {
    praise: Math.round((feedbacks.filter(f => f.feedbackType === FeedbackType.PRAISE).length / (feedbacks.length || 1)) * 100),
    improvement: Math.round((feedbacks.filter(f => f.feedbackType === FeedbackType.IMPROVEMENT).length / (feedbacks.length || 1)) * 100),
    correction: Math.round((feedbacks.filter(f => f.feedbackType === FeedbackType.WARNING).length / (feedbacks.length || 1)) * 100),
  } : { praise: 0, improvement: 0, correction: 0 };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <header className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Continuous Feedback</h1>
          <p className="text-gray-500 font-medium">Real-time performance insights and team recognition.</p>
        </div>
        {canCreate && (
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex items-center gap-2 group"
          >
            <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center group-hover:bg-blue-400 transition">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            Give Feedback
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1 pb-24 relative min-h-[600px]">
          {(isAdmin || isHR) && (
            <div className="text-center py-20 bg-amber-50 rounded-3xl border-2 border-dashed border-amber-200">
              <h3 className="text-amber-800 font-bold text-xl mb-2">Access Restricted</h3>
              <p className="text-amber-600 font-medium">Admins are restricted to viewing performance history only. Feedback details are hidden.</p>
              <a href="/performance-history" className="mt-4 inline-block px-6 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition">Go to Performance History</a>
            </div>
          )}

          {!(isAdmin || isHR) && feedbacks?.length === 0 && (
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
                          onClick={() => setFeedbackToDelete(fb.feedbackId)}
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
                <FeedbackReplies feedbackId={fb.feedbackId} authorId={fb.managerId} />
              )}
            </div>
          ))}

          {/* Fixed Pagination Bar */}
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-2xl px-4 z-40">
            <div className="bg-white/80 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-2xl p-4 px-8 flex items-center justify-between gap-4">
              <div className="flex items-center gap-6">
                <span className="hidden sm:inline text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
                </span>
                
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-30 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                  </button>
                  
                  <div className="flex items-center gap-1 px-2">
                    {[...Array(totalPages)].map((_, i) => {
                      const pageNum = i + 1;
                      if (totalPages > 5) {
                        if (pageNum === 1 || pageNum === totalPages || (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)) {
                          return (
                            <button 
                              key={pageNum}
                              onClick={() => handlePageChange(pageNum)}
                              className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-400 hover:bg-gray-50'}`}
                            >
                              {pageNum}
                            </button>
                          );
                        } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                          return <span key={pageNum} className="text-gray-300 text-[10px] font-black">...</span>;
                        }
                        return null;
                      }
                      return (
                        <button 
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === pageNum ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' : 'text-gray-400 hover:bg-gray-50'}`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button 
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 text-gray-400 hover:text-blue-600 disabled:opacity-30 transition"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleGoToPage} className="flex items-center gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Go to</label>
                <input 
                  type="text"
                  value={goToPage}
                  onChange={(e) => setGoToPage(e.target.value)}
                  placeholder="Page..."
                  className="w-16 px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black outline-none focus:ring-2 focus:ring-blue-500 transition"
                />
                <button type="submit" className="hidden" />
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="lg:col-span-1 space-y-6 order-1 lg:order-2 lg:sticky lg:top-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Feedback</p>
              <h3 className="text-2xl font-bold text-gray-900">{totalItems}</h3>
            </div>
          </div>
          <FeedbackSnapshot stats={stats} />
        </div>
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
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tag</label>
                    {!isAddingTag && (
                      <button
                        type="button"
                        onClick={() => setIsAddingTag(true)}
                        className="text-blue-600 text-[9px] font-black uppercase tracking-widest hover:text-blue-800 transition"
                      >
                        + New Tag
                      </button>
                    )}
                  </div>
                  
                  {isAddingTag ? (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                      <input
                        type="text"
                        autoFocus
                        placeholder="New tag name..."
                        className="flex-1 px-4 py-3 bg-gray-50 border border-blue-100 rounded-xl text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500 transition"
                        value={newTagName}
                        onChange={e => setNewTagName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleCreateTag();
                          }
                          if (e.key === 'Escape') {
                            setIsAddingTag(false);
                            setNewTagName("");
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleCreateTag}
                        disabled={isCreatingTag || isUpdatingTag || !newTagName.trim()}
                        className="p-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingTag(false);
                          setNewTagName("");
                        }}
                        className="p-3.5 bg-gray-100 text-gray-400 rounded-xl hover:bg-gray-200 transition"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <select
                      required
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition font-bold text-gray-700"
                      value={newFeedback.tagId}
                      onChange={e => setNewFeedback({ ...newFeedback, tagId: Number(e.target.value) })}
                    >
                      <option value="">Choose Tag...</option>
                      {tags?.map(tag => (
                        <option key={tag.tagId} value={tag.tagId}>{tag.tagName}</option>
                      ))}
                    </select>
                  )}
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
                  <div className="flex p-1 bg-gray-50 rounded-2xl border border-gray-100">
                    {Object.values(FeedbackType).map(type => {
                      const config = feedbackTypeConfig[type];
                      const isActive = newFeedback.feedbackType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setNewFeedback({ ...newFeedback, feedbackType: type })}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-200 ${
                            isActive ? config.activeClass : config.inactiveClass
                          }`}
                        >
                          {config.icon}
                          {config.label}
                        </button>
                      );
                    })}
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

      {/* Delete Tag Confirmation Modal */}
      {tagToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 p-8 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Tag?</h3>
            <p className="text-gray-500 text-sm mb-8">
              Are you sure you want to delete <span className="font-bold text-gray-900">"{tags?.find(t => t.tagId === tagToDelete)?.tagName}"</span>? This may affect historical data.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setTagToDelete(null)}
                className="flex-1 px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTag}
                className="flex-1 px-6 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition shadow-lg shadow-rose-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Feedback Confirmation Modal */}
      {feedbackToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 p-8 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Feedback?</h3>
            <p className="text-gray-500 text-sm mb-8">
              This action cannot be undone. All replies associated with this feedback will also be removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setFeedbackToDelete(null)}
                className="flex-1 px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-6 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition shadow-lg shadow-rose-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FeedbackReplies = ({ feedbackId, authorId }: { feedbackId: number; authorId: number }) => {
  const { user } = useAuth();
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, reply: any } | null>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, reply: any) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, reply });
  };

  const { data: replies, isLoading } = useGetFeedbackRepliesQuery(feedbackId);
  const [replyToFeedback, { isLoading: isReplying }] = useReplyToFeedbackMutation();
  const [deleteReply] = useDeleteReplyMutation();
  const [updateReply, { isLoading: isUpdatingReply }] = useUpdateReplyMutation();
  
  const [newReply, setNewReply] = useState("");
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyTarget, setReplyTarget] = useState<{ id: number; name: string; text: string } | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<number | null>(null);
  const [editReplyText, setEditReplyText] = useState("");
  const [replyToDelete, setReplyToDelete] = useState<number | null>(null);
  const [highlightedReplyId, setHighlightedReplyId] = useState<number | null>(null);
  const mainInputRef = useRef<HTMLInputElement>(null);


  const handleScrollToParent = (parentId: number) => {
    const element = document.getElementById(`reply-${parentId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedReplyId(parentId);
      setTimeout(() => setHighlightedReplyId(null), 2000);
    }
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReply.trim() || !user) return;
    try {
      await replyToFeedback({
        feedbackId,
        body: { replyText: newReply, employeeId: user.id, parentId: replyingToId ?? undefined }
      }).unwrap();
      setNewReply("");
      setReplyingToId(null);
      setReplyTarget(null);
    } catch (err: any) {
      alert(err.data?.message || "Failed to post reply.");
    }
  };

  const startReply = (reply: any) => {
    setReplyingToId(reply.replyId);
    setReplyTarget({ id: reply.replyId, name: reply.employeeName, text: reply.replyText });
    setTimeout(() => mainInputRef.current?.focus(), 50);
  };

  const cancelReply = () => {
    setReplyingToId(null);
    setReplyTarget(null);
  };

  const handleDeleteReply = async () => {
    if (!replyToDelete) return;
    try {
      await deleteReply({ replyId: replyToDelete, feedbackId }).unwrap();
      setReplyToDelete(null);
    } catch (err) {
      console.error("Failed to delete reply", err);
    }
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

  if (isLoading) return <div className="mt-4 text-[10px] text-gray-400 uppercase font-black animate-pulse">Loading discussion...</div>;

  const sortedReplies = [...(replies || [])].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="mt-6 pt-6 border-t border-gray-100 space-y-6">
      <div className="space-y-6">
        {sortedReplies.map((reply, index) => {
          const currentDate = reply.createdAt ? format(new Date(reply.createdAt), 'yyyy-MM-dd') : '';
          const prevDate = index > 0 && sortedReplies[index-1].createdAt ? format(new Date(sortedReplies[index-1].createdAt), 'yyyy-MM-dd') : '';
          const isNewDay = currentDate !== prevDate;

          return (
            <React.Fragment key={reply.replyId}>
              {isNewDay && (
                <div className="flex justify-center my-8 sticky top-2 z-10">
                  <span className="px-4 py-1.5 bg-gray-500/20 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-gray-500 rounded-full border border-white/20 shadow-sm transition-all duration-300">
                    {format(new Date(reply.createdAt), 'MMMM dd, yyyy')}
                  </span>
                </div>
              )}
              <ReplyItem 
                reply={reply} 
                allReplies={sortedReplies}
                user={user}
                authorId={authorId}
                highlightedReplyId={highlightedReplyId}
                editingReplyId={editingReplyId}
                editReplyText={editReplyText}
                setEditReplyText={setEditReplyText}
                setEditingReplyId={setEditingReplyId}
                handleUpdateReply={handleUpdateReply}
                handleScrollToParent={handleScrollToParent}
                onContextMenu={handleContextMenu}
                isUpdatingReply={isUpdatingReply}
              />
            </React.Fragment>
          );
        })}
      </div>

      {contextMenu && (
        <div 
          className="fixed z-[1000] w-48 bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => { startReply(contextMenu.reply); setContextMenu(null); }}
            className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-indigo-50 flex items-center gap-3 transition"
          >
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            Reply
          </button>
          
          <button 
            onClick={() => { navigator.clipboard.writeText(contextMenu.reply.replyText); setContextMenu(null); }}
            className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            Copy Text
          </button>

          {contextMenu.reply.employeeId === user?.id && (
            <>
              <div className="h-px bg-gray-100 my-1" />
              <button 
                onClick={() => { setEditingReplyId(contextMenu.reply.replyId); setEditReplyText(contextMenu.reply.replyText); setContextMenu(null); }}
                className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-blue-50 flex items-center gap-3 transition"
              >
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Edit
              </button>
              <button 
                onClick={() => { setReplyToDelete(contextMenu.reply.replyId); setContextMenu(null); }}
                className="w-full px-4 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete
              </button>
            </>
          )}
        </div>
      )}

      <div className="border-t border-gray-50 pt-4">
        {replyTarget && (
          <div className="flex items-center gap-2 mb-2 bg-indigo-50/70 rounded-xl px-3 py-2 border-l-4 border-indigo-500 animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-0.5">{replyTarget.name}</p>
              <p className="text-xs text-gray-500 truncate italic">{replyTarget.text}</p>
            </div>
            <button
              onClick={cancelReply}
              className="shrink-0 w-5 h-5 flex items-center justify-center rounded-full bg-gray-200 hover:bg-rose-100 hover:text-rose-500 text-gray-400 transition"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <form onSubmit={handleReply} className="flex gap-3">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 bg-indigo-50 text-indigo-600 border border-indigo-100`}>
            {user?.staffName?.charAt(0) || '?'}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              ref={mainInputRef}
              placeholder={replyTarget ? `Replying to ${replyTarget.name}...` : "Add to the conversation..."}
              className="flex-1 px-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
            />
            <button
              type="submit"
              disabled={isReplying || !newReply.trim()}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition shadow-lg shadow-indigo-100"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </form>
      </div>

      {replyToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 p-8 text-center border border-gray-100">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Delete Message?</h3>
            <p className="text-gray-500 text-sm mb-8 font-medium">This will permanently remove your contribution from this thread.</p>
            <div className="flex gap-3">
              <button onClick={() => setReplyToDelete(null)} className="flex-1 px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition uppercase text-[10px] tracking-widest">Cancel</button>
              <button onClick={handleDeleteReply} className="flex-1 px-6 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition shadow-lg shadow-rose-200 uppercase text-[10px] tracking-widest">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;
