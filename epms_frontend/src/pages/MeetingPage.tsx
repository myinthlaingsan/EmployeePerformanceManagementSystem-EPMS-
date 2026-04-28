import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import {
  useGetAllMeetingsQuery,
  useScheduleMeetingMutation
} from "../features/continuous/continuousApi";
import { useGetEmployeesQuery } from "../features/employee/employeeapi";
import { format } from "date-fns";

const MeetingPage = () => {
  const { user, isManager, isAdmin, isHR } = useAuth();
  const canSchedule = isManager || isAdmin || isHR;

  const { data: meetings, isLoading } = useGetAllMeetingsQuery(undefined, { skip: !user });
  const { data: employees } = useGetEmployeesQuery();
  const [scheduleMeeting, { isLoading: isScheduling }] = useScheduleMeetingMutation();

  const filteredEmployees = (isAdmin || isHR)
    ? employees
    : employees?.filter(emp => 
        emp.currentDepartmentId === user?.currentDepartmentId && 
        emp.id !== user?.id
      );

  const [showModal, setShowModal] = useState(false);
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

  const selectedEmp = employees?.find(e => e.id === newMeeting.employeeId);

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMeeting.employeeId) return;
    try {
      await scheduleMeeting({
        ...newMeeting,
        managerId: user.id,
      }).unwrap();
      setShowModal(false);
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
    } catch (err) {
      console.error("Failed to schedule meeting", err);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading Meetings...</div>;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">1-on-1 Meetings</h1>
          <p className="text-gray-500">Track and manage your performance sync-ups.</p>
        </div>
        {canSchedule && (
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-200 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Schedule Meeting
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {meetings?.map((meeting) => (
          <div key={meeting.meetingId} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition group">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">
                    {meeting.managerName}
                    {meeting.employeeId !== user?.id && <span className="text-gray-400 font-normal ml-1 text-sm">with {meeting.employeeName}</span>}
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mt-1">
                    <p>{format(new Date(meeting.meetingDate), 'MMM d, yyyy')}</p>
                    <p>{meeting.meetingTime}</p>
                    {meeting.isPrivateNote && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" /></svg>
                        Private
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Manager to Employee</p>
                <p className="font-bold text-indigo-600">{meeting.managerName}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Discussion Points</h4>
                <p className="text-sm text-gray-600 line-clamp-2">{meeting.discussionPoints}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
                <div>
                  <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Action Items</h4>
                  <p className="text-xs text-gray-500">{meeting.actionItems || 'None'}</p>
                </div>
                {meeting.followUpDate && (
                  <div>
                    <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1">Follow-up</h4>
                    <p className="text-xs text-gray-500">{format(new Date(meeting.followUpDate), 'MMM d, yyyy')}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Schedule Meeting Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Schedule 1-on-1 Meeting</h2>
              <form onSubmit={handleSchedule} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Select Employee</label>
                  <select
                    required
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition"
                    value={newMeeting.employeeId}
                    onChange={e => setNewMeeting({ ...newMeeting, employeeId: Number(e.target.value) })}
                  >
                    <option value="">Choose Staff Member</option>
                    {filteredEmployees?.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.staffName}</option>
                    ))}
                  </select>
                </div>

                {selectedEmp && (
                  <div className="flex gap-4 p-4 bg-indigo-50 rounded-2xl animate-in fade-in slide-in-from-top-2">
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Department</p>
                      <p className="text-sm font-bold text-indigo-900">{selectedEmp.currentDepartmentName || 'N/A'}</p>
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Position</p>
                      <p className="text-sm font-bold text-indigo-900">{selectedEmp.positionName}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Meeting Date</label>
                    <input
                      type="date"
                      required
                      className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-xs"
                      value={newMeeting.meetingDate}
                      onChange={e => setNewMeeting({ ...newMeeting, meetingDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Meeting Time</label>
                    <input
                      type="time"
                      required
                      className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-xs"
                      value={newMeeting.meetingTime}
                      onChange={e => setNewMeeting({ ...newMeeting, meetingTime: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Follow-up</label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition text-xs"
                      value={newMeeting.followUpDate}
                      onChange={e => setNewMeeting({ ...newMeeting, followUpDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Discussion Points</label>
                  <textarea 
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
                      className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition h-12 resize-none text-sm"
                      value={newMeeting.keyIssues}
                      onChange={e => setNewMeeting({ ...newMeeting, keyIssues: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Action Items</label>
                    <textarea 
                      className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition h-12 resize-none text-sm"
                      value={newMeeting.actionItems}
                      onChange={e => setNewMeeting({ ...newMeeting, actionItems: e.target.value })}
                    />
                  </div>
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
                    onClick={() => setShowModal(false)}
                    className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isScheduling}
                    className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 disabled:opacity-50"
                  >
                    {isScheduling ? "Scheduling..." : "Schedule Now"}
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

export default MeetingPage;
