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
  useUpdateCommentMutation
} from "../../features/continuous/continuousApi";
import { useGetEmployeesQuery } from "../../features/employee/employeeapi";
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
    <div id={`comment-${comment.id}`} onContextMenu={(e) => onContextMenu(e, comment)}
      style={isHighlighted ? { background: '#EEF3FD', border: '0.5px solid #B5D4F4', borderRadius: 8, padding: 8, margin: -8 } : {}}>
      <div style={{ display: 'flex', gap: 10, ...(isOwnComment ? { flexDirection: 'row-reverse' as const } : {}) }}>
        <div style={{ width: 30, height: 30, borderRadius: 6, background: isOwnComment || isHighlighted ? '#1A56DB' : '#F5F6F8', color: isOwnComment || isHighlighted ? '#FFFFFF' : '#111827', border: isOwnComment || isHighlighted ? 'none' : '0.5px solid #E4E6EC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 4 }}>
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

  const blankMeeting = { employeeId: 0, meetingDate: "", meetingTime: "", discussionPoints: "", keyIssues: "", actionItems: "", followUpDate: "", isPrivateNote: false };
  const [newMeeting, setNewMeeting] = useState(blankMeeting);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeeting.employeeId || !newMeeting.meetingDate || !newMeeting.meetingTime || !newMeeting.discussionPoints || !newMeeting.keyIssues || !newMeeting.actionItems || !user) {
      toast.warning("Please fill out all required fields: Employee, Date, Time, Discussion Points, Key Issues, and Action Items.");
      return;
    }
    if (newMeeting.followUpDate && newMeeting.followUpDate < newMeeting.meetingDate) {
      toast.warning("Follow up date cannot be earlier than the meeting date.");
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
      setNewMeeting(blankMeeting);
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to save meeting");
    }
  };

  const handleEdit = (m: any) => {
    setEditingId(m.meetingId);
    setNewMeeting({ employeeId: m.employeeId, meetingDate: m.meetingDate, meetingTime: m.meetingTime, discussionPoints: m.discussionPoints, keyIssues: m.keyIssues, actionItems: m.actionItems, followUpDate: m.followUpDate || "", isPrivateNote: m.isPrivateNote });
    setShowModal(true);
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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div style={{ ...panelStyle, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#EEF3FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg style={{ width: 20, height: 20, color: '#1A56DB' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Scheduled Meetings</p>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{totalItems}</h3>
          </div>
        </div>
        <div style={{ ...panelStyle, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: '#FAEEDA', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg style={{ width: 20, height: 20, color: '#633806' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Follow Up Tasks</p>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{meetings?.filter(m => m.followUpDate).length || 0}</h3>
          </div>
        </div>
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
                  {m.employeeName?.charAt(0)}
                </div>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: '#111827' }}>{m.employeeName}</h3>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {m.isPrivateNote && (
                  <span style={{ background: '#FAEEDA', color: '#633806', border: '0.5px solid #F0D4A4', borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>Private</span>
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" style={{ background: '#F5F6F8', border: '0.5px solid #E4E6EC', borderRadius: 8, padding: '12px 14px' }}>
              {[['Discussion Points', m.discussionPoints], ['Key Issues', m.keyIssues], ['Action Items', m.actionItems]].map(([label, val]) => (
                <div key={label}>
                  <span style={{ ...labelStyle, marginBottom: 4 }}>{label}</span>
                  <p style={{ fontSize: 13, color: '#5A6070', lineHeight: 1.5 }}>{val}</p>
                </div>
              ))}
            </div>

            <div style={{ paddingTop: 12, marginTop: 12, borderTop: '0.5px solid #E4E6EC' }}>
              <button onClick={() => setExpandedMeetingId(expandedMeetingId === m.meetingId ? null : m.meetingId)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9EA3B0', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                className="hover:text-[#1A56DB] transition-colors">
                <svg style={{ width: 14, height: 14, transition: 'transform 0.2s', transform: expandedMeetingId === m.meetingId ? 'rotate(180deg)' : 'rotate(0deg)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" /></svg>
                Meeting Discussion
              </button>
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
                      <input required type="date" style={inputStyle} value={newMeeting.meetingDate}
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
                  <div>
                    <label style={labelStyle}>Action Items</label>
                    <textarea required style={{ ...inputStyle, height: 48, resize: 'none', padding: '7px 12px' }}
                      value={newMeeting.actionItems} onChange={e => setNewMeeting({ ...newMeeting, actionItems: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Follow Up Date</label>
                  <input type="date" min={newMeeting.meetingDate} style={inputStyle} value={newMeeting.followUpDate}
                    onChange={e => setNewMeeting({ ...newMeeting, followUpDate: e.target.value })} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="isPrivateNote" checked={newMeeting.isPrivateNote}
                    onChange={e => setNewMeeting({ ...newMeeting, isPrivateNote: e.target.checked })}
                    style={{ width: 14, height: 14 }} />
                  <label htmlFor="isPrivateNote" style={{ fontSize: 13, color: '#5A6070' }}>Mark as Private Note (Visible only to Manager)</label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 }}>
                  <button type="button" onClick={() => { setShowModal(false); setEditingId(null); setNewMeeting(blankMeeting); }}
                    style={{ padding: '8px 16px', background: '#F5F6F8', color: '#5A6070', border: '0.5px solid #E4E6EC', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isScheduling || isUpdating}
                    style={{ padding: '8px 20px', background: '#1A56DB', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: isScheduling || isUpdating ? 'not-allowed' : 'pointer', opacity: isScheduling || isUpdating ? 0.6 : 1 }}>
                    {isScheduling || isUpdating ? 'Saving…' : editingId ? 'Update Meeting' : 'Schedule Now'}
                  </button>
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
    </div>
  );
};

const MeetingComments = ({ meetingId, isManager }: { meetingId: number; isManager: boolean }) => {
  const { user } = useAuth();
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
            (!isManager && contextMenu.comment.commentType === 'EMPLOYEE' && contextMenu.comment.employeeId === user?.id)) && (
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
          <div style={{ flex: 1, display: 'flex', gap: 6 }}>
            <input ref={mainInputRef} style={{ ...inputStyle, flex: 1 }}
              placeholder={replyTarget ? `Replying to ${replyTarget.name}…` : 'Write a comment…'}
              value={newComment} onChange={e => setNewComment(e.target.value)} />
            <button type="submit" disabled={isCommenting || !newComment.trim()}
              style={{ padding: '7px 10px', background: '#1A56DB', color: '#FFFFFF', border: 'none', borderRadius: 8, cursor: isCommenting || !newComment.trim() ? 'not-allowed' : 'pointer', opacity: isCommenting || !newComment.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center' }}>
              <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
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
