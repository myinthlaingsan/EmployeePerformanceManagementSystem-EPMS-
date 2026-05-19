import React, { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';
import { format, parseISO, isAfter } from 'date-fns';
import {
  ClipboardList, CheckCircle2, Clock, AlertCircle, Star,
  X, Loader2, Save, Calendar,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import {
  useGetMyFeedbackRequestsQuery,
  useGetFormQuestionsQuery,
  useSubmitFeedbackMutation,
  useSaveFeedbackDraftMutation,
  useGetFeedbackDraftQuery,
  useGetSubmittedFeedbackByRequestQuery,
} from '../../features/feedback360/feedback360Api';
import type {
  FeedbackRequestResponse,
  FeedbackResponseRequest,
  CategoryDTO,
} from '../../features/feedback360/feedback360Types';
import { FeedbackRelationship, FeedbackStatus } from '../../features/feedback360/feedback360Types';

// ── Style constants ────────────────────────────────────────────────────────────

const panel: React.CSSProperties = {
  background: '#FFFFFF',
  border: '0.5px solid #E4E6EC',
  borderRadius: 12,
  padding: '16px 18px',
};

const REL_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  DIRECT_MANAGER: { label: 'Manager',     bg: '#EEF3FD', text: '#1A56DB', border: '#BFCFFA' },
  PEER:           { label: 'Peer',        bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' },
  SUBORDINATE:    { label: 'Subordinate', bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' },
  SELF:           { label: 'Self',        bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' },
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  PENDING:     { label: 'Pending',     bg: '#FAEEDA', text: '#633806' },
  IN_PROGRESS: { label: 'In Progress', bg: '#EEF3FD', text: '#1A56DB' },
  COMPLETED:   { label: 'Completed',   bg: '#EAF3DE', text: '#27500A' },
  CANCELLED:   { label: 'Cancelled',   bg: '#FCEBEB', text: '#791F1F' },
};

type FilterTab = 'ALL' | 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';

// ── Helpers ────────────────────────────────────────────────────────────────────

function isOverdue(req: FeedbackRequestResponse): boolean {
  if (req.isOverdue) return true;
  if (!req.dueDate || req.status === FeedbackStatus.COMPLETED || req.status === FeedbackStatus.CANCELLED) return false;
  return isAfter(new Date(), parseISO(req.dueDate));
}

function sortRequests(list: FeedbackRequestResponse[]): FeedbackRequestResponse[] {
  return [...list].sort((a, b) => {
    // Overdue first
    const aOD = isOverdue(a) ? 0 : 1;
    const bOD = isOverdue(b) ? 0 : 1;
    if (aOD !== bOD) return aOD - bOD;
    // Then by due date ascending (nulls last)
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });
}

// ── Sub-components ─────────────────────────────────────────────────────────────

const RelBadge = ({ rel }: { rel: string }) => {
  const cfg = REL_CONFIG[rel] ?? { label: rel, bg: '#F5F6F8', text: '#5A6070', border: '#E4E6EC' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
      background: cfg.bg, color: cfg.text, border: `0.5px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] ?? { label: status, bg: '#F5F6F8', text: '#5A6070' };
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
      background: cfg.bg, color: cfg.text,
    }}>
      {cfg.label}
    </span>
  );
};

const OverduePill = () => (
  <span style={{
    fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20,
    background: '#FCEBEB', color: '#791F1F', border: '0.5px solid #F5C6C6',
    textTransform: 'uppercase', letterSpacing: '0.04em',
  }}>
    Overdue
  </span>
);

// ── StarRating with keyboard support ──────────────────────────────────────────

interface StarRatingProps {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
  questionId: number;
}

const StarRating = ({ value, onChange, disabled, questionId }: StarRatingProps) => (
  <div
    role="radiogroup"
    aria-label="Rating 1 to 5"
    style={{ display: 'flex', gap: 4 }}
    onKeyDown={(e) => {
      if (disabled) return;
      if (e.key === 'ArrowRight' && value < 5) onChange(value + 1);
      if (e.key === 'ArrowLeft' && value > 1) onChange(value - 1);
    }}
  >
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        role="radio"
        aria-checked={value === n}
        aria-label={`${n} star${n !== 1 ? 's' : ''}`}
        tabIndex={value === n ? 0 : -1}
        disabled={disabled}
        onClick={() => !disabled && onChange(n)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!disabled) onChange(n); } }}
        style={{
          background: 'none', border: 'none', cursor: disabled ? 'default' : 'pointer', padding: 2,
        }}
      >
        <Star
          size={20}
          fill={n <= value ? '#F59E0B' : 'none'}
          color={n <= value ? '#F59E0B' : '#D1D5DB'}
        />
      </button>
    ))}
  </div>
);

// ── Submission Modal ───────────────────────────────────────────────────────────

interface SubmissionModalProps {
  request: FeedbackRequestResponse;
  onClose: () => void;
}

const SubmissionModal = ({ request, onClose }: SubmissionModalProps) => {
  const [answers, setAnswers] = useState<Record<number, FeedbackResponseRequest>>({});
  const [overallComment, setOverallComment] = useState('');
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [requiredErrors, setRequiredErrors] = useState<Set<number>>(new Set());
  const dirtyRef = useRef(false);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: form, isLoading: formLoading, error: formError } = useGetFormQuestionsQuery(request.id);
  const { data: draft, isLoading: draftLoading } = useGetFeedbackDraftQuery(request.id, {
    skip: request.status !== FeedbackStatus.IN_PROGRESS,
  });
  const { data: completedData, isLoading: completedLoading } = useGetSubmittedFeedbackByRequestQuery(request.id, {
    skip: request.status !== FeedbackStatus.COMPLETED,
  });
  const [submitFeedback, { isLoading: submitting }] = useSubmitFeedbackMutation();
  const [saveDraft, { isLoading: saving }] = useSaveFeedbackDraftMutation();

  // Pre-populate from draft when loaded
  useEffect(() => {
    if (!draft) return;
    const map: Record<number, FeedbackResponseRequest> = {};
    draft.responses.forEach((r) => { map[r.questionId] = r; });
    setAnswers(map);
    setOverallComment(draft.overallComment ?? '');
    dirtyRef.current = false;
  }, [draft]);

  // Pre-populate from completed submission when loaded
  useEffect(() => {
    if (!completedData) return;
    const map: Record<number, FeedbackResponseRequest> = {};
    completedData.responses.forEach((r) => {
      map[r.questionId] = {
        questionId: r.questionId,
        score: r.score,
        comment: r.comment,
      };
    });
    setAnswers(map);
    setOverallComment(completedData.overallComment ?? '');
    dirtyRef.current = false;
  }, [completedData]);

  const doSaveDraft = useCallback(async (silent = false) => {
    if (!dirtyRef.current) return;
    const responses = Object.values(answers);
    try {
      await saveDraft({ requestId: request.id, overallComment, responses }).unwrap();
      setSavedAt(format(new Date(), 'HH:mm'));
      dirtyRef.current = false;
      if (!silent) toast.success('Draft saved.');
    } catch {
      if (!silent) toast.error('Failed to save draft.');
    }
  }, [answers, overallComment, request.id, saveDraft]);

  // Debounced autosave (5 s after input stops)
  useEffect(() => {
    if (!dirtyRef.current) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => doSaveDraft(true), 5000);
    return () => { if (autosaveTimer.current) clearTimeout(autosaveTimer.current); };
  }, [answers, overallComment, doSaveDraft]);

  // Save draft on modal close if dirty
  useEffect(() => {
    return () => {
      if (dirtyRef.current) doSaveDraft(true);
    };
  }, [doSaveDraft]);

  const setAnswer = (questionId: number, patch: Partial<FeedbackResponseRequest>) => {
    dirtyRef.current = true;
    setAnswers((prev) => ({ ...prev, [questionId]: { ...prev[questionId], ...patch, questionId } }));
  };

  const allRequiredAnswered = (): { ok: boolean; firstMissing: number | null } => {
    if (!form) return { ok: true, firstMissing: null };
    for (const cat of form.categories) {
      for (const q of cat.questions) {
        if (!q.isRequired) continue;
        const a = answers[q.questionId];
        const needsRating  = q.questionType === 'RATING' || q.secondaryQuestionType === 'RATING';
        const needsComment = q.questionType === 'TEXT'   || q.secondaryQuestionType === 'TEXT';
        if (needsRating  && !a?.score)         return { ok: false, firstMissing: q.questionId };
        if (needsComment && !a?.comment?.trim()) return { ok: false, firstMissing: q.questionId };
      }
    }
    return { ok: true, firstMissing: null };
  };

  const handleSubmit = async () => {
    const { ok, firstMissing } = allRequiredAnswered();
    if (!ok) {
      setRequiredErrors(new Set(
        form?.categories.flatMap((c) =>
          c.questions.filter((q) => {
            if (!q.isRequired) return false;
            const a = answers[q.questionId];
            const missingRating  = (q.questionType === 'RATING' || q.secondaryQuestionType === 'RATING') && !a?.score;
            const missingComment = (q.questionType === 'TEXT'   || q.secondaryQuestionType === 'TEXT')   && !a?.comment?.trim();
            return missingRating || missingComment;
          }).map((q) => q.questionId),
        ) ?? [],
      ));
      if (firstMissing) {
        document.getElementById(`q-${firstMissing}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      toast.error('Please answer all required questions.');
      return;
    }
    const responses = Object.values(answers);
    try {
      await submitFeedback({ requestId: request.id, overallComment, responses }).unwrap();
      toast.success('Feedback submitted!');
      dirtyRef.current = false;
      onClose();
    } catch (err: any) {
      const msg = err?.data?.message ?? 'Submission failed.';
      toast.error(msg);
    }
  };

  const isResume = request.status === FeedbackStatus.IN_PROGRESS;
  const isCompleted = request.status === FeedbackStatus.COMPLETED;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        overflowY: 'auto', padding: '40px 16px',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: '#FFFFFF', borderRadius: 14, width: '100%', maxWidth: 640,
        border: '0.5px solid #E4E6EC', boxShadow: '0 12px 40px rgba(0,0,0,0.14)',
      }}>
        {/* Modal header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px', borderBottom: '0.5px solid #E4E6EC',
        }}>
          <div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#111827', margin: 0 }}>
              {isCompleted ? 'View Submitted Feedback' : isResume ? 'Resume Draft' : 'Submit Feedback'}
            </p>
            <p style={{ fontSize: 12, color: '#9EA3B0', margin: '2px 0 0' }}>
              For <strong>{request.targetUserName}</strong> · <span style={{ textTransform: 'capitalize' }}>
                {REL_CONFIG[request.relationship]?.label ?? request.relationship}
              </span>
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {savedAt && (
              <span style={{ fontSize: 11, color: '#9EA3B0' }}>Saved at {savedAt}</span>
            )}
            {saving && <Loader2 size={13} style={{ animation: 'spin 1s linear infinite', color: '#9EA3B0' }} />}
            <button
              onClick={onClose}
              aria-label="Close modal"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9EA3B0', padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 20px 0' }}>
          {(formLoading || draftLoading || completedLoading) ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9EA3B0', padding: '24px 0' }}>
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
              <span style={{ fontSize: 14 }}>Loading…</span>
            </div>
          ) : formError || !form ? (
            <div style={{ padding: '12px 0' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: '#791F1F', margin: '0 0 6px' }}>
                Could not load form questions.
              </p>
              <p style={{ fontSize: 12, color: '#5A6070', margin: 0 }}>
                {(formError as any)?.data?.message
                  ?? (formError as any)?.error
                  ?? 'No form is assigned to this request. Ask HR to create a FEEDBACK form for this cycle and regenerate requests.'}
              </p>
            </div>
          ) : (
            form.categories.map((cat: CategoryDTO) => (
              <div key={cat.categoryId} style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#5A6070', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {cat.categoryName}
                </p>
                {cat.questions.map((q) => {
                  const ans = answers[q.questionId];
                  const hasError = requiredErrors.has(q.questionId);
                  return (
                    <div
                      key={q.questionId}
                      id={`q-${q.questionId}`}
                      style={{
                        marginBottom: 16, padding: '12px 14px', borderRadius: 8,
                        background: hasError ? '#FFF5F5' : '#FAFBFC',
                        border: `0.5px solid ${hasError ? '#F5C6C6' : '#E4E6EC'}`,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                        <p style={{ fontSize: 13, color: '#111827', margin: 0, lineHeight: 1.5 }}>
                          {q.questionText}
                          {q.isRequired && <span style={{ color: '#EF4444', marginLeft: 3 }}>*</span>}
                        </p>
                        {hasError && <AlertCircle size={15} color="#EF4444" style={{ flexShrink: 0, marginTop: 2 }} />}
                      </div>

                      {(q.questionType === 'RATING' || q.secondaryQuestionType === 'RATING') && (
                        <StarRating
                          questionId={q.questionId}
                          value={ans?.score ?? 0}
                          disabled={isCompleted}
                          onChange={(v) => { setAnswer(q.questionId, { score: v }); setRequiredErrors((prev) => { const s = new Set(prev); s.delete(q.questionId); return s; }); }}
                        />
                      )}
                      {(q.questionType === 'TEXT' || q.secondaryQuestionType === 'TEXT') && (
                        <textarea
                          placeholder={q.isRequired ? 'Your comment (required)' : 'Your comment (optional)'}
                          value={ans?.comment ?? ''}
                          disabled={isCompleted}
                          onChange={(e) => setAnswer(q.questionId, { comment: e.target.value })}
                          rows={3}
                          style={{
                            width: '100%', fontSize: 13, color: '#111827', background: isCompleted ? '#F5F6F8' : '#FFFFFF',
                            border: '0.5px solid #E4E6EC', borderRadius: 6, padding: '8px 10px',
                            outline: 'none', resize: 'vertical', marginTop: 6, boxSizing: 'border-box',
                          }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            ))
          )}

          {/* Overall comment */}
          {form && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 12, fontWeight: 500, color: '#5A6070', marginBottom: 6 }}>Overall Comment (optional)</p>
              <textarea
                value={overallComment}
                disabled={isCompleted}
                onChange={(e) => { if (!isCompleted) { setOverallComment(e.target.value); dirtyRef.current = true; } }}
                rows={3}
                placeholder="Any additional thoughts…"
                style={{
                  width: '100%', fontSize: 13, color: '#111827', background: isCompleted ? '#F5F6F8' : '#FAFBFC',
                  border: '0.5px solid #E4E6EC', borderRadius: 8, padding: '10px 12px',
                  outline: 'none', resize: 'vertical', boxSizing: 'border-box',
                }}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
          padding: '14px 20px', borderTop: '0.5px solid #E4E6EC',
        }}>
          {isCompleted ? (
            <button
              onClick={onClose}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                fontSize: 13, fontWeight: 500, color: '#FFFFFF',
                background: '#1A56DB', border: 'none',
                borderRadius: 8, padding: '7px 16px', cursor: 'pointer',
              }}
            >
              Close
            </button>
          ) : (
            <>
              <button
                onClick={() => doSaveDraft(false)}
                disabled={saving}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 500, color: '#1A56DB',
                  background: '#EEF3FD', border: '0.5px solid #BFCFFA',
                  borderRadius: 8, padding: '7px 14px', cursor: saving ? 'not-allowed' : 'pointer',
                }}
              >
                {saving ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={13} />}
                Save Draft
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || formLoading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 13, fontWeight: 500, color: '#FFFFFF',
                  background: submitting ? '#93A8E8' : '#1A56DB', border: 'none',
                  borderRadius: 8, padding: '7px 16px', cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle2 size={13} />}
                {submitting ? 'Submitting…' : 'Submit'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Request card ───────────────────────────────────────────────────────────────

const RequestCard = ({ req, onOpen }: { req: FeedbackRequestResponse; onOpen: () => void }) => {
  const overdue = isOverdue(req);
  const isCancelled = req.status === FeedbackStatus.CANCELLED;
  const isCompleted = req.status === FeedbackStatus.COMPLETED;

  return (
    <div style={{ ...panel, display: 'flex', flexDirection: 'column', gap: 10, position: 'relative' }}>
      {req.isReciprocalFallback && (
        <div style={{
          position: 'absolute', top: 0, right: 0, fontSize: 10, fontWeight: 600,
          background: '#FAEEDA', color: '#633806', padding: '2px 10px',
          borderRadius: '0 12px 0 8px',
        }}>
          Reciprocal Fallback
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <RelBadge rel={req.relationship} />
        <StatusBadge status={req.status} />
        {overdue && <OverduePill />}
      </div>

      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#111827', margin: 0 }}>{req.targetUserName}</p>
        {req.targetDepartmentName && (
          <p style={{ fontSize: 12, color: '#9EA3B0', margin: '2px 0 0' }}>{req.targetDepartmentName}</p>
        )}
      </div>

      {req.dueDate && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <Calendar size={12} color={overdue ? '#791F1F' : '#9EA3B0'} />
          <span style={{ fontSize: 12, color: overdue ? '#791F1F' : '#9EA3B0' }}>
            Due {format(parseISO(req.dueDate), 'dd MMM yyyy')}
          </span>
        </div>
      )}

      {isCancelled ? (
        <p style={{ fontSize: 12, color: '#9EA3B0', fontStyle: 'italic', margin: 0 }}>Cancelled by HR</p>
      ) : (
        <button
          onClick={onOpen}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 500,
            color: isCompleted ? '#1A56DB' : '#FFFFFF',
            background: isCompleted ? '#EEF3FD' : '#1A56DB',
            border: isCompleted ? '0.5px solid #BFCFFA' : 'none',
            borderRadius: 8, padding: '7px 14px',
            cursor: 'pointer', alignSelf: 'flex-start',
          }}
        >
          {isCompleted ? <CheckCircle2 size={13} /> : <Clock size={13} />}
          {isCompleted ? 'View Submission' : req.status === FeedbackStatus.IN_PROGRESS ? 'Resume Draft' : 'Submit Feedback'}
        </button>
      )}
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────────

const TABS: { key: FilterTab; label: string; icon: React.ElementType }[] = [
  { key: 'ALL',         label: 'All',         icon: ClipboardList },
  { key: 'PENDING',     label: 'Pending',     icon: Clock },
  { key: 'IN_PROGRESS', label: 'In Progress', icon: AlertCircle },
  { key: 'COMPLETED',   label: 'Completed',   icon: CheckCircle2 },
];

const Feedback360PendingPage = () => {
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [openRequest, setOpenRequest] = useState<FeedbackRequestResponse | null>(null);

  const { data: requests = [], isLoading, isError } = useGetMyFeedbackRequestsQuery();

  const filtered = sortRequests(
    activeTab === 'ALL' ? requests : requests.filter((r) => r.status === activeTab),
  );

  return (
    <div style={{ padding: 24 }}>
      {/* Page header */}
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: 0 }}>
          My 360° Feedback Requests
        </h1>
        <p style={{ fontSize: 13, color: '#9EA3B0', marginTop: 4 }}>
          Feedback you have been asked to provide for colleagues.
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 20,
        background: '#F5F6F8', borderRadius: 10, padding: 4, width: 'fit-content',
      }}>
        {TABS.map(({ key, label, icon: Icon }) => {
          const count = key === 'ALL' ? requests.length : requests.filter((r) => r.status === key).length;
          const active = activeTab === key;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: active ? 600 : 400,
                color: active ? '#1A56DB' : '#5A6070',
                background: active ? '#FFFFFF' : 'transparent',
                border: 'none', borderRadius: 8, padding: '6px 12px',
                cursor: 'pointer',
                boxShadow: active ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Icon size={13} />
              {label}
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: active ? '#EEF3FD' : '#E4E6EC',
                color: active ? '#1A56DB' : '#9EA3B0',
                borderRadius: 20, padding: '1px 6px',
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#9EA3B0' }}>
          <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
          <span style={{ fontSize: 14 }}>Loading requests…</span>
        </div>
      ) : isError ? (
        <div style={{ ...panel, display: 'flex', alignItems: 'center', gap: 10, color: '#791F1F' }}>
          <AlertCircle size={16} />
          <span style={{ fontSize: 14 }}>Failed to load feedback requests.</span>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...panel, textAlign: 'center', padding: '40px 0', color: '#9EA3B0' }}>
          <ClipboardList size={36} style={{ marginBottom: 10, opacity: 0.4 }} />
          <p style={{ fontSize: 14, margin: 0 }}>No {activeTab !== 'ALL' ? activeTab.toLowerCase().replace('_', ' ') + ' ' : ''}requests found.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {filtered.map((req) => (
            <RequestCard key={req.id} req={req} onOpen={() => setOpenRequest(req)} />
          ))}
        </div>
      )}

      {openRequest && (
        <SubmissionModal request={openRequest} onClose={() => setOpenRequest(null)} />
      )}
    </div>
  );
};

export default Feedback360PendingPage;
