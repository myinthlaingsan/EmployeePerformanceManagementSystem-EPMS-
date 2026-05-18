import React, { useState, useEffect, useRef } from "react";
import { toast } from 'react-toastify';
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
  usePublishFeedbackMutation,
  useGetFeedbackStatsForManagerQuery,
} from "../../features/continuous/continuousApi";
import { useGetEmployeesQuery } from "../../features/employee/employeeapi";
import { FeedbackType, ContinuousStatus } from "../../features/continuous/continuousTypes";
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

const FEEDBACK_TYPE_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  [FeedbackType.PRAISE]:      { bg: '#EAF3DE', text: '#27500A', border: '#B8DCA0' },
  [FeedbackType.IMPROVEMENT]: { bg: '#FAEEDA', text: '#633806', border: '#F0D4A4' },
  [FeedbackType.WARNING]:     { bg: '#FCEBEB', text: '#791F1F', border: '#F5BFBF' },
};

const FeedbackSnapshot = ({ stats }: { stats: { praise: number; improvement: number; correction: number } }) => {
  const { isManager, isAdmin, isHR } = useAuth();
  const showTips = isManager || isAdmin || isHR;

  const bars = [
    { label: 'Praise', val: stats.praise, bar: '#27500A', text: '#27500A' },
    { label: 'Improvement', val: stats.improvement, bar: '#633806', text: '#633806' },
    { label: 'Correction', val: stats.correction, bar: '#791F1F', text: '#791F1F' },
  ];

  return (
    <div style={panelStyle} className="space-y-4">
      <p style={{ fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Feedback Snapshot</p>
      <div className="space-y-3">
        {bars.map(b => (
          <div key={b.label} className="space-y-1">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 500, color: '#5A6070' }}>{b.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: b.text }}>{b.val}%</span>
            </div>
            <div style={{ height: 6, background: '#F5F6F8', borderRadius: 4, overflow: 'hidden', border: '0.5px solid #E4E6EC' }}>
              <div style={{ height: '100%', background: b.bar, borderRadius: 4, width: `${b.val}%`, transition: 'width 0.5s' }} />
            </div>
          </div>
        ))}
      </div>

      {showTips && (
        <div style={{ background: '#111827', borderRadius: 8, padding: '14px 16px', marginTop: 4 }} className="space-y-3">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg style={{ width: 16, height: 16, color: '#9EA3B0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#FFFFFF' }}>Manager Tips</span>
          </div>
          <p style={{ fontSize: 12, color: '#9EA3B0', lineHeight: 1.6 }}>Giving constructive feedback works best when it's specific, actionable, and delivered within 24 hours.</p>
          <div className="space-y-2">
            {['Use the "Situation-Behavior-Impact" model.', 'Balance praise with growth opportunities.'].map(tip => (
              <div key={tip} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(255,255,255,0.05)', border: '0.5px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '7px 10px' }}>
                <svg style={{ width: 12, height: 12, color: '#B5D4F4', flexShrink: 0, marginTop: 1 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                <p style={{ fontSize: 11, color: '#9EA3B0', lineHeight: 1.4 }}>{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const feedbackTypeConfig = {
  [FeedbackType.PRAISE]: {
    icon: <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.382-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
    label: 'Praise',
    activeStyle: { background: '#EAF3DE', color: '#27500A', border: '0.5px solid #B8DCA0' } as React.CSSProperties,
    inactiveStyle: { background: 'transparent', color: '#9EA3B0' } as React.CSSProperties,
  },
  [FeedbackType.IMPROVEMENT]: {
    icon: <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
    label: 'Improvement',
    activeStyle: { background: '#FAEEDA', color: '#633806', border: '0.5px solid #F0D4A4' } as React.CSSProperties,
    inactiveStyle: { background: 'transparent', color: '#9EA3B0' } as React.CSSProperties,
  },
  [FeedbackType.WARNING]: {
    icon: <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    label: 'Correction',
    activeStyle: { background: '#FCEBEB', color: '#791F1F', border: '0.5px solid #F5BFBF' } as React.CSSProperties,
    inactiveStyle: { background: 'transparent', color: '#9EA3B0' } as React.CSSProperties,
  },
};

const ReplyItem = ({
  reply, allReplies, user, authorId, highlightedReplyId,
  editingReplyId, editReplyText, setEditReplyText, setEditingReplyId,
  handleUpdateReply, handleScrollToParent, onContextMenu, isUpdatingReply
}: {
  reply: any; allReplies: any[]; user: any; authorId: number;
  highlightedReplyId: number | null; editingReplyId: number | null;
  editReplyText: string; setEditReplyText: (val: string) => void;
  setEditingReplyId: (val: number | null) => void;
  handleUpdateReply: (id: number) => void;
  handleScrollToParent: (parentId: number) => void;
  onContextMenu: (e: React.MouseEvent, reply: any) => void;
  isUpdatingReply: boolean;
}) => {
  const isCurrentUser = reply.employeeId === user?.id;
  const isAuthor = reply.employeeId === authorId;
  const isHighlighted = highlightedReplyId === reply.replyId;

  const bubbleStyle: React.CSSProperties = isCurrentUser
    ? { background: '#EEF3FD', border: '0.5px solid #B5D4F4', borderRadius: 8, padding: '8px 10px', minWidth: 100, position: 'relative' }
    : { background: '#F5F6F8', border: '0.5px solid #E4E6EC', borderRadius: 8, padding: '8px 10px', minWidth: 100, position: 'relative' };

  return (
    <div id={`reply-${reply.replyId}`} onContextMenu={(e) => onContextMenu(e, reply)}
      style={isHighlighted ? { background: '#EEF3FD', border: '0.5px solid #B5D4F4', borderRadius: 8, padding: 8, margin: -8 } : {}}>
      <div style={{ display: 'flex', gap: 10, ...(isCurrentUser ? { flexDirection: 'row-reverse' as const } : {}) }}>
        <div style={{ width: 30, height: 30, borderRadius: 6, background: isCurrentUser || isHighlighted ? '#1A56DB' : '#F5F6F8', color: isCurrentUser || isHighlighted ? '#FFFFFF' : '#111827', border: isCurrentUser || isHighlighted ? 'none' : '0.5px solid #E4E6EC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 4 }}>
          {reply.employeeName?.charAt(0) || '?'}
        </div>
        <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: 3, alignItems: isCurrentUser ? 'flex-end' : 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              {isCurrentUser ? 'You' : reply.employeeName}
            </span>
            {isAuthor && <span style={{ background: '#111827', color: '#FFFFFF', fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 3, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Author</span>}
            <span style={{ fontSize: 10, color: '#9EA3B0' }}>{reply.createdAt ? format(new Date(reply.createdAt), 'h:mm a') : ''}</span>
          </div>

          <div style={bubbleStyle} className="group">
            <button onClick={(e) => onContextMenu(e as any, reply)}
              style={{ position: 'absolute', top: 4, right: 4, background: 'none', border: 'none', color: '#9EA3B0', cursor: 'pointer', padding: 2, display: 'flex' }}
              className="opacity-0 group-hover:opacity-100 transition-opacity">
              <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
            </button>

            {reply.parentId && (() => {
              const parent = allReplies?.find(r => String(r.replyId) === String(reply.parentId));
              if (!parent) return null;
              return (
                <div onClick={() => handleScrollToParent(parent.replyId)}
                  style={{ marginBottom: 8, padding: '5px 8px', borderRadius: 6, borderLeft: '2px solid #1A56DB', background: '#EEF3FD', cursor: 'pointer' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: '#0C447C', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{parent.employeeName}</div>
                  <div style={{ fontSize: 10, color: '#5A6070', fontStyle: 'italic' }} className="line-clamp-2">"{parent.replyText}"</div>
                </div>
              );
            })()}

            {editingReplyId === reply.replyId ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <input style={{ ...inputStyle, padding: '6px 8px' }}
                  value={editReplyText} onChange={(e) => setEditReplyText(e.target.value)} autoFocus />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setEditingReplyId(null)} style={{ fontSize: 10, fontWeight: 600, color: '#9EA3B0', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                  <button disabled={isUpdatingReply} onClick={() => handleUpdateReply(reply.replyId)}
                    style={{ fontSize: 10, fontWeight: 600, color: '#1A56DB', background: 'none', border: 'none', cursor: isUpdatingReply ? 'not-allowed' : 'pointer', opacity: isUpdatingReply ? 0.5 : 1 }}>
                    {isUpdatingReply ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <span style={{ fontSize: 13, color: '#111827', lineHeight: 1.5 }}>{reply.replyText}</span>
                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <span style={{ fontSize: 8, fontWeight: 500, color: '#9EA3B0' }}>{formatRelativeTime(reply.createdAt)}</span>
                  {isCurrentUser && <svg style={{ width: 10, height: 10, color: '#B5D4F4' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const FeedbackPage = () => {
  const { user, isManager, isAdmin, isHR } = useAuth();
  const canCreate = isManager;

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [goToPage, setGoToPage] = useState("");
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);

  const { data: feedbackResponse, isLoading } = useGetAllFeedbacksQuery(
    { page: currentPage - 1, size: itemsPerPage, status: filterStatus },
    { skip: !user }
  );
  const feedbacks = feedbackResponse?.content || [];
  const { data: tags } = useGetFeedbackTagsQuery();
  const { data: employeeData } = useGetEmployeesQuery({ page: 0, size: 1000, excludeSelf: true });
  const employees = employeeData?.content || [];

  const [createFeedback, { isLoading: isCreating }] = useCreateFeedbackMutation();
  const [updateFeedback, { isLoading: isUpdating }] = useUpdateFeedbackMutation();
  const [deleteFeedback] = useDeleteFeedbackMutation();
  const [publishFeedback, { isLoading: isPublishing }] = usePublishFeedbackMutation();
  const { data: feedbackStats } = useGetFeedbackStatsForManagerQuery(user?.id || 0, { skip: !user?.id });
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

  const blankFeedback = { employeeId: 0, tagId: "" as number | "", feedbackType: FeedbackType.PRAISE, description: "", isPrivate: false };
  const [showModal, setShowModal] = useState(false);
  const [newFeedback, setNewFeedback] = useState<{ employeeId: number; tagId: number | ""; feedbackType: FeedbackType; description: string; isPrivate: boolean }>(blankFeedback);

  const selectedEmp = employees?.find(e => e.id === newFeedback.employeeId);

  const handleCreate = async (e: React.FormEvent, status: ContinuousStatus = ContinuousStatus.PUBLISHED) => {
    if (e) e.preventDefault();
    if (!user || !newFeedback.employeeId || !newFeedback.tagId) {
      toast.warning("Please select an employee and a category.");
      return;
    }
    try {
      const body = { employeeId: newFeedback.employeeId, tagId: newFeedback.tagId as number, feedbackType: newFeedback.feedbackType, description: newFeedback.description, isPrivate: newFeedback.isPrivate, managerId: user.id };
      if (editingId) { await updateFeedback({ id: editingId, body }).unwrap(); }
      else { await createFeedback(body).unwrap(); }
      setShowModal(false);
      setEditingId(null);
      setNewFeedback(blankFeedback);
    } catch (err: any) {
      toast.error(err.data?.message || "Failed to save feedback");
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
      setIsAddingTag(false); setEditingTagId(null); setNewTagName("");
    } catch (err: any) { toast.error(err.data?.message || "Failed to save tag"); }
  };

  const handleDeleteTag = async () => {
    if (!tagToDelete) return;
    try {
      await deleteFeedbackTag(tagToDelete).unwrap();
      if (newFeedback.tagId === tagToDelete) setNewFeedback({ ...newFeedback, tagId: "" });
      setTagToDelete(null);
    } catch (err: any) { toast.error(err.data?.message || "Failed to delete tag"); }
  };

  const handleDelete = async () => {
    if (!feedbackToDelete) return;
    try {
      await deleteFeedback(feedbackToDelete).unwrap();
      setFeedbackToDelete(null);
    } catch (err: any) { toast.error(err.data?.message || "Failed to delete feedback"); }
  };

  const handleEdit = (fb: any) => {
    setEditingId(fb.feedbackId);
    setNewFeedback({ employeeId: fb.employeeId, tagId: fb.tag?.tagId || 0, feedbackType: fb.feedbackType, description: fb.description, isPrivate: fb.isPrivate });
    setShowModal(true);
  };

  const handlePublish = async (id: number) => {
    try {
      await publishFeedback(id).unwrap();
    } catch (err: any) {
      alert(err.data?.message || "Failed to publish feedback");
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) { setCurrentPage(page); setGoToPage(""); window.scrollTo({ top: 0, behavior: 'smooth' }); }
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

  const totalItems = feedbackResponse?.totalElements || 0;
  const totalPages = feedbackResponse?.totalPages || 0;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + feedbacks.length;

  const publishedFeedbacks = feedbacks?.filter(f => f.status === ContinuousStatus.PUBLISHED) || [];
  const stats = {
    praise: Math.round((publishedFeedbacks.filter(f => f.feedbackType === FeedbackType.PRAISE).length / (publishedFeedbacks.length || 1)) * 100),
    improvement: Math.round((publishedFeedbacks.filter(f => f.feedbackType === FeedbackType.IMPROVEMENT).length / (publishedFeedbacks.length || 1)) * 100),
    correction: Math.round((publishedFeedbacks.filter(f => f.feedbackType === FeedbackType.WARNING).length / (publishedFeedbacks.length || 1)) * 100),
  };

  const btnPageStyle = (active: boolean): React.CSSProperties => ({
    width: 30, height: 30, borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
    background: active ? '#1A56DB' : 'transparent', color: active ? '#FFFFFF' : '#9EA3B0',
  });

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div style={{ ...panelStyle, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: '#111827' }}>Continuous Feedback</h1>
          <p style={{ fontSize: 12, color: '#9EA3B0', marginTop: 2 }}>Real-time performance insights and team recognition.</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#1A56DB', color: '#FFFFFF', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
            <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
            Give Feedback
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-3 order-2 lg:order-1">
          {(isAdmin || isHR) && (
            <div style={{ background: '#FAEEDA', border: '2px dashed #F0D4A4', borderRadius: 12, padding: '32px 24px', textAlign: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: '#633806', marginBottom: 6 }}>Access Restricted</h3>
              <p style={{ fontSize: 12, color: '#633806', marginBottom: 14 }}>Admins are restricted to viewing performance history only. Feedback details are hidden.</p>
              <a href="/performance-history" style={{ display: 'inline-block', padding: '7px 16px', background: '#633806', color: '#FFFFFF', borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: 'none' }}>Go to Performance History</a>
            </div>
          )}

          {!(isAdmin || isHR) && feedbacks?.length === 0 && (
            <div style={{ padding: '48px 24px', textAlign: 'center', border: '2px dashed #E4E6EC', borderRadius: 12 }}>
              <p style={{ fontSize: 13, color: '#9EA3B0' }}>No feedback entries yet.</p>
            </div>
          )}

          {feedbacks?.map((fb) => {
            const typeStyle = FEEDBACK_TYPE_STYLE[fb.feedbackType] || FEEDBACK_TYPE_STYLE[FeedbackType.PRAISE];
            return (
              <div key={fb.feedbackId} style={panelStyle} className="group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 8, background: typeStyle.bg, color: typeStyle.text, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                      {fb.managerName.charAt(0)}
                    </div>
                    <div>
                      <h3 style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>
                        {fb.managerName}
                        {fb.employeeId !== user?.id && <span style={{ color: '#9EA3B0', fontWeight: 400, marginLeft: 4, fontSize: 12 }}>to {fb.employeeName}</span>}
                        {fb.employeeId === user?.id && fb.managerId === user?.id && <span style={{ color: '#9EA3B0', fontWeight: 400, marginLeft: 4, fontSize: 12 }}>(Self)</span>}
                      </h3>
                      <p style={{ fontSize: 11, color: '#9EA3B0', marginTop: 1 }}>{format(new Date(fb.createdAt), 'dd/MM/yyyy, p')}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ background: typeStyle.bg, color: typeStyle.text, border: `0.5px solid ${typeStyle.border}`, borderRadius: 6, padding: '2px 8px', fontSize: 10, fontWeight: 600 }}>
                      {fb.feedbackType}
                    </span>
                    {(fb.managerId === user?.id || isAdmin || isHR) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(fb)} style={{ padding: 5, background: 'none', border: 'none', color: '#9EA3B0', cursor: 'pointer', borderRadius: 6 }} className="hover:bg-[#EEF3FD] hover:text-[#1A56DB] transition-colors">
                          <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => setFeedbackToDelete(fb.feedbackId)} style={{ padding: 5, background: 'none', border: 'none', color: '#9EA3B0', cursor: 'pointer', borderRadius: 6 }} className="hover:bg-[#FCEBEB] hover:text-[#791F1F] transition-colors">
                          <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2" style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {fb.tag && <span style={{ background: '#F5F6F8', border: '0.5px solid #E4E6EC', borderRadius: 4, padding: '1px 6px', fontSize: 10, fontWeight: 600, color: '#5A6070' }}>#{fb.tag.tagName}</span>}
                    {fb.isPrivate && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600, color: '#791F1F' }}>
                        <svg style={{ width: 10, height: 10 }} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                        Private
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: '#5A6070', lineHeight: 1.5 }}>{fb.description}</p>
                </div>

                <div style={{ paddingTop: 10, borderTop: '0.5px solid #E4E6EC' }}>
                  <button onClick={() => setExpandedFeedbackId(expandedFeedbackId === fb.feedbackId ? null : fb.feedbackId)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9EA3B0', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
                    className="hover:text-[#1A56DB] transition-colors">
                    <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    Replies
                  </button>
                </div>

                {expandedFeedbackId === fb.feedbackId && (
                  <FeedbackReplies feedbackId={fb.feedbackId} authorId={fb.managerId} />
                )}
              </div>
            );
          })}

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
                {fb.status === ContinuousStatus.DRAFT && fb.managerId === user?.id && (
                  <button 
                    onClick={() => handlePublish(fb.feedbackId)}
                    disabled={isPublishing}
                    className="px-4 py-1.5 bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-black transition shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    Publish Feedback
                  </button>
                )}
              </div>
              <form onSubmit={handleGoToPage} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <label style={{ fontSize: 11, color: '#9EA3B0' }}>Go to</label>
                <input type="text" value={goToPage} onChange={(e) => setGoToPage(e.target.value)} placeholder="…"
                  style={{ width: 48, background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: '#111827', outline: 'none' }} />
              </form>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4 order-1 lg:order-2 lg:sticky lg:top-6">
          <div style={{ ...panelStyle, display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: '#EEF3FD', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg style={{ width: 20, height: 20, color: '#1A56DB' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, color: '#9EA3B0', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Feedback</p>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: '#111827' }}>{totalItems}</h3>
            </div>
          </div>

          {isManager && (
            <button 
              onClick={() => { setFilterStatus(ContinuousStatus.DRAFT); setCurrentPage(1); }}
              className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center gap-5 hover:shadow-md transition group text-left w-full"
            >
              <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Drafts</p>
                <h3 className="text-2xl font-bold text-amber-600">{feedbackStats?.totalDraft || 0}</h3>
              </div>
            </button>
          )}
          <FeedbackSnapshot stats={stats} />
        </div>
      </div>

      {/* Create/Edit Feedback Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 16 }}>
          <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, width: '100%', maxWidth: 500, overflow: 'hidden' }}>
            <div style={{ background: '#111827', padding: '14px 20px' }}>
              <h2 style={{ fontSize: 15, fontWeight: 600, color: '#FFFFFF' }}>{editingId ? 'Edit Feedback' : 'Give Performance Feedback'}</h2>
            </div>
            <div style={{ padding: 20, maxHeight: '80vh', overflowY: 'auto' }}>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label style={labelStyle}>Select Employee</label>
                    <select required style={inputStyle} value={newFeedback.employeeId}
                      onChange={e => setNewFeedback({ ...newFeedback, employeeId: Number(e.target.value) })}>
                      <option value="">Choose Staff</option>
                      {filteredEmployees?.map(emp => <option key={emp.id} value={emp.id}>{emp.staffName}</option>)}
                    </select>
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
                      <label style={{ ...labelStyle, marginBottom: 0 }}>Tag</label>
                      {!isAddingTag && (
                        <button type="button" onClick={() => setIsAddingTag(true)}
                          style={{ fontSize: 10, fontWeight: 600, color: '#1A56DB', background: 'none', border: 'none', cursor: 'pointer' }}>+ New Tag</button>
                      )}
                    </div>
                    {isAddingTag ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <input type="text" autoFocus placeholder="New tag name…" style={{ ...inputStyle, flex: 1 }}
                          value={newTagName} onChange={e => setNewTagName(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateTag(); } if (e.key === 'Escape') { setIsAddingTag(false); setNewTagName(""); } }} />
                        <button type="button" onClick={handleCreateTag} disabled={isCreatingTag || isUpdatingTag || !newTagName.trim()}
                          style={{ padding: '7px 10px', background: '#1A56DB', color: '#FFFFFF', border: 'none', borderRadius: 8, cursor: 'pointer', opacity: isCreatingTag || isUpdatingTag || !newTagName.trim() ? 0.5 : 1, display: 'flex' }}>
                          <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </button>
                        <button type="button" onClick={() => { setIsAddingTag(false); setNewTagName(""); }}
                          style={{ padding: '7px 10px', background: '#F5F6F8', color: '#5A6070', border: '0.5px solid #E4E6EC', borderRadius: 8, cursor: 'pointer', display: 'flex' }}>
                          <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                      </div>
                    ) : (
                      <select required style={inputStyle} value={newFeedback.tagId}
                        onChange={e => setNewFeedback({ ...newFeedback, tagId: Number(e.target.value) })}>
                        <option value="">Choose Tag…</option>
                        {tags?.map(tag => <option key={tag.tagId} value={tag.tagId}>{tag.tagName}</option>)}
                      </select>
                    )}
                  </div>
                </div>

                {selectedEmp && (
                  <div style={{ background: '#EEF3FD', border: '0.5px solid #B5D4F4', borderRadius: 8, padding: '10px 14px', display: 'flex', gap: 24 }}>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 600, color: '#0C447C', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Department</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{selectedEmp.currentDepartmentName || 'N/A'}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 600, color: '#0C447C', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>Position</p>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{selectedEmp.positionName}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label style={labelStyle}>Feedback Type</label>
                  <div style={{ display: 'flex', padding: 3, background: '#F5F6F8', borderRadius: 8, border: '0.5px solid #E4E6EC', gap: 3 }}>
                    {Object.values(FeedbackType).map(type => {
                      const config = feedbackTypeConfig[type];
                      const isActive = newFeedback.feedbackType === type;
                      return (
                        <button key={type} type="button" onClick={() => setNewFeedback({ ...newFeedback, feedbackType: type })}
                          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px 4px', borderRadius: 6, fontSize: 10, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s', ...(isActive ? config.activeStyle : config.inactiveStyle) }}>
                          {config.icon}{config.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Description</label>
                  <textarea required style={{ ...inputStyle, height: 96, resize: 'none', padding: '7px 12px' }}
                    placeholder="Provide specific details about the performance…"
                    value={newFeedback.description} onChange={e => setNewFeedback({ ...newFeedback, description: e.target.value })} />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="checkbox" id="isPrivate" checked={newFeedback.isPrivate}
                    onChange={e => setNewFeedback({ ...newFeedback, isPrivate: e.target.checked })}
                    style={{ width: 14, height: 14 }} />
                  <label htmlFor="isPrivate" style={{ fontSize: 13, color: '#5A6070' }}>Mark as Private (Visible only to Employee and Manager)</label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8 }}>
                  <button type="button" onClick={() => { setShowModal(false); setEditingId(null); setNewFeedback(blankFeedback); }}
                    style={{ padding: '8px 16px', background: '#F5F6F8', color: '#5A6070', border: '0.5px solid #E4E6EC', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button type="submit" disabled={isCreating || isUpdating}
                    style={{ padding: '8px 20px', background: '#111827', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: isCreating || isUpdating ? 'not-allowed' : 'pointer', opacity: isCreating || isUpdating ? 0.6 : 1 }}>
                    {isCreating || isUpdating ? 'Saving…' : editingId ? 'Update Feedback' : 'Submit Feedback'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Tag Modal */}
      {tagToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16 }}>
          <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, width: '100%', maxWidth: 340, padding: 24, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg style={{ width: 22, height: 22, color: '#791F1F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 6 }}>Delete Tag?</h3>
            <p style={{ fontSize: 12, color: '#9EA3B0', marginBottom: 20 }}>Are you sure you want to delete <strong style={{ color: '#111827' }}>"{tags?.find(t => t.tagId === tagToDelete)?.tagName}"</strong>? This may affect historical data.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setTagToDelete(null)} style={{ flex: 1, padding: '9px', background: '#F5F6F8', color: '#5A6070', border: '0.5px solid #E4E6EC', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDeleteTag} style={{ flex: 1, padding: '9px', background: '#791F1F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Feedback Modal */}
      {feedbackToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 16 }}>
          <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, width: '100%', maxWidth: 340, padding: 24, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg style={{ width: 22, height: 22, color: '#791F1F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 6 }}>Delete Feedback?</h3>
            <p style={{ fontSize: 12, color: '#9EA3B0', marginBottom: 20 }}>This action cannot be undone. All replies associated with this feedback will also be removed.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setFeedbackToDelete(null)} style={{ flex: 1, padding: '9px', background: '#F5F6F8', color: '#5A6070', border: '0.5px solid #E4E6EC', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '9px', background: '#791F1F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FeedbackReplies = ({ feedbackId, authorId }: { feedbackId: number; authorId: number }) => {
  const { user } = useAuth();
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; reply: any } | null>(null);

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

  const inputStyle2: React.CSSProperties = {
    background: '#F5F6F8', border: '0.5px solid #E0E2E8', borderRadius: 8,
    padding: '7px 12px', fontSize: 13, color: '#111827', outline: 'none',
    width: '100%', boxSizing: 'border-box', fontFamily: 'inherit',
  };

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
      await replyToFeedback({ feedbackId, body: { replyText: newReply, employeeId: user.id, parentId: replyingToId ?? undefined } }).unwrap();
      setNewReply(""); setReplyingToId(null); setReplyTarget(null);
    } catch (err: any) { toast.error(err.data?.message || "Failed to post reply."); }
  };

  const startReply = (reply: any) => {
    setReplyingToId(reply.replyId);
    setReplyTarget({ id: reply.replyId, name: reply.employeeName, text: reply.replyText });
    setTimeout(() => mainInputRef.current?.focus(), 50);
  };

  const handleDeleteReply = async () => {
    if (!replyToDelete) return;
    try { await deleteReply({ replyId: replyToDelete, feedbackId }).unwrap(); setReplyToDelete(null); }
    catch (err) { console.error("Failed to delete reply", err); }
  };

  const handleUpdateReply = async (replyId: number) => {
    if (!editReplyText.trim() || !user) return;
    try {
      await updateReply({ replyId, feedbackId, body: { replyText: editReplyText, employeeId: user.id } }).unwrap();
      setEditingReplyId(null); setEditReplyText("");
    } catch (err) { console.error("Failed to update reply", err); }
  };

  if (isLoading) return <div style={{ marginTop: 12, fontSize: 11, color: '#9EA3B0' }}>Loading discussion…</div>;

  const sortedReplies = [...(replies || [])].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return (
    <div style={{ marginTop: 14, paddingTop: 14, borderTop: '0.5px solid #E4E6EC' }} className="space-y-4">
      <div className="space-y-3">
        {sortedReplies.map((reply, index) => {
          const currentDate = reply.createdAt ? format(new Date(reply.createdAt), 'yyyy-MM-dd') : '';
          const prevDate = index > 0 && sortedReplies[index - 1].createdAt ? format(new Date(sortedReplies[index - 1].createdAt), 'yyyy-MM-dd') : '';
          const isNewDay = currentDate !== prevDate;
          return (
            <React.Fragment key={reply.replyId}>
              {isNewDay && (
                <div style={{ display: 'flex', justifyContent: 'center', margin: '10px 0' }}>
                  <span style={{ background: '#F5F6F8', border: '0.5px solid #E4E6EC', borderRadius: 20, padding: '3px 10px', fontSize: 10, fontWeight: 500, color: '#9EA3B0' }}>
                    {format(new Date(reply.createdAt), 'dd/MM/yyyy')}
                  </span>
                </div>
              )}
              <ReplyItem reply={reply} allReplies={sortedReplies} user={user} authorId={authorId}
                highlightedReplyId={highlightedReplyId} editingReplyId={editingReplyId}
                editReplyText={editReplyText} setEditReplyText={setEditReplyText}
                setEditingReplyId={setEditingReplyId} handleUpdateReply={handleUpdateReply}
                handleScrollToParent={handleScrollToParent} onContextMenu={handleContextMenu}
                isUpdatingReply={isUpdatingReply} />
            </React.Fragment>
          );
        })}
      </div>

      {contextMenu && (
        <div style={{ position: 'fixed', zIndex: 1000, width: 176, background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 8, padding: '4px 0', top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}>
          <button onClick={() => { startReply(contextMenu.reply); setContextMenu(null); }}
            style={{ width: '100%', padding: '8px 14px', textAlign: 'left', fontSize: 13, color: '#111827', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
            className="hover:bg-[#F5F6F8] transition-colors">
            <svg style={{ width: 14, height: 14, color: '#1A56DB' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
            Reply
          </button>
          <button onClick={() => { navigator.clipboard.writeText(contextMenu.reply.replyText); setContextMenu(null); }}
            style={{ width: '100%', padding: '8px 14px', textAlign: 'left', fontSize: 13, color: '#111827', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
            className="hover:bg-[#F5F6F8] transition-colors">
            <svg style={{ width: 14, height: 14, color: '#9EA3B0' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" /></svg>
            Copy Text
          </button>
          {contextMenu.reply.employeeId === user?.id && (
            <>
              <div style={{ height: '0.5px', background: '#E4E6EC', margin: '2px 0' }} />
              <button onClick={() => { setEditingReplyId(contextMenu.reply.replyId); setEditReplyText(contextMenu.reply.replyText); setContextMenu(null); }}
                style={{ width: '100%', padding: '8px 14px', textAlign: 'left', fontSize: 13, color: '#111827', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                className="hover:bg-[#F5F6F8] transition-colors">
                <svg style={{ width: 14, height: 14, color: '#1A56DB' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                Edit
              </button>
              <button onClick={() => { setReplyToDelete(contextMenu.reply.replyId); setContextMenu(null); }}
                style={{ width: '100%', padding: '8px 14px', textAlign: 'left', fontSize: 13, color: '#791F1F', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                className="hover:bg-[#FCEBEB] transition-colors">
                <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Delete
              </button>
            </>
          )}
        </div>
      )}

      {/* Reply input */}
      <div style={{ borderTop: '0.5px solid #E4E6EC', paddingTop: 12 }}>
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
        <form onSubmit={handleReply} style={{ display: 'flex', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 6, background: '#EEF3FD', color: '#1A56DB', border: '0.5px solid #B5D4F4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
            {user?.staffName?.charAt(0) || '?'}
          </div>
          <div style={{ flex: 1, display: 'flex', gap: 6 }}>
            <input ref={mainInputRef} style={{ ...inputStyle2, flex: 1 }}
              placeholder={replyTarget ? `Replying to ${replyTarget.name}…` : 'Add to the conversation…'}
              value={newReply} onChange={(e) => setNewReply(e.target.value)} />
            <button type="submit" disabled={isReplying || !newReply.trim()}
              style={{ padding: '7px 10px', background: '#1A56DB', color: '#FFFFFF', border: 'none', borderRadius: 8, cursor: isReplying || !newReply.trim() ? 'not-allowed' : 'pointer', opacity: isReplying || !newReply.trim() ? 0.5 : 1, display: 'flex', alignItems: 'center' }}>
              <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </form>
      </div>

      {/* Delete Reply Modal */}
      {replyToDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16 }}>
          <div style={{ background: '#FFFFFF', border: '0.5px solid #E4E6EC', borderRadius: 12, width: '100%', maxWidth: 340, padding: 24, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: '#FCEBEB', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <svg style={{ width: 22, height: 22, color: '#791F1F' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#111827', marginBottom: 6 }}>Delete Message?</h3>
            <p style={{ fontSize: 12, color: '#9EA3B0', marginBottom: 20 }}>This will permanently remove your contribution from this thread.</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setReplyToDelete(null)} style={{ flex: 1, padding: '9px', background: '#F5F6F8', color: '#5A6070', border: '0.5px solid #E4E6EC', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Cancel</button>
              <button onClick={handleDeleteReply} style={{ flex: 1, padding: '9px', background: '#791F1F', color: '#FFFFFF', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackPage;
