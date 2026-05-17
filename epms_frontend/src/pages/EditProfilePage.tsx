import { useState, useEffect } from "react";
import { useGetCurrentUserQuery, useUpdateProfileMutation, useChangePasswordMutation, useGetManagerQuery, useGetDirectReportsQuery, useUploadProfileImageMutation } from "../features/employee/employeeapi";
import { toast } from "react-toastify";
import type { UpdateProfileRequest, MaritalStatus } from "../features/employee/employeeTypes";
import { User, Lock, Building2 } from "lucide-react";

const AVATAR_COLORS = [
  { bg: "#EEF3FD", text: "#0C447C" },
  { bg: "#EAF3DE", text: "#27500A" },
  { bg: "#FAEEDA", text: "#633806" },
  { bg: "#F1EFE8", text: "#444441" },
  { bg: "#FCEBEB", text: "#791F1F" },
];

const inputStyle: React.CSSProperties = {
  background: "#F5F6F8", border: "0.5px solid #E0E2E8", borderRadius: 8,
  padding: "7px 12px", fontSize: 13, color: "#111827", fontFamily: "inherit", outline: "none", width: "100%",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 500, color: "#9EA3B0",
  textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5,
};

const panelStyle: React.CSSProperties = {
  background: "#FFFFFF", border: "0.5px solid #E4E6EC", borderRadius: 12, padding: "16px 18px",
};

const EditProfilePage = () => {
  const { data: profile, isLoading } = useGetCurrentUserQuery();
  const [updateProfile] = useUpdateProfileMutation();
  const [changePassword] = useChangePasswordMutation();
  const { data: manager } = useGetManagerQuery(profile?.id ?? 0, { skip: !profile?.id });
  const { data: directReports } = useGetDirectReportsQuery(profile?.id ?? 0, { skip: !profile?.id });
  const [uploadProfileImage] = useUploadProfileImageMutation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());
  const [fileInputKey, setFileInputKey] = useState(0);

  const [formData, setFormData] = useState<UpdateProfileRequest>({
    staffName: "", otherName: "", email: "", phoneNo: "",
    contactAddress: "", permanentAddress: "", maritalStatus: undefined,
    spouseName: "", fatherName: "",
  });

  const [passwordData, setPasswordData] = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });

  useEffect(() => {
    if (profile) {
      setFormData({
        staffName: profile.staffName || "",
        otherName: (profile as any).otherName || "",
        email: profile.email || "",
        phoneNo: profile.phoneNo || "",
        contactAddress: (profile as any).contactAddress || "",
        permanentAddress: (profile as any).permanentAddress || "",
        maritalStatus: (profile as any).maritalStatus || undefined,
        spouseName: (profile as any).spouseName || "",
        fatherName: (profile as any).fatherName || "",
      });
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(formData).unwrap();
      if (selectedFile && profile?.id) {
        await uploadProfileImage({ id: profile.id, file: selectedFile }).unwrap();
        setImageTimestamp(Date.now());
        setSelectedFile(null);
        setFileInputKey(prev => prev + 1);
      }
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error("Failed to update profile.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.id) return;
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.warning("Passwords do not match!");
      return;
    }
    try {
      await changePassword({ id: profile.id, body: passwordData }).unwrap();
      setPasswordData({ oldPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed successfully!");
    } catch (err) {
      toast.error("Failed to change password.");
    }
  };

  if (isLoading) return <div className="py-16 text-center" style={{ color: "#9EA3B0", fontSize: 13 }}>Loading profile…</div>;

  const avatarColor = AVATAR_COLORS[(profile?.staffName?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

  return (
    <div className="space-y-4 pb-8">
      {/* Profile header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4" style={panelStyle}>
        <div style={{ width: 56, height: 56, borderRadius: "50%", background: avatarColor.bg, color: avatarColor.text, fontSize: 20, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
          {profile?.profileImage && profile.profileImage !== "default.jpg" ? (
            <img src={`http://localhost:8080${profile.profileImage}?t=${imageTimestamp}`} alt={profile.staffName} className="w-full h-full object-cover"
              onError={(e) => { e.currentTarget.style.display = "none"; }} />
          ) : profile?.staffName.charAt(0)}
        </div>
        <div>
          <h1 style={{ fontSize: 18, fontWeight: 500, color: "#111827" }}>{profile?.staffName}</h1>
          <p style={{ fontSize: 12, color: "#1A56DB", marginTop: 2 }}>{profile?.positionName} · {profile?.currentDepartmentName}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: personal info + security */}
        <div className="lg:col-span-2 space-y-4">
          {/* Personal information */}
          <div style={panelStyle}>
            <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
              <User size={15} style={{ color: "#1A56DB" }} aria-hidden="true" />
              <p style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>Personal information</p>
            </div>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>Full name</label>
                  <input style={inputStyle} type="text" value={formData.staffName} onChange={(e) => setFormData({ ...formData, staffName: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Other name</label>
                  <input style={inputStyle} type="text" value={formData.otherName || ""} onChange={(e) => setFormData({ ...formData, otherName: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Email</label>
                  <input style={inputStyle} type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Phone</label>
                  <input style={inputStyle} type="text" value={formData.phoneNo} onChange={(e) => setFormData({ ...formData, phoneNo: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Father's name</label>
                  <input style={inputStyle} type="text" value={formData.fatherName || ""} onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Marital status</label>
                  <select style={inputStyle} value={formData.maritalStatus || ""} onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value as MaritalStatus })}>
                    <option value="">Select</option>
                    <option value="SINGLE">Single</option>
                    <option value="MARRIED">Married</option>
                    <option value="DIVORCED">Divorced</option>
                    <option value="WIDOWED">Widowed</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label style={labelStyle}>Spouse name</label>
                  <input style={inputStyle} type="text" value={formData.spouseName || ""} onChange={(e) => setFormData({ ...formData, spouseName: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label style={labelStyle}>Contact address</label>
                  <textarea style={{ ...inputStyle, height: 72, resize: "none" }} value={formData.contactAddress || ""} onChange={(e) => setFormData({ ...formData, contactAddress: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label style={labelStyle}>Permanent address</label>
                  <textarea style={{ ...inputStyle, height: 72, resize: "none" }} value={formData.permanentAddress || ""} onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })} />
                </div>
                <div className="sm:col-span-2">
                  <label style={labelStyle}>Profile image</label>
                  <input key={fileInputKey} type="file" accept="image/*" style={{ ...inputStyle, padding: "5px 12px" }}
                    onChange={(e) => { if (e.target.files?.[0]) setSelectedFile(e.target.files[0]); }} />
                </div>
              </div>
              <button type="submit"
                className="transition-colors"
                style={{ background: "#1A56DB", color: "#FFFFFF", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 500, border: "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#1648C0"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#1A56DB"; }}>
                Update information
              </button>
            </form>
          </div>

          {/* Security */}
          <div style={panelStyle}>
            <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
              <Lock size={15} style={{ color: "#1A56DB" }} aria-hidden="true" />
              <p style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>Security settings</p>
            </div>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label style={labelStyle}>Current password</label>
                <input style={inputStyle} type="password" required value={passwordData.oldPassword} onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>New password</label>
                  <input style={inputStyle} type="password" required value={passwordData.newPassword} onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })} />
                </div>
                <div>
                  <label style={labelStyle}>Confirm new password</label>
                  <input style={inputStyle} type="password" required value={passwordData.confirmPassword} onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })} />
                </div>
              </div>
              <button type="submit"
                className="transition-colors"
                style={{ background: "#111827", color: "#FFFFFF", borderRadius: 8, padding: "8px 16px", fontSize: 13, fontWeight: 500, border: "none" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#1F2937"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "#111827"; }}>
                Change password
              </button>
            </form>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Org info */}
          <div style={panelStyle}>
            <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
              <Building2 size={15} style={{ color: "#1A56DB" }} aria-hidden="true" />
              <p style={{ fontSize: 14, fontWeight: 500, color: "#111827" }}>Organisational info</p>
            </div>
            <div className="space-y-3">
              {[
                { label: "Employee code", value: profile?.employeeCode, mono: true },
                { label: "Job level", value: `${profile?.levelName} (Rank ${profile?.levelRank})` },
                { label: "Position", value: profile?.positionName },
                { label: "Department", value: profile?.currentDepartmentName },
              ].map(({ label, value, mono }) => (
                <div key={label}>
                  <p style={{ fontSize: 11, color: "#9EA3B0", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</p>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "#111827", marginTop: 2, fontFamily: mono ? "monospace" : undefined }}>{value ?? "—"}</p>
                </div>
              ))}
              <div>
                <p style={{ fontSize: 11, color: "#9EA3B0", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Roles</p>
                <div className="flex flex-wrap gap-1">
                  {profile?.roles.map(r => (
                    <span key={r} style={{ background: "#EEF3FD", color: "#0C447C", fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 20 }}>
                      {r.replace("ROLE_", "")}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Reporting structure */}
          {(manager || (directReports && directReports.length > 0)) && (
            <div style={panelStyle}>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#111827", marginBottom: 14 }}>Reporting structure</p>
              {manager && (
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 11, color: "#9EA3B0", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Reports to</p>
                  <div className="flex items-center gap-2" style={{ background: "#F5F6F8", border: "0.5px solid #E4E6EC", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#EEF3FD", color: "#1A56DB", fontSize: 11, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {manager.staffName.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: "#111827" }}>{manager.staffName}</p>
                      <p style={{ fontSize: 11, color: "#9EA3B0" }}>{manager.positionName}</p>
                    </div>
                  </div>
                </div>
              )}
              {directReports && directReports.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, color: "#9EA3B0", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>
                    Direct reports ({directReports.length})
                  </p>
                  <div className="space-y-1">
                    {directReports.map(report => (
                      <div key={report.id} className="flex items-center gap-2" style={{ padding: "6px 0", borderBottom: "0.5px solid #F0F2F6" }}>
                        <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#F1EFE8", color: "#444441", fontSize: 10, fontWeight: 500, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          {report.staffName.charAt(0)}
                        </div>
                        <div>
                          <p style={{ fontSize: 12, fontWeight: 500, color: "#111827" }}>{report.staffName}</p>
                          <p style={{ fontSize: 11, color: "#9EA3B0" }}>{report.positionName}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Permissions */}
          {profile?.permissions && profile.permissions.length > 0 && (
            <div style={panelStyle}>
              <p style={{ fontSize: 14, fontWeight: 500, color: "#111827", marginBottom: 12 }}>System permissions</p>
              <div className="space-y-1">
                {profile.permissions.map(p => (
                  <div key={p} className="flex items-center gap-2">
                    <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#1A56DB", flexShrink: 0 }} />
                    <span style={{ fontSize: 12, color: "#5A6070" }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditProfilePage;
