import React, { useState, useEffect, useRef } from "react";
import { toast } from 'react-toastify';
import { useAuth } from "../../hooks/useAuth";
import {
  useGetAllMeetingsQuery,
  useScheduleMeetingMutation,
  useUpdateMeetingMutation,
  useDeleteMeetingMutation,
  useGetMeetingCommentsQuery,
  useAddMeetingCommentMutation,
  useDeleteCommentMutation,
  useUpdateCommentMutation,
  usePublishMeetingMutation,
  useGetMeetingStatsForManagerQuery,
  useUpdateActionItemStatusMutation,
  useReopenActionItemMutation,
  useGetMeetingsByEmployeeQuery,
  useGetMeetingsByManagerQuery,
} from "../../features/continuous/continuousApi";
import { useGetEmployeesQuery } from "../../features/employee/employeeapi";
import { ContinuousStatus, ActionItemStatus } from "../../features/continuous/continuousTypes";
import { format } from "date-fns";
import { formatRelativeTime } from "../../utils/timeUtils";

const inputStyle: React.CSSProperties = {
  background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 8,
  padding: '7px 12px', fontSize: 13, color: '#111827', outline: 'none',
  width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 11, fontWeight: 500, color: '#9EA3B0',
  textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 5,
};
const panelStyle: React.CSSProperties = {
  background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, padding: '16px 18px',
};

const CommentItem = ({
  comment, allComments, user, isManager, highlightedCommentId,
  editingCommentId, editCommentText, setEditCommentText, setEditingCommentId,
  handleUpdateComment, handleScrollToParent, onContextMenu, isUpdatingComment
}: {
  comment: any; allComments: any[]; user: any; isManager: boolean;
  highlightedCommentId: number | null; editingCommentId: number | null;
  editCommentText: string; setEditCommentText: (val: string) => void;
  setEditingCommentId: (val: number | null) => void;
  handleUpdateComment: (id: number) => void;
  handleScrollToParent: (parentId: number) => void;
  onContextMenu: (e: React.MouseEvent, comment: any) => void;
  isUpdatingComment: boolean;
}) => {
  const isOwnComment = (isManager && comment.commentType === 'MANAGER' && comment.managerId === user?.id) ||
                       (!isManager && comment.commentType === 'EMPLOYEE' && comment.employeeId === user?.id);
  const isHighlighted = highlightedCommentId === comment.id;

  const bubbleStyle: React.CSSProperties = isOwnComment
    ? { background: '#EEF3FD', border: '0.5px solid #B5D4F4', borderRadius: 8, padding: '8px 10px', minWidth: 100, position: 'relative' }
    : { background: '#F5F6F8', border: '0.5px solid #E4E6EC', borderRadius: 8, padding: '8px 10px', minWidth: 100, position: 'relative' };

  return (
    <div 
      id={`comment-${comment.id}`} 
      className={`space-y-2`}
      onContextMenu={(e) => onContextMenu(e, comment)}
    >
      <div className={`flex gap-3 px-3 py-2 rounded-2xl transition-all duration-500 group relative ${
        highlightedCommentId === comment.id 
          ? 'bg-blue-100 ring-4 ring-blue-300 scale-[1.02] shadow-lg' 
          : isOwnComment ? 'flex-row-reverse bg-blue-50/30 border-l-4 border-blue-500' : 'bg-gray-50/30'
      }`}>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-sm transition-colors duration-500 ${
          highlightedCommentId === comment.id
            ? 'bg-blue-600 text-white'
            : isOwnComment ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-100'
        }`}>
          {(comment.commentType === 'MANAGER' ? comment.managerName : comment.employeeName)?.charAt(0)}
        </div>
        <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: 3, alignItems: isOwnComment ? 'flex-end' : 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              {isOwnComment ? 'You' : (comment.commentType === 'MANAGER' ? comment.managerName : comment.employeeName)}
            </span>
            {comment.commentType === 'MANAGER' && <span style={{ background: '#111827', color: '#FFFFFF', fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Manager</span>}
            <span style={{ fontSize: 10, color: '#9EA3B0' }}>{comment.createdAt ? format(new Date(comment.createdAt), 'h:mm a') : ''}</span>
          </div>

          <div style={bubbleStyle} className="group">
            <button onClick={(e) => onContextMenu(e as any, comment)}
              style={{ position: 'absolute', top: 4, right: 4, background: 'none', border: 'none', color: '#9EA3B0', cursor: 'pointer', padding: 2, display: 'flex' }}
              className="opacity-0 group-hover:opacity-100 transition-opacity">
              <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>

            {comment.parentId && (() => {
              const parent = allComments?.find(c => String(c.id) === String(comment.parentId));
              if (!parent) return null;
              const parentName = parent.commentType === 'MANAGER' ? parent.managerName : parent.employeeName;
              return (
                <div onClick={() => handleScrollToParent(parent.id)}
                  style={{ marginBottom: 8, padding: '5px 8px', borderRadius: 6, borderLeft: '2px solid #1A56DB', background: '#EEF3FD', cursor: 'pointer' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#0C447C', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{parentName}</div>
                  <div style={{ fontSize: 10, color: '#5A6070', fontStyle: 'italic' }} className="line-clamp-2">"{parent.comment}"</div>
                </div>
              );
            })()}

            {editingCommentId === comment.id ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <textarea style={{ ...inputStyle, height: 60, resize: 'none', padding: '6px 8px' }}
                  value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} autoFocus />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setEditingCommentId(null)} style={{ fontSize: 10, fontWeight: 600, color: '#9EA3B0', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                  <button disabled={isUpdatingComment} onClick={() => handleUpdateComment(comment.id)}
                    style={{ fontSize: 10, fontWeight: 600, color: '#1A56DB', background: 'none', border: 'none', cursor: isUpdatingComment ? 'not-allowed' : 'pointer', opacity: isUpdatingComment ? 0.5 : 1 }}>
                    {isUpdatingComment ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <span style={{ fontSize: 13, color: '#111827', lineHeight: 1.5 }}>{comment.comment}</span>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <span style={{ fontSize: 8, fontWeight: 500, color: '#9EA3B0' }}>{formatRelativeTime(comment.createdAt)}</span>
                  {isOwnComment && <svg style={{ width: 10, height: 10, color: '#B5D4F4' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const MeetingPage = () => {
  const { user, isManager, isAdmin, isHR } = useAuth();
  const canSchedule = isManager;
  const todayStr = new Date().toISOString().split('T')[0];

  const [perspective, setPerspective] = useState<'all' | 'received' | 'given'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);

  const { data: allResponse, isLoading: isLoadingAll } = useGetAllMeetingsQuery(
    { page: currentPage - 1, size: itemsPerPage, status: filterStatus },
    { skip: !user || perspective !== 'all' }
  );

  const { data: employeeResponse, isLoading: isLoadingEmp } = useGetMeetingsByEmployeeQuery(
    { employeeId: user?.id || 0, page: currentPage - 1, size: itemsPerPage },
    { skip: !user || perspective !== 'received' }
  );

  const { data: managerResponse, isLoading: isLoadingMgr } = useGetMeetingsByManagerQuery(
    { managerId: user?.id || 0, status: filterStatus, page: currentPage - 1, size: itemsPerPage },
    { skip: !user || perspective !== 'given' }
  );

  const meetingResponse = perspective === 'all' ? allResponse : perspective === 'received' ? employeeResponse : managerResponse;
  const isLoading = perspective === 'all' ? isLoadingAll : perspective === 'received' ? isLoadingEmp : isLoadingMgr;

  const meetings = meetingResponse?.content || [];
  const { data: employeeData } = useGetEmployeesQuery({ page: 0, size: 1000, excludeSelf: true });
  const employees = employeeData?.content || [];

  const deptEmployees = employees?.filter(emp =>
    emp.currentDepartmentName && user?.currentDepartmentName &&
    emp.currentDepartmentName === user?.currentDepartmentName
  ) || [];
  // Include the logged-in user's own rank since they are excluded from the
  // employees list (excludeSelf=true). Without this, the next person below
  // them becomes minRankInDept and gets incorrectly filtered out.
  const allDeptRanks = [
    ...deptEmployees.map(emp => emp.levelRank ?? 9999),
    user?.levelRank ?? 9999
  ];
  const minRankInDept = allDeptRanks.length > 0
    ? Math.min(...allDeptRanks)
    : 9999;

  const filteredEmployees = (isAdmin || isHR)
    ? employees
    : employees?.filter(emp =>
        emp.currentDepartmentName && user?.currentDepartmentName &&
        emp.currentDepartmentName === user?.currentDepartmentName &&
        emp.id !== user?.id &&
        (emp.levelRank === undefined || emp.levelRank === null || emp.levelRank !== minRankInDept) &&
        (emp.levelRank === undefined || emp.levelRank === null || user?.levelRank === undefined || user?.levelRank === null || emp.levelRank >= user.levelRank)
      );

  const [scheduleMeeting, { isLoading: isScheduling }] = useScheduleMeetingMutation();
  const [updateMeeting, { isLoading: isUpdating }] = useUpdateMeetingMutation();
  const [deleteMeeting] = useDeleteMeetingMutation();
  const [publishMeeting, { isLoading: isPublishing }] = usePublishMeetingMutation();
  const [updateActionItemStatus] = useUpdateActionItemStatusMutation();
  const [reopenActionItem] = useReopenActionItemMutation();
  const { data: meetingStats } = useGetMeetingStatsForManagerQuery(user?.id || 0, { skip: !user?.id });

  const [expandedMeetingId, setExpandedMeetingId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [meetingToDelete, setMeetingToDelete] = useState<number | null>(null);
  const [reopenConfig, setReopenConfig] = useState<{ meetingId: number, item: any } | null>(null);
  const [reopenReason, setReopenReason] = useState("");

  interface MeetingState {
    employeeId: number;
    meetingTitle: string;
    meetingDate: string;
    meetingTime: string;
    discussionPoints: string;
    keyIssues: string;
    actionItems: { id?: number; content: string; status?: string; assignedToId?: number; dueDate?: string }[];
    followUpDate: string;
  }

  const [newMeeting, setNewMeeting] = useState<MeetingState>({
    employeeId: 0,
    meetingTitle: "",
    meetingDate: "",
    meetingTime: "",
    discussionPoints: "",
    keyIssues: "",
    actionItems: [],
    followUpDate: "",
  });


  const handleSchedule = async (e: React.FormEvent, status: ContinuousStatus = ContinuousStatus.PUBLISHED) => {
    if (e) e.preventDefault();

    if (!newMeeting.employeeId || !newMeeting.meetingDate || !newMeeting.meetingTime || !newMeeting.discussionPoints || !newMeeting.keyIssues || newMeeting.actionItems.length === 0 || !user) {
      alert("Please fill out all required fields: Employee, Date, Time, Discussion Points, Key Issues, and Action Items.");
      return;
    }
    if (newMeeting.followUpDate && newMeeting.followUpDate < newMeeting.meetingDate) {
      toast.warning("Follow up date cannot be earlier than the meeting date.");
      return;
    }

    for (const item of newMeeting.actionItems) {
      if (item.content.trim() !== '') {
        if (!item.dueDate) {
          toast.warning("All active action items must have a due date.");
          return;
        }
        if (item.dueDate < newMeeting.meetingDate) {
          toast.warning(`Action Item due date (${item.dueDate}) cannot be earlier than the meeting date (${newMeeting.meetingDate}).`);
          return;
        }
        if (newMeeting.followUpDate && item.dueDate > newMeeting.followUpDate) {
          toast.warning(`Action Item due date (${item.dueDate}) cannot be later than the follow-up date (${newMeeting.followUpDate}).`);
          return;
        }
      }
    }
    try {
      const body = {
        ...newMeeting,
        managerId: user.id,
        status: editingId ? undefined : status,
        actionItems: newMeeting.actionItems
          .map(item => ({
            id: item.id || undefined,
            content: (item.content ?? '').trim(),
            status: (item.status || 'PENDING') as ActionItemStatus,
            assignedToId: item.assignedToId || newMeeting.employeeId,
            dueDate: item.dueDate,
          }))
          .filter(item => item.content !== ''),
      };
      if (editingId) {
        await updateMeeting({ id: editingId, body }).unwrap();
      } else {
        await scheduleMeeting(body).unwrap();
      }
      setShowModal(false);
      setEditingId(null);
      setNewMeeting({
        employeeId: 0,
        meetingTitle: "",
        meetingDate: "",
        meetingTime: "",
        discussionPoints: "",
        keyIssues: "",
        actionItems: [],
        followUpDate: "",
      });
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to save meeting");
    }
  };

  const handleEdit = (m: any) => {
    setEditingId(m.meetingId);
    setNewMeeting({
      employeeId: m.employeeId,
      meetingTitle: m.meetingTitle || "",
      meetingDate: m.meetingDate,
      meetingTime: m.meetingTime.substring(0, 5),
      discussionPoints: m.discussionPoints,
      keyIssues: m.keyIssues,
      actionItems: m.actionItems || [],
      followUpDate: m.followUpDate || "",
    });
    setShowModal(true);
  };

  const handlePublish = async (id: number) => {
    try {
      await publishMeeting(id).unwrap();
    } catch (err: any) {
      alert(err.data?.message || "Failed to publish meeting");
    }
  };

  const handleDelete = async () => {
    if (!meetingToDelete) return;
    try {
      await deleteMeeting(meetingToDelete).unwrap();
      setMeetingToDelete(null);
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to delete meeting");
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
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) handlePageChange(pageNum);
    else setGoToPage("");
  };

  if (isLoading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #E4E6EC', borderTopColor: '#1A56DB', borderRadius: '50%' }} className="animate-spin" />
    </div>
  );

  const totalItems = meetingResponse?.totalElements || 0;
  const totalPages = meetingResponse?.totalPages || 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + meetings.length;

  const btnPageStyle = (active: boolean): React.CSSProperties => ({
    width: 30, height: 30, borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
    background: active ? '#1A56DB' : 'transparent', color: active ? '#FFFFFF' : '#9EA3B0',
  });

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div style={{ ...panelStyle, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: '#111827' }}>1-on-1 Meetings</h1>
          <p style={{ fontSize: 12, color: '#9EA3B0', marginTop: 2 }}>Schedule and track personalized development conversations.</p>
        </div>
        {canSchedule && (
          <button onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1A56DB', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Schedule Meeting
          </button>
        )}
      </div>

      {isManager && (
        <div className="space-y-3">
          {/* Perspective selector tabs */}
          <div className="bg-white border border-gray-200/80 rounded-2xl p-1.5 flex gap-2 w-fit shadow-sm">
            <button
              onClick={() => { setPerspective('all'); setFilterStatus(undefined); setCurrentPage(1); }}
              className={`px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-300 ${
                perspective === 'all'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              All Interactions
            </button>
            <button
              onClick={() => { setPerspective('received'); setFilterStatus(undefined); setCurrentPage(1); }}
              className={`px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-300 ${
                perspective === 'received'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Meetings Received
            </button>
            <button
              onClick={() => { setPerspective('given'); setFilterStatus(undefined); setCurrentPage(1); }}
              className={`px-5 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-300 ${
                perspective === 'given'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Meetings Conducted (Given)
            </button>
          </div>

          {/* Draft/Published filter (only applicable for given or all) */}
          {perspective !== 'received' && (
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => { setFilterStatus(undefined); setCurrentPage(1); }}
                className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${!filterStatus ? 'bg-gray-900 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
              >
                All Statuses
              </button>
              <button
                onClick={() => { setFilterStatus(ContinuousStatus.PUBLISHED); setCurrentPage(1); }}
                className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === ContinuousStatus.PUBLISHED ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
              >
                Published Only
              </button>
              <button
                onClick={() => { setFilterStatus(ContinuousStatus.DRAFT); setCurrentPage(1); }}
                className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === ContinuousStatus.DRAFT ? 'bg-amber-500 text-white shadow-lg shadow-amber-100' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}
              >
                Drafts Only
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              {perspective === 'received' ? 'Received Published' : perspective === 'given' ? 'Given Published' : isManager ? 'Total Published' : 'Total Received'}
            </p>
            <h3 className="text-2xl font-bold text-gray-900">
              {perspective === 'received' ? (meetingResponse?.totalElements || 0) : perspective === 'given' ? (meetingStats?.totalPublished || 0) : isManager ? (meetingStats?.totalPublished || 0) : totalItems}
            </h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition group">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          </div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Follow up Tasks</p>
            <h3 className="text-2xl font-bold text-gray-900">{meetings?.filter(m => m.status === ContinuousStatus.PUBLISHED && m.followUpDate).length || 0}</h3>
          </div>
        </div>

        {isManager && perspective !== 'received' && (
          <button 
            onClick={() => { setFilterStatus(ContinuousStatus.DRAFT); setCurrentPage(1); }}
            className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition group text-left w-full"
          >
            <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            </div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Drafts</p>
              <h3 className="text-2xl font-bold text-rose-600">{meetingStats?.totalDraft || 0}</h3>
            </div>
          </button>
        )}
      </div>

      {/* Meeting List */}
      <div className="space-y-3">
        {meetings?.length === 0 && (
          <div style={{ padding: '48px 24px', textAlign: 'center', border: '2px dashed #E4E6EC', borderRadius: 12 }}>
            <p style={{ fontSize: 13, color: '#9EA3B0' }}>No meetings scheduled yet.</p>
          </div>
        )}
        {meetings?.map((m) => (
          <div key={m.meetingId} style={panelStyle} className="group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: '#EEF3FD', color: '#1A56DB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                  {(m.employeeId === user?.id ? m.managerName : m.employeeName)?.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>
                    {m.employeeId === user?.id ? `1-on-1 with ${m.managerName}` : m.employeeName}
                    {m.employeeId === user?.id && <span style={{ color: '#9EA3B0', fontWeight: 400, marginLeft: 6, fontSize: 11 }}>(Received)</span>}
                  </h3>
                  {m.meetingTitle && (
                    <p style={{ fontSize: 12, fontWeight: 500, color: '#5A6070', marginTop: 1 }}>{m.meetingTitle}</p>
                  )}
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginTop: 2 }}>
                    <span style={{ fontSize: 12, color: '#5A6070', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg style={{ width: 13, height: 13, color: '#9EA3B0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      {format(new Date(m.meetingDate), 'dd/MM/yyyy')}
                    </span>
                    <span style={{ fontSize: 12, color: '#5A6070', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <svg style={{ width: 13, height: 13, color: '#9EA3B0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      {m.meetingTime}
                    </span>
                    {m.followUpDate && (
                      <span style={{ fontSize: 12, color: '#791F1F', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <svg style={{ width: 13, height: 13 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Follow up: {format(new Date(m.followUpDate), 'dd/MM/yyyy')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                  {m.publishedAt 
                    ? <>Published {format(new Date(m.publishedAt), 'MMM d, yyyy')}</> 
                    : <>Created {format(new Date(m.createdAt), 'MMM d, yyyy')}</>}
                </span>
                {m.status === ContinuousStatus.DRAFT && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-[8px] font-black rounded uppercase tracking-widest border border-gray-200 flex items-center gap-1">
                    <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                    Draft
                  </span>
                )}
                {canSchedule && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEdit(m)} style={{ padding: 6, background: 'none', border: 'none', color: '#9EA3B0', cursor: 'pointer', borderRadius: 6 }} className="hover:bg-[#EEF3FD] hover:text-[#1A56DB] transition-colors">
                      <svg style={{ width: 15, height: 15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    </button>
                    <button onClick={() => setMeetingToDelete(m.meetingId)} style={{ padding: 6, background: 'none', border: 'none', color: '#9EA3B0', cursor: 'pointer', borderRadius: 6 }} className="hover:bg-[#FCEBEB] hover:text-[#791F1F] transition-colors">
                      <svg style={{ width: 15, height: 15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
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
                <div className="space-y-2 mt-2">
                  {m.actionItems.map((item: any) => {
                    const isDone = item.status === ActionItemStatus.DONE;
                    const isEmployee = user?.id === m.employeeId;
                    return (
                      <div key={item.id} className="flex items-start gap-3 group/item">
                        <div className="pt-0.5 relative group/tooltip">
                          <input
                            type="checkbox"
                            checked={isDone}
                            onChange={async () => {
                              if (!isEmployee || isDone) return;
                              try {
                                await updateActionItemStatus({
                                  meetingId: m.meetingId,
                                  itemId: item.id,
                                  status: ActionItemStatus.DONE
                                }).unwrap();
                              } catch (err) {
                                console.error("Failed to update status", err);
                              }
                            }}
                            disabled={!isEmployee || isDone}
                            className={`w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500 transition-all ${(!isEmployee || isDone) ? 'cursor-not-allowed opacity-70' : 'cursor-pointer hover:scale-110'}`}
                          />
                          {(!isEmployee || isDone) && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-[10px] rounded opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 shadow-xl">
                              {isDone ? 'Completed items cannot be unchecked' : 'This status is managed by the employee'}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Item content with status-based styling */}
                          <div className="flex items-start gap-2 flex-wrap">
                            <p className={`text-sm leading-relaxed transition-all duration-300 ${isDone ? 'text-green-600 line-through' : 'text-gray-700'}`}>
                              {item.content}
                            </p>
                            {item.assignedToName && (
                              <span style={{ fontSize: 9, fontWeight: 600, background: '#EEF3FD', color: '#0C447C', border: '0.5px solid #B5D4F4', borderRadius: 4, padding: '1px 6px' }}>
                                {item.assignedToName}
                              </span>
                            )}
                            {item.dueDate && (
                              <span style={{ fontSize: 9, fontWeight: 500, color: '#9EA3B0' }}>
                                due {format(new Date(item.dueDate), 'dd/MM/yyyy')}
                              </span>
                            )}

                            {/* Re-opened badge: shown when PENDING but has a reopenReason */}
                            {!isDone && item.reopenReason && (
                              <div className="relative group/reopen flex-shrink-0">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 border border-amber-200 text-amber-700 text-[8px] font-black uppercase tracking-widest rounded-full cursor-default">
                                  <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                  </svg>
                                  Re-opened
                                </span>
                                {/* Tooltip showing the reopen reason */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 bg-gray-900 text-white rounded-xl shadow-2xl opacity-0 group-hover/reopen:opacity-100 transition-all duration-200 pointer-events-none z-20 p-3">
                                  <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-1">Re-open Reason</p>
                                  <p className="text-xs leading-relaxed text-gray-200 font-normal">"{item.reopenReason}"</p>
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Completed status row */}
                          {isDone && (
                            <div className="mt-1 flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="inline-flex items-center text-[8px] font-black uppercase tracking-widest text-green-500">
                                  <svg className="w-2.5 h-2.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                  Completed
                                </span>
                                {item.completedAt && (
                                  <span className="text-xs text-gray-400 ml-2 font-light">
                                    {format(new Date(item.completedAt), "MMM d, h:mm a")}
                                  </span>
                                )}
                              </div>
                              {canSchedule && (
                                <button
                                  onClick={() => setReopenConfig({ meetingId: m.meetingId, item })}
                                  className="text-[8px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-700 transition opacity-0 group-hover/item:opacity-100 bg-indigo-50 px-2 py-1 rounded"
                                >
                                  Re-open
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {m.actionItems.length === 0 && (
                    <p className="text-gray-400 text-xs italic">No action items defined.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-gray-50 flex items-center justify-between">
              <button 
                onClick={() => setExpandedMeetingId(expandedMeetingId === m.meetingId ? null : m.meetingId)}
                className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-indigo-600 transition group"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-50 group-hover:bg-indigo-50 flex items-center justify-center transition">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <span>Replies {(m.commentCount || 0) > 0 && `(${(m.commentCount || 0)})`}</span>
              </button>
              {m.status === ContinuousStatus.DRAFT && m.managerId === user?.id && (
                <button 
                  onClick={() => handlePublish(m.meetingId)}
                  disabled={isPublishing}
                  className="px-4 py-1.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-black transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                  Publish Meeting
                </button>
              )}
            </div>

            {expandedMeetingId === m.meetingId && (
              <MeetingComments meetingId={m.meetingId} isManager={isManager} />
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '10px 0', borderTop: '0.5px solid #E4E6EC' }}>
          <span style={{ fontSize: 11, color: '#9EA3B0' }}>Showing {startIndex + 1}–{Math.min(endIndex, totalItems)} of {totalItems}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1}
              style={{ ...btnPageStyle(false), opacity: currentPage === 1 ? 0.3 : 1 }}>
              <svg style={{ width: 12, height: 12, margin: 'auto' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
            </button>
            {[...Array(totalPages)].map((_, i) => {
              const p = i + 1;
              if (totalPages > 5 && p !== 1 && p !== totalPages && (p < currentPage - 1 || p > currentPage + 1)) {
                if (p === currentPage - 2 || p === currentPage + 2) return <span key={p} style={{ fontSize: 11, color: '#9EA3B0', padding: '0 2px' }}>…</span>;
                return null;
              }
              return <button key={p} onClick={() => handlePageChange(p)} style={btnPageStyle(currentPage === p)}>{p}</button>;
            })}
            <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages || totalPages === 0}
              style={{ ...btnPageStyle(false), opacity: currentPage === totalPages || totalPages === 0 ? 0.3 : 1 }}>
              <svg style={{ width: 12, height: 12, margin: 'auto' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
          <form onSubmit={handleGoToPage} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <label style={{ fontSize: 11, color: '#9EA3B0' }}>Go to</label>
            <input type="text" value={goToPage} onChange={(e) => setGoToPage(e.target.value)} placeholder="…"
              style={{ width: 48, background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: '#111827', outline: 'none' }} />
          </form>
        </div>
      )}

      {/* Schedule / Edit Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, width: '100%', maxWidth: 520, overflow: 'hidden' }}>
            <div style={{ background: '#111827', padding: '14px 20px' }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>{editingId ? 'Update Meeting' : 'Schedule 1-on-1'}</h2>
              <p style={{ fontSize: 12, color: '#9EA3B0', marginTop: 2 }}>Define goals and expectations for the upcoming conversation.</p>
            </div>
            <div style={{ padding: 20, maxHeight: '75vh', overflowY: 'auto' }}>
              <form onSubmit={handleSchedule} className="space-y-4">
                <div>
                  <label style={labelStyle}>Meeting Title</label>
                  <input type="text" style={inputStyle} placeholder="e.g. Sprint Review 1:1"
                    value={newMeeting.meetingTitle}
                    onChange={e => setNewMeeting({ ...newMeeting, meetingTitle: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Select Employee</label>
                    <select required style={inputStyle} value={newMeeting.employeeId || ""}
                      onChange={e => setNewMeeting({ ...newMeeting, employeeId: Number(e.target.value) })}>
                      <option value="">Choose Member…</option>
                      {filteredEmployees?.map(emp => <option key={emp.id} value={emp.id}>{emp.staffName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={labelStyle}>Date &amp; Time</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input required type="date" min={todayStr} style={inputStyle} value={newMeeting.meetingDate}
                        onChange={e => setNewMeeting({ ...newMeeting, meetingDate: e.target.value })} />
                      <input required type="time" style={inputStyle} value={newMeeting.meetingTime}
                        onChange={e => setNewMeeting({ ...newMeeting, meetingTime: e.target.value })} />
                    </div>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Discussion Points</label>
                  <textarea required style={{ ...inputStyle, height: 56, resize: 'none', padding: '7px 12px' }}
                    placeholder="What would you like to discuss?" value={newMeeting.discussionPoints}
                    onChange={e => setNewMeeting({ ...newMeeting, discussionPoints: e.target.value })} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Key Issues</label>
                    <textarea required style={{ ...inputStyle, height: 48, resize: 'none', padding: '7px 12px' }}
                      value={newMeeting.keyIssues} onChange={e => setNewMeeting({ ...newMeeting, keyIssues: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Action Items</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {newMeeting.actionItems.map((item, index) => {
                        const isDone = item.status === ActionItemStatus.DONE;
                        return (
                          <div key={index} className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 relative">
                                <input
                                  type="text"
                                  disabled={isDone}
                                  className={`w-full px-3 py-1.5 rounded-lg text-sm transition border-none ${isDone ? 'bg-gray-100 text-gray-400 cursor-not-allowed italic' : 'bg-gray-50 focus:ring-2 focus:ring-indigo-500 text-gray-700'}`}
                                  placeholder="Task description…"
                                  value={item.content}
                                  onChange={e => {
                                    const updated = [...newMeeting.actionItems];
                                    updated[index] = { ...item, content: e.target.value };
                                    setNewMeeting({ ...newMeeting, actionItems: updated });
                                  }}
                                />
                                {isDone && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-black uppercase tracking-widest text-green-500 bg-green-50 px-1.5 py-0.5 rounded-full">Locked</span>}
                              </div>
                              {!isDone && (
                                <button type="button" onClick={() => setNewMeeting({ ...newMeeting, actionItems: newMeeting.actionItems.filter((_, i) => i !== index) })}
                                  className="p-1.5 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition shrink-0">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                              )}
                            </div>
                            {!isDone && (
                              <div className="flex gap-2 pl-0">
                                <input type="date"
                                  min={newMeeting.meetingDate || undefined}
                                  max={newMeeting.followUpDate || undefined}
                                  style={{ ...inputStyle, fontSize: 11, padding: '4px 8px', flex: 1 }}
                                  value={item.dueDate ?? ''}
                                  onChange={e => {
                                    const updated = [...newMeeting.actionItems];
                                    updated[index] = { ...item, dueDate: e.target.value || undefined };
                                    setNewMeeting({ ...newMeeting, actionItems: updated });
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                      <button type="button"
                        onClick={() => setNewMeeting({ ...newMeeting, actionItems: [...newMeeting.actionItems, { content: "", status: ActionItemStatus.PENDING }] })}
                        className="w-full py-2 border-2 border-dashed border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:border-indigo-200 hover:text-indigo-600 transition flex items-center justify-center gap-2 mt-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                        Add Task
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Follow Up Date</label>
                  <input type="date" min={newMeeting.meetingDate} style={inputStyle} value={newMeeting.followUpDate}
                    onChange={e => setNewMeeting({ ...newMeeting, followUpDate: e.target.value })} />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingId(null);
                      setNewMeeting({
                        employeeId: 0,
                        meetingTitle: "",
                        meetingDate: "",
                        meetingTime: "",
                        discussionPoints: "",
                        keyIssues: "",
                        actionItems: [],
                        followUpDate: ""
                      });
                    }}
                    className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  {editingId ? (
                    <button
                      type="button"
                      onClick={(e) => handleSchedule(e as any)}
                      disabled={isUpdating}
                      className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 disabled:opacity-50"
                    >
                      {isUpdating ? "Updating..." : "Update Meeting"}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={(e) => handleSchedule(e as any, ContinuousStatus.DRAFT)}
                        disabled={isScheduling}
                        className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
                      >
                        Save as Draft
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleSchedule(e as any, ContinuousStatus.PUBLISHED)}
                        disabled={isScheduling}
                        className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 disabled:opacity-50 flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                        Publish Meeting
                      </button>
                    </>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Meeting Modal */}
      {meetingToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16 }}>
          <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, width: '100%', maxWidth: 360, padding: 24, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg style={{ width: 22, height: 22, color: '#791F1F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 6 }}>Delete Meeting?</h3>
            <p style={{ fontSize: 12, color: '#9EA3B0', marginBottom: 20 }}>This action cannot be undone. All discussion points and comments will be permanently removed.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setMeetingToDelete(null)} style={{ flex: 1, padding: '9px', background: '#F5F6F8', color: '#5A6070', border: '0.5px solid #E4E6EC', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '9px', background: '#791F1F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {reopenConfig && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200 overflow-hidden border border-gray-100">
            <div className="bg-indigo-600 p-6 text-white text-center">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight">Re-open Action Item</h3>
              <p className="text-indigo-100 text-xs font-medium mt-1">Please provide a reason for re-opening this task.</p>
            </div>
            <div className="p-6">
              <div className="bg-gray-50 p-4 rounded-2xl mb-4 border border-gray-100">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Task Content</span>
                <p className="text-sm text-gray-700 font-medium italic">"{reopenConfig.item.content}"</p>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Reason for Re-opening</label>
                <textarea 
                  autoFocus
                  required
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition h-24 resize-none text-sm"
                  placeholder="Explain why this task needs further attention..."
                  value={reopenReason}
                  onChange={e => setReopenReason(e.target.value)}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setReopenConfig(null);
                    setReopenReason("");
                  }}
                  className="flex-1 px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  disabled={!reopenReason.trim()}
                  onClick={async () => {
                    try {
                      await reopenActionItem({
                        meetingId: reopenConfig.meetingId,
                        itemId: reopenConfig.item.id,
                        reason: reopenReason
                      }).unwrap();
                      setReopenConfig(null);
                      setReopenReason("");
                    } catch (err) {
                      console.error("Failed to re-open item", err);
                    }
                  }}
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 disabled:opacity-50"
                >
                  Re-open Task
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const MeetingComments = ({ meetingId, isManager }: { meetingId: number; isManager: boolean }) => {
  const { user, isAdmin, isHR } = useAuth();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; comment: any } | null>(null);

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
        body: { comment: newComment, commentType: isManager ? 'MANAGER' : 'EMPLOYEE', managerId: isManager ? user.id : undefined, employeeId: !isManager ? user.id : undefined, parentId: replyingToId ?? undefined }
      }).unwrap();
      setNewComment("");
      setReplyingToId(null);
      setReplyTarget(null);
    } catch (err) { console.error("Failed to add comment", err); }
  };

  const startReply = (comment: any) => {
    const name = comment.commentType === 'MANAGER' ? comment.managerName : comment.employeeName;
    setReplyingToId(comment.id);
    setReplyTarget({ id: comment.id, name, text: comment.comment });
    setTimeout(() => mainInputRef.current?.focus(), 50);
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!editCommentText.trim() || !user) return;
    try {
      await updateComment({ commentId, meetingId, body: { comment: editCommentText, commentType: isManager ? 'MANAGER' : 'EMPLOYEE', managerId: isManager ? user.id : undefined, employeeId: !isManager ? user.id : undefined } }).unwrap();
      setEditingCommentId(null);
      setEditCommentText("");
    } catch (err) { console.error("Failed to update comment", err); }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;
    try {
      await deleteComment({ commentId: commentToDelete, meetingId }).unwrap();
      setCommentToDelete(null);
    } catch (err) { console.error("Failed to delete comment", err); }
  };

  if (isLoading) return <div style={{ marginTop: 16, fontSize: 11, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fetching discussions…</div>;

  const sortedComments = [...(comments || [])].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div style={{ marginTop: 16, paddingTop: 16, borderTop: '0.5px solid #E4E6EC' }} className="space-y-4">
      <div className="space-y-4">
        {sortedComments.length > 0 ? (
          sortedComments.map((comment, index) => {
            const currentDate = comment.createdAt ? format(new Date(comment.createdAt), 'yyyy-MM-dd') : '';
            const prevDate = index > 0 && sortedComments[index - 1].createdAt ? format(new Date(sortedComments[index - 1].createdAt), 'yyyy-MM-dd') : '';
            const isNewDay = currentDate !== prevDate;
            return (
              <React.Fragment key={comment.id}>
                {isNewDay && (
                  <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
                    <span style={{ background: '#F5F6F8', border: '0.5px solid #E4E6EC', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 500, color: '#9EA3B0' }}>
                      {format(new Date(comment.createdAt), 'dd/MM/yyyy')}
                    </span>
                  </div>
                )}
                <CommentItem comment={comment} allComments={sortedComments} user={user} isManager={isManager}
                  highlightedCommentId={highlightedCommentId} editingCommentId={editingCommentId}
                  editCommentText={editCommentText} setEditCommentText={setEditCommentText}
                  setEditingCommentId={setEditingCommentId} handleUpdateComment={handleUpdateComment}
                  handleScrollToParent={handleScrollToParent} onContextMenu={handleContextMenu}
                  isUpdatingComment={isUpdatingComment} />
              </React.Fragment>
            );
          })
        ) : (
          <div style={{ padding: '20px', textAlign: 'center', border: '2px dashed #E4E6EC', borderRadius: 8 }}>
            <p style={{ fontSize: 11, color: '#9EA3B0' }}>No conversation yet. Be the first to comment.</p>
          </div>
        )}
      </div>

      {contextMenu && (
        <div style={{ position: 'fixed', zIndex: 1000, width: 176, background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 8, padding: '4px 0', top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}>
          {[
            { label: 'Reply', onClick: () => { startReply(contextMenu.comment); setContextMenu(null); }, color: '#111827', iconPath: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6', iconColor: '#1A56DB' },
            { label: 'Copy Text', onClick: () => { navigator.clipboard.writeText(contextMenu.comment.comment); setContextMenu(null); }, color: '#111827', iconPath: 'M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3', iconColor: '#9EA3B0' },
          ].map(item => (
            <button key={item.label} onClick={item.onClick}
              style={{ width: '100%', padding: '8px 14px', textAlign: 'left', fontSize: 13, color: item.color, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
              className="hover:bg-[#F5F6F8] transition-colors">
              <svg style={{ width: 14, height: 14, color: item.iconColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.iconPath} /></svg>
              {item.label}
            </button>
          ))}
          {((isManager && contextMenu.comment.commentType === 'MANAGER' && contextMenu.comment.managerId === user?.id) ||
            (!isManager && contextMenu.comment.commentType === 'EMPLOYEE' && contextMenu.comment.employeeId === user?.id) ||
            isAdmin || isHR) && (
            <>
              <div style={{ height: '0.5px', background: '#E4E6EC', margin: '2px 0' }} />
              <button onClick={() => { setEditingCommentId(contextMenu.comment.id); setEditCommentText(contextMenu.comment.comment); setContextMenu(null); }}
                style={{ width: '100%', padding: '8px 14px', textAlign: 'left', fontSize: 13, color: '#111827', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                className="hover:bg-[#F5F6F8] transition-colors">
                <svg style={{ width: 14, height: 14, color: '#1A56DB' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Edit
              </button>
              <button onClick={() => { setCommentToDelete(contextMenu.comment.id); setContextMenu(null); }}
                style={{ width: '100%', padding: '8px 14px', textAlign: 'left', fontSize: 13, color: '#791F1F', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                className="hover:bg-[#FCEBEB] transition-colors">
                <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* Input */}
      <div style={{ borderTop: '0.5px solid #E4E6EC', paddingTop: 14 }}>
        {replyTarget && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, background: '#EEF3FD', border: '0.5px solid #B5D4F4', borderLeft: '2px solid #1A56DB', borderRadius: 8, padding: '6px 10px' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#0C447C', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 2 }}>{replyTarget.name}</p>
              <p style={{ fontSize: 11, color: '#5A6070', fontStyle: 'italic' }} className="truncate">{replyTarget.text}</p>
            </div>
            <button onClick={() => { setReplyingToId(null); setReplyTarget(null); }}
              style={{ width: 18, height: 18, borderRadius: '50%', background: '#E4E6EC', color: '#5A6070', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg style={{ width: 10, height: 10 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <form onSubmit={handleComment} style={{ display: 'flex', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#EEF3FD', color: '#1A56DB', border: '0.5px solid #B5D4F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            {user?.staffName?.charAt(0) || '?'}
          </div>
          <div className="flex-1 flex gap-2">
            <input
              ref={mainInputRef}
              className="flex-1 px-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
              placeholder={replyTarget ? `Replying to ${replyTarget.name}...` : "Add to the conversation..."}
              value={newComment}
              onChange={e => setNewComment(e.target.value)}
            />
            <button 
              type="submit"
              disabled={isCommenting || !newComment.trim()}
              className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </form>
      </div>

      {/* Delete Comment Modal */}
      {commentToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70, padding: 16 }}>
          <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, width: '100%', maxWidth: 340, padding: 24, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg style={{ width: 22, height: 22, color: '#791F1F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 6 }}>Delete Comment?</h3>
            <p style={{ fontSize: 12, color: '#9EA3B0', marginBottom: 20 }}>This thread path will be removed permanently.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setCommentToDelete(null)} style={{ flex: 1, padding: '9px', background: '#F5F6F8', color: '#5A6070', border: '0.5px solid #E4E6EC', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDeleteComment} style={{ flex: 1, padding: '9px', background: '#791F1F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingPage;