import React, { useState, useEffect, useRef } from "react";

import { useAuth } from "../../hooks/useAuth";
import { 
  useGetAllMeetingsQuery, 
  useScheduleMeetingMutation, 
  useUpdateMeetingMutation, 
  useDeleteMeetingMutation,
  useGetMeetingCommentsQuery,
  useAddMeetingCommentMutation,
  useDeleteCommentMutation,
  useUpdateCommentMutation
} from "../../features/continuous/continuousApi";
import { useGetEmployeesQuery } from "../../features/employee/employeeapi";
import { format } from "date-fns";
import { formatRelativeTime } from "../../utils/timeUtils";

const CommentItem = ({ 
  comment, 
  allComments, 
  user, 
  isManager, 
  highlightedCommentId,
  editingCommentId,
  editCommentText,
  setEditCommentText,
  setEditingCommentId,
  handleUpdateComment,
  handleScrollToParent,
  onContextMenu,
  isUpdatingComment
}: { 
  comment: any; 
  allComments: any[];
  user: any;
  isManager: boolean;
  highlightedCommentId: number | null;
  editingCommentId: number | null;
  editCommentText: string;
  setEditCommentText: (val: string) => void;
  setEditingCommentId: (val: number | null) => void;
  handleUpdateComment: (id: number) => void;
  handleScrollToParent: (parentId: number) => void;
  onContextMenu: (e: React.MouseEvent, comment: any) => void;
  isUpdatingComment: boolean;
}) => {
  const isOwnComment = (isManager && comment.commentType === 'MANAGER' && comment.managerId === user?.id) || 
                       (!isManager && comment.commentType === 'EMPLOYEE' && comment.employeeId === user?.id);

  return (
    <div 
      id={`comment-${comment.id}`} 
      className={`space-y-2`}
      onContextMenu={(e) => onContextMenu(e, comment)}
    >
      <div className={`flex gap-3 group transition-all duration-500 rounded-2xl relative ${
        highlightedCommentId === comment.id 
          ? 'bg-blue-50 ring-4 ring-blue-300 scale-[1.02] shadow-lg p-3 -m-3' 
          : isOwnComment ? 'flex-row-reverse' : ''
      }`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-sm transition-colors duration-500 ${
          highlightedCommentId === comment.id
            ? 'bg-blue-600 text-white'
            : isOwnComment ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-100'
        }`}>
          {(comment.commentType === 'MANAGER' ? comment.managerName : comment.employeeName)?.charAt(0)}
        </div>
        
        <div className={`max-w-[85%] ${isOwnComment ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-gray-900 uppercase tracking-tight">
              {isOwnComment ? 'You' : (comment.commentType === 'MANAGER' ? comment.managerName : comment.employeeName)}
            </span>
            {comment.commentType === 'MANAGER' && <span className="px-1.5 py-0.5 bg-gray-900 text-white text-[8px] font-black rounded uppercase tracking-widest leading-none">Manager</span>}
            <span className="text-[10px] text-gray-400 font-medium">{comment.createdAt ? format(new Date(comment.createdAt), 'h:mm a') : ''}</span>
          </div>

          <div className={`px-3 py-2 rounded-2xl text-sm transition-all shadow-sm relative min-w-[120px] ${
            isOwnComment 
              ? 'bg-[#e7f9f2] text-gray-800 rounded-tr-none border border-[#d1f0e4]' 
              : 'bg-white text-gray-800 rounded-tl-none border border-gray-100'
          }`}>
            <button 
              onClick={(e) => onContextMenu(e as any, comment)}
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>

            {comment.parentId && (
              (() => {
                const parent = allComments?.find(c => String(c.id) === String(comment.parentId));
                if (!parent) return null;
                const parentName = parent.commentType === 'MANAGER' ? parent.managerName : parent.employeeName;
                return (
                  <div 
                    onClick={() => handleScrollToParent(parent.id)}
                    className={`mb-2 p-2 rounded-lg border-l-4 flex flex-col gap-1 shadow-sm cursor-pointer hover:opacity-80 transition-opacity ${
                      isOwnComment ? 'bg-[#d1f0e4] border-[#4bb08b]' : 'bg-gray-100 border-gray-400'
                    }`}
                  >
                    <div className={`text-[10px] font-black uppercase tracking-tight ${isOwnComment ? 'text-[#3e8e71]' : 'text-gray-600'}`}>
                      {parentName}
                    </div>
                    <div className={`text-[11px] leading-tight ${isOwnComment ? 'text-gray-700' : 'text-gray-500'} italic line-clamp-2`}>
                      "{parent.comment}"
                    </div>
                  </div>
                );
              })()
            )}

            <div className="flex flex-col gap-1">
              {editingCommentId === comment.id ? (
                <div className="space-y-2 py-1">
                  <textarea
                    className="bg-white border border-gray-200 p-2 rounded-lg text-sm w-full text-gray-900 outline-none focus:ring-2 focus:ring-indigo-400 h-16 resize-none shadow-inner"
                    value={editCommentText}
                    onChange={(e) => setEditCommentText(e.target.value)}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingCommentId(null)} className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-600">Cancel</button>
                    <button 
                      disabled={isUpdatingComment}
                      onClick={() => handleUpdateComment(comment.id)} 
                      className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                    >
                      {isUpdatingComment ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="leading-relaxed">{comment.comment}</span>
                  <div className="flex justify-end items-center gap-1 mt-1">
                    <span className="text-[8px] font-semibold tracking-tighter uppercase text-gray-400/80">
                      {formatRelativeTime(comment.createdAt)}
                    </span>
                    {isOwnComment && (
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

const MeetingPage = () => {
  const { user, isManager, isAdmin, isHR } = useAuth();
  const canSchedule = isManager;

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState("");

  const { data: meetingResponse, isLoading } = useGetAllMeetingsQuery(
    { page: currentPage - 1, size: itemsPerPage },
    { skip: !user }
  );
  const meetings = meetingResponse?.content || [];
  const { data: employeeData } = useGetEmployeesQuery({ page: 0, size: 1000, excludeSelf: true });
  const employees = employeeData?.content || [];

  const filteredEmployees = (isAdmin || isHR)
    ? employees
    : employees?.filter(emp => 
        emp.currentDepartmentName && user?.currentDepartmentName &&
        emp.currentDepartmentName === user?.currentDepartmentName && 
        emp.id !== user?.id
      );
  const [scheduleMeeting, { isLoading: isScheduling }] = useScheduleMeetingMutation();
  const [updateMeeting, { isLoading: isUpdating }] = useUpdateMeetingMutation();
  const [deleteMeeting] = useDeleteMeetingMutation();

  const [expandedMeetingId, setExpandedMeetingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [meetingToDelete, setMeetingToDelete] = useState<number | null>(null);

  const [newMeeting, setNewMeeting] = useState({
    employeeId: 0,
    meetingDate: "",
    meetingTime: "",
    discussionPoints: "",
    keyIssues: "",
    actionItems: "",
    followUpDate: "",
    isPrivateNote: false
  });


  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeeting.employeeId || !newMeeting.meetingDate || !newMeeting.meetingTime || !newMeeting.discussionPoints || !newMeeting.keyIssues || !newMeeting.actionItems || !user) {
      alert("Please fill out all required fields: Employee, Date, Time, Discussion Points, Key Issues, and Action Items.");
      return;
    }

    if (newMeeting.followUpDate && newMeeting.followUpDate < newMeeting.meetingDate) {
      alert("Follow up date cannot be earlier than the meeting date.");
      return;
    }

    try {
      const body = { ...newMeeting, managerId: user.id };
      if (editingId) {
        await updateMeeting({ id: editingId, body }).unwrap();
      } else {
        await scheduleMeeting(body).unwrap();
      }
      setShowModal(false);
      setEditingId(null);
      setNewMeeting({
        employeeId: 0,
        meetingDate: "",
        meetingTime: "",
        discussionPoints: "",
        keyIssues: "",
        actionItems: "",
        followUpDate: "",
        isPrivateNote: false
      });
    } catch (err: any) {
      alert(err.data?.message || "Failed to save meeting");
    }
  };

  const handleEdit = (m: any) => {
    setEditingId(m.meetingId);
    setNewMeeting({
      employeeId: m.employeeId,
      meetingDate: m.meetingDate,
      meetingTime: m.meetingTime,
      discussionPoints: m.discussionPoints,
      keyIssues: m.keyIssues,
      actionItems: m.actionItems,
      followUpDate: m.followUpDate || "",
      isPrivateNote: m.isPrivateNote
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!meetingToDelete) return;
    try {
      await deleteMeeting(meetingToDelete).unwrap();
      setMeetingToDelete(null);
    } catch (err: any) {
      alert(err.data?.message || "Failed to delete meeting");
    }
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
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );

  const totalItems = meetingResponse?.totalElements || 0;
  const totalPages = meetingResponse?.totalPages || 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + meetings.length;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      <header className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">1-on-1 Meetings</h1>
          <p className="text-gray-500 font-medium">Schedule and track personalized development conversations.</p>
        </div>
        {canSchedule && (
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Schedule Meeting
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Scheduled Meetings</p>
            <h3 className="text-2xl font-bold text-gray-900">{totalItems}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Follow up Tasks</p>
            <h3 className="text-2xl font-bold text-gray-900">{meetings?.filter(m => m.followUpDate).length || 0}</h3>
          </div>
        </div>
      </div>

      <div className="grid gap-6 pb-24 relative min-h-[600px]">
        {meetings?.length === 0 && (
          <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 font-medium">No meetings scheduled yet.</p>
          </div>
        )}
        {meetings?.map((m) => (
          <div key={m.meetingId} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-bold text-lg shadow-inner">
                  {m.employeeName?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{m.employeeName}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-500 font-medium">
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {format(new Date(m.meetingDate), 'MMM d, yyyy')}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {m.meetingTime}
                    </span>
                    {m.followUpDate && (
                      <span className="flex items-center gap-1 text-rose-500 font-bold">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Follow up: {format(new Date(m.followUpDate), 'MMM d, yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {m.isPrivateNote && (
                  <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-full uppercase tracking-widest border border-amber-100">Private</span>
                )}
                {canSchedule && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(m)} className="p-2 text-gray-400 hover:text-indigo-600 transition">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => setMeetingToDelete(m.meetingId)} className="p-2 text-gray-400 hover:text-rose-600 transition">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100/50">
              <div className="space-y-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Discussion Points</span>
                <p className="text-gray-700 text-sm leading-relaxed">{m.discussionPoints}</p>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Key Issues</span>
                <p className="text-gray-700 text-sm leading-relaxed">{m.keyIssues}</p>
              </div>
              <div className="space-y-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Action Items</span>
                <p className="text-gray-700 text-sm leading-relaxed">{m.actionItems}</p>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-50 flex items-center justify-between">
              <button 
                onClick={() => setExpandedMeetingId(expandedMeetingId === m.meetingId ? null : m.meetingId)}
                className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-indigo-600 transition group"
              >
                <div className="w-6 h-6 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-indigo-50 transition">
                  <svg className={`w-3.5 h-3.5 transition-transform ${expandedMeetingId === m.meetingId ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                <span>Meeting Discussion</span>
              </button>
            </div>

            {expandedMeetingId === m.meetingId && (
              <MeetingComments meetingId={m.meetingId} isManager={isManager} />
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
                  className="p-2 text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition"
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
                            className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === pageNum ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:bg-gray-50'}`}
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
                        className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${currentPage === pageNum ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-gray-400 hover:bg-gray-50'}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button 
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="p-2 text-gray-400 hover:text-indigo-600 disabled:opacity-30 transition"
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
                className="w-16 px-2 py-1.5 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-black outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
              <button type="submit" className="hidden" />
            </form>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-gray-100">
            <div className="bg-indigo-600 p-8 text-white">
              <h2 className="text-2xl font-black uppercase tracking-tight">{editingId ? "Update Meeting" : "Schedule 1-on-1"}</h2>
              <p className="text-indigo-100 font-medium">Define goals and expectations for the upcoming conversation.</p>
            </div>
            <div className="p-8">
              <form onSubmit={handleSchedule} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Select Employee</label>
                    <select 
                      required
                      className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm font-bold"
                      value={newMeeting.employeeId || ""}
                      onChange={e => setNewMeeting({ ...newMeeting, employeeId: Number(e.target.value) })}
                    >
                      <option value="">Choose Member...</option>
                      {filteredEmployees?.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.staffName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Date & Time</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input 
                        required
                        type="date"
                        className="px-3 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-xs font-bold"
                        value={newMeeting.meetingDate}
                        onChange={e => setNewMeeting({ ...newMeeting, meetingDate: e.target.value })}
                      />
                      <input 
                        required
                        type="time"
                        className="px-3 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-xs font-bold"
                        value={newMeeting.meetingTime}
                        onChange={e => setNewMeeting({ ...newMeeting, meetingTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Discussion Points</label>
                  <textarea 
                    required
                    className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition h-14 resize-none text-sm"
                    placeholder="What would you like to discuss?"
                    value={newMeeting.discussionPoints}
                    onChange={e => setNewMeeting({...newMeeting, discussionPoints: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Key Issues</label>
                    <textarea 
                      required
                      className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition h-12 resize-none text-sm"
                      value={newMeeting.keyIssues}
                      onChange={e => setNewMeeting({ ...newMeeting, keyIssues: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Action Items</label>
                    <textarea 
                      required
                      className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition h-12 resize-none text-sm"
                      value={newMeeting.actionItems}
                      onChange={e => setNewMeeting({ ...newMeeting, actionItems: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Follow up Date</label>
                  <input 
                    type="date"
                    min={newMeeting.meetingDate}
                    className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-sm font-bold"
                    value={newMeeting.followUpDate}
                    onChange={e => setNewMeeting({ ...newMeeting, followUpDate: e.target.value })}
                  />
                </div>

                <div className="flex items-center gap-2 px-1">
                  <input
                    type="checkbox"
                    id="isPrivateNote"
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    checked={newMeeting.isPrivateNote}
                    onChange={e => setNewMeeting({ ...newMeeting, isPrivateNote: e.target.checked })}
                  />
                  <label htmlFor="isPrivateNote" className="text-sm font-medium text-gray-600">Mark as Private Note (Visible only to Manager)</label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingId(null);
                      setNewMeeting({
                        employeeId: 0,
                        meetingDate: "",
                        meetingTime: "",
                        discussionPoints: "",
                        keyIssues: "",
                        actionItems: "",
                        followUpDate: "",
                        isPrivateNote: false
                      });
                    }}
                    className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isScheduling || isUpdating}
                    className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 disabled:opacity-50"
                  >
                    {isScheduling || isUpdating ? "Saving..." : editingId ? "Update Meeting" : "Schedule Now"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {meetingToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 p-8 text-center">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Meeting?</h3>
            <p className="text-gray-500 text-sm mb-8">
              This action cannot be undone. All discussion points and comments associated with this meeting will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setMeetingToDelete(null)}
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

const MeetingComments = ({ meetingId, isManager }: { meetingId: number; isManager: boolean }) => {
  const { user } = useAuth();
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, comment: any } | null>(null);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, comment: any) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, comment });
  };

  const { data: comments, isLoading } = useGetMeetingCommentsQuery(meetingId);
  const [addComment, { isLoading: isCommenting }] = useAddMeetingCommentMutation();
  const [deleteComment] = useDeleteCommentMutation();
  const [updateComment, { isLoading: isUpdatingComment }] = useUpdateCommentMutation();
  
  const [newComment, setNewComment] = useState("");
  const [replyingToId, setReplyingToId] = useState<number | null>(null);
  const [replyTarget, setReplyTarget] = useState<{ id: number; name: string; text: string } | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [commentToDelete, setCommentToDelete] = useState<number | null>(null);
  const [highlightedCommentId, setHighlightedCommentId] = useState<number | null>(null);
  const mainInputRef = useRef<HTMLInputElement>(null);

  const handleScrollToParent = (parentId: number) => {
    const element = document.getElementById(`comment-${parentId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedCommentId(parentId);
      setTimeout(() => setHighlightedCommentId(null), 2000);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;
    try {
      await addComment({
        meetingId,
        body: {
          comment: newComment,
          commentType: isManager ? 'MANAGER' : 'EMPLOYEE',
          managerId: isManager ? user.id : undefined,
          employeeId: !isManager ? user.id : undefined,
          parentId: replyingToId ?? undefined
        }
      }).unwrap();
      setNewComment("");
      setReplyingToId(null);
      setReplyTarget(null);
    } catch (err) {
      console.error("Failed to add comment", err);
    }
  };

  const startReply = (comment: any) => {
    const name = comment.commentType === 'MANAGER' ? comment.managerName : comment.employeeName;
    setReplyingToId(comment.id);
    setReplyTarget({ id: comment.id, name, text: comment.comment });
    setTimeout(() => mainInputRef.current?.focus(), 50);
  };

  const cancelReply = () => {
    setReplyingToId(null);
    setReplyTarget(null);
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!editCommentText.trim() || !user) return;
    try {
      await updateComment({
        commentId,
        meetingId,
        body: { 
          comment: editCommentText,
          commentType: isManager ? 'MANAGER' : 'EMPLOYEE',
          managerId: isManager ? user.id : undefined,
          employeeId: !isManager ? user.id : undefined,
        }
      }).unwrap();
      setEditingCommentId(null);
      setEditCommentText("");
    } catch (err) {
      console.error("Failed to update comment", err);
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      await deleteComment({ commentId: commentToDelete, meetingId }).unwrap();
      setCommentToDelete(null);
    } catch (err) {
      console.error("Failed to delete comment", err);
    }
  };

  if (isLoading) return <div className="mt-8 text-[10px] font-black text-gray-400 uppercase tracking-widest animate-pulse">Fetching discussions...</div>;

  const sortedComments = [...(comments || [])].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div className="mt-8 pt-8 border-t border-gray-100 space-y-6">
      <div className="space-y-6">
        {sortedComments.length > 0 ? (
          sortedComments.map((comment, index) => {
            const currentDate = comment.createdAt ? format(new Date(comment.createdAt), 'yyyy-MM-dd') : '';
            const prevDate = index > 0 && sortedComments[index-1].createdAt ? format(new Date(sortedComments[index-1].createdAt), 'yyyy-MM-dd') : '';
            const isNewDay = currentDate !== prevDate;

            return (
              <React.Fragment key={comment.id}>
                {isNewDay && (
                  <div className="flex justify-center my-8 sticky top-2 z-10">
                    <span className="px-4 py-1.5 bg-gray-500/20 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-gray-500 rounded-full border border-white/20 shadow-sm transition-all duration-300">
                      {format(new Date(comment.createdAt), 'MMMM dd, yyyy')}
                    </span>
                  </div>
                )}
                <CommentItem 
                  comment={comment} 
                  allComments={sortedComments}
                  user={user}
                  isManager={isManager}
                  highlightedCommentId={highlightedCommentId}
                  editingCommentId={editingCommentId}
                  editCommentText={editCommentText}
                  setEditCommentText={setEditCommentText}
                  setEditingCommentId={setEditingCommentId}
                  handleUpdateComment={handleUpdateComment}
                  handleScrollToParent={handleScrollToParent}
                  onContextMenu={handleContextMenu}
                  isUpdatingComment={isUpdatingComment}
                />
              </React.Fragment>
            );
          })
        ) : (
          <div className="text-center py-6 bg-gray-50/50 rounded-2xl border-2 border-dashed border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No conversation yet. Be the first to comment.</p>
          </div>
        )}
      </div>

      {contextMenu && (
        <div 
          className="fixed z-[1000] w-48 bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl shadow-2xl py-1.5 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <button 
            onClick={() => { startReply(contextMenu.comment); setContextMenu(null); }}
            className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-indigo-50 flex items-center gap-3 transition"
          >
            <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            Reply
          </button>
          
          <button 
            onClick={() => { navigator.clipboard.writeText(contextMenu.comment.comment); setContextMenu(null); }}
            className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            Copy Text
          </button>

          {((isManager && contextMenu.comment.commentType === 'MANAGER' && contextMenu.comment.managerId === user?.id) || 
            (!isManager && contextMenu.comment.commentType === 'EMPLOYEE' && contextMenu.comment.employeeId === user?.id)) && (
            <>
              <div className="h-px bg-gray-100 my-1" />
              <button 
                onClick={() => { setEditingCommentId(contextMenu.comment.id); setEditCommentText(contextMenu.comment.comment); setContextMenu(null); }}
                className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-blue-50 flex items-center gap-3 transition"
              >
                <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Edit
              </button>
              <button 
                onClick={() => { setCommentToDelete(contextMenu.comment.id); setContextMenu(null); }}
                className="w-full px-4 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete
              </button>
            </>
          )}
        </div>
      )}

      <div className="border-t border-gray-100 pt-6">
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
        <form onSubmit={handleComment} className="flex gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-xs font-bold text-indigo-600 border border-indigo-100 shrink-0">
            {user?.staffName?.charAt(0) || '?'}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              ref={mainInputRef}
              className="flex-1 px-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition shadow-sm"
              placeholder={replyTarget ? `Replying to ${replyTarget.name}...` : "Write a comment..."}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <button 
              type="submit"
              disabled={isCommenting || !newComment.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </form>
      </div>

      {commentToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 p-8 text-center border border-gray-100">
            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Delete Comment?</h3>
            <p className="text-gray-500 text-sm mb-8 font-medium">This thread path will be removed permanently.</p>
            <div className="flex gap-3">
              <button onClick={() => setCommentToDelete(null)} className="flex-1 px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition uppercase text-[10px] tracking-widest">Cancel</button>
              <button onClick={handleDeleteComment} className="flex-1 px-6 py-3 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 transition shadow-lg shadow-rose-200 uppercase text-[10px] tracking-widest">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingPage;
