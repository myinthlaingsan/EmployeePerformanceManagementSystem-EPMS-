import { useState, useEffect } from "react";
import { useGetCurrentUserQuery, useUpdateProfileMutation, useChangePasswordMutation } from "../features/employee/employeeapi";
import { useAuth } from "../hooks/useAuth";
const ProfilePage = () => {
  const { user: authUser } = useAuth();
  const { data: profile, isLoading } = useGetCurrentUserQuery();
  const [updateProfile] = useUpdateProfileMutation();
  const [changePassword] = useChangePasswordMutation();

  const [formData, setFormData] = useState({
    staffName: "",
    email: "",
    phoneNo: "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        staffName: profile.staffName,
        email: profile.email,
        phoneNo: profile.phoneNo,
      });
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    try {
      await updateProfile({ id: profile.id, body: formData }).unwrap();
      alert("Profile updated successfully!");
    } catch (err) {
      console.error("Update profile failed", err);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }
    try {
      await changePassword({ id: profile.id, body: passwordData }).unwrap();
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      alert("Password changed successfully!");
    } catch (err) {
      console.error("Change password failed", err);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading profile...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center space-x-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl">
          {profile?.staffName.charAt(0)}
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{profile?.staffName}</h1>
          <p className="text-blue-600 font-bold tracking-widest text-xs uppercase mt-1">
            {profile?.positionName} • {profile?.departmentName}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Personal Information
            </h2>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Full Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.staffName}
                    onChange={(e) => setFormData({ ...formData, staffName: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Phone</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={formData.phoneNo}
                    onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })}
                  />
                </div>
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  className="px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </section>

          <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Security Settings
            </h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Old Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                  value={passwordData.oldPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">New Password</label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  />
                </div>
              </div>
              <div className="pt-4">
                <button
                  type="submit"
                  className="px-8 py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-black transition shadow-lg shadow-gray-200"
                >
                  Change Password
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Sidebar Stats / Info */}
        <div className="space-y-8">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl">
            <h3 className="font-bold text-lg mb-4">Organizational Info</h3>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Employee Code</p>
                <p className="font-mono text-sm">{profile?.employeeCode}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Job Level</p>
                <p className="font-bold">{profile?.levelName} (Rank {profile?.levelRank})</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-blue-200 uppercase tracking-widest">Roles</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {profile?.roles.map(r => (
                    <span key={r} className="px-2 py-0.5 bg-blue-500/30 rounded text-[9px] font-bold uppercase">{r.replace('ROLE_', '')}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">System Permissions</h3>
            <div className="space-y-2">
              {profile?.permissions.map(p => (
                <div key={p} className="flex items-center gap-2 text-xs text-gray-600">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  {p}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
