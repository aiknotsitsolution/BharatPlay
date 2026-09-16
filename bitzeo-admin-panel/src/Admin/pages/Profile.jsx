import { useEffect, useRef, useState } from "react";
import { Camera, Mail, Shield, User, X, Pencil, Phone, CheckCheck, Lock, Eye, EyeOff, KeyRound, SendHorizonal } from "lucide-react";
import toast from "react-hot-toast";
import {
  getAdminProfile,
  updateAdminProfile,
  requestAdminPasswordOtp,
  verifyAdminResetOtp,
  resetAdminPassword,
} from "../../api";
import { getAdminDisplayName, getInitials, getAdminPhoto, getAdminEmail } from "../../utils/helpers";
import { getCurrentRole, getRoleMeta } from "../../config/roleConfig";

export default function Profile() {
  const fileRef = useRef(null);
  const [photo, setPhoto] = useState(getAdminPhoto());
  const [originalPhoto, setOriginalPhoto] = useState(getAdminPhoto());
  const [name, setName] = useState(getAdminDisplayName());
  const [email, setEmail] = useState(getAdminEmail());
  const [contact, setContact] = useState("");
  const [role, setRole] = useState(getCurrentRole());
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [removingPhoto, setRemovingPhoto] = useState(false);

  const [pwStep, setPwStep] = useState("idle"); // "idle" | "sent"
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwSending, setPwSending] = useState(false);
  const [pwVerifying, setPwVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const roleMeta = getRoleMeta(role);

  const syncStore = (next) => {
    try {
      const current = JSON.parse(localStorage.getItem("adminUser") || "{}");
      localStorage.setItem("adminUser", JSON.stringify({ ...current, ...next }));
      window.dispatchEvent(new Event("auth-change"));
    } catch (_) {}
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getAdminProfile();
        if (cancelled || !res?.data?.user) return;
        const u = res.data.user;
        setEmail(u.email || "");
        setRole(u.role || getCurrentRole());
        syncStore({
          name: u.name,
          email: u.email,
          role: u.role,
          profilePhoto: u.profilePhoto || null,
        });
        setName(u.name || getAdminDisplayName());
        setContact(u.contactNumber || "");
        setPhoto(u.profilePhoto || null);
        setOriginalPhoto(u.profilePhoto || null);
      } catch (_) {
        // fall back to local session data
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleSendOtp = async () => {
    if (cooldown > 0 || pwSending) return;
    setPwSending(true);
    try {
      const res = await requestAdminPasswordOtp();
      if (!res?.data?.success) throw new Error(res?.data?.message || "Failed to send code");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setPwStep("sent");
      setCooldown(60);
      toast.success(res.data.message || "Verification code sent to your email!");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to send code");
    } finally {
      setPwSending(false);
    }
  };

  const handleVerifyReset = async () => {
    if (!/^\d{6}$/.test(otp)) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setPwVerifying(true);
    try {
      const verifyRes = await verifyAdminResetOtp(otp);
      if (!verifyRes?.data?.success) throw new Error(verifyRes?.data?.message || "Verification failed");
      const resetRes = await resetAdminPassword(verifyRes.data.resetToken, newPassword);
      if (!resetRes?.data?.success) throw new Error(resetRes?.data?.message || "Reset failed");
      toast.success(resetRes.data.message || "Password reset successfully!");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setPwStep("idle");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to reset password");
    } finally {
      setPwVerifying(false);
    }
  };

  const cancelPasswordReset = () => {
    setPwStep("idle");
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
    setCooldown(0);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (e.target.value) e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size should be less than 2MB");
      return;
    }
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoFile(file);
    setRemovingPhoto(false);
  };

  const handleRemovePhoto = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    setPhotoFile(null);
    setRemovingPhoto(true);
  };

  const startEditing = () => {
    setOriginalPhoto(getAdminPhoto());
    setEditing(true);
  };

  const cancelEditing = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoFile(null);
    setPhotoPreview(null);
    setRemovingPhoto(false);
    setPhoto(originalPhoto);
    setContact(contact);
    setName(name);
    setEditing(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Name cannot be empty");
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("name", name.trim());
      if (contact) fd.append("contactNumber", contact);
      if (photoFile) fd.append("profilePhoto", photoFile);
      if (removingPhoto) fd.append("removePhoto", "1");

      const res = await updateAdminProfile(fd);
      if (!res?.data?.success) throw new Error(res?.data?.message || "Update failed");

      const u = res.data.user;
      syncStore({
        name: u.name,
        email: u.email,
        contactNumber: u.contactNumber,
        profilePhoto: u.profilePhoto || null,
      });
      if (photoPreview) URL.revokeObjectURL(photoPreview);
      setPhoto(u.profilePhoto || null);
      setOriginalPhoto(u.profilePhoto || null);
      setContact(u.contactNumber || "");
      setPhotoFile(null);
      setPhotoPreview(null);
      setRemovingPhoto(false);
      setEditing(false);
      toast.success(res.data.message || "Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const activePhoto = photoPreview || photo;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-bp-text">Profile</h1>
        <p className="text-[13px] text-bp-text-secondary mt-1">
          Your account details and session
        </p>
      </div>

      {/* Profile card */}
      <div className="relative bg-bp-card border border-bp-border rounded-2xl shadow-xl overflow-hidden">
        <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-bp-blue/30 to-transparent" />
        <div className="p-6 md:p-8">
          {/* Identity */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-5 mb-8">
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center overflow-hidden"
                style={{ background: "linear-gradient(135deg, rgba(0,140,255,0.12), rgba(0,217,255,0.08))", border: "2px solid rgba(0,140,255,0.25)" }}
              >
                {activePhoto ? (
                  <img src={activePhoto} alt={name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-bp-blue">{getInitials(name)}</span>
                )}
              </div>
              {editing && (
                <>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-0.5 -right-0.5 w-7 h-7 rounded-full bg-gradient-to-br from-bp-blue to-bp-cyan border-[3px] border-bp-card flex items-center justify-center text-white shadow-md shadow-bp-blue/30 hover:scale-110 active:scale-95 transition-transform duration-200"
                    title="Change photo"
                  >
                    <Camera size={13} />
                  </button>
                  {activePhoto && !removingPhoto && (
                    <button
                      onClick={handleRemovePhoto}
                      className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-red-500 border-2 border-bp-card flex items-center justify-center text-white shadow-md hover:bg-red-400 active:scale-95 transition-all duration-200"
                      title="Remove photo"
                    >
                      <X size={11} />
                    </button>
                  )}
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
            </div>
            <div className="min-w-0 flex-1">
              {editing ? (
                <div className="max-w-sm space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-bp-text-secondary mb-1.5">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-bp-surface/60 border border-bp-border text-bp-text rounded-xl focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue/60 outline-none transition-all duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-bp-text-secondary mb-1.5">
                      Contact Number
                    </label>
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      placeholder="+91 00000 00000"
                      className="w-full px-3.5 py-2.5 bg-bp-surface/60 border border-bp-border text-bp-text rounded-xl focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue/60 outline-none transition-all duration-200"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-bp-text truncate">{name}</h2>
                  <p className="text-sm text-bp-text-muted mt-0.5 truncate">{email}</p>
                  <div className="mt-3">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${roleMeta.bg} ${roleMeta.color} ${roleMeta.borderColor}`}>
                      <Shield size={12} /> {roleMeta.label}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Edit / save actions */}
            {!editing ? (
              <button
                onClick={startEditing}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-bp-blue to-bp-cyan hover:from-bp-cyan hover:to-bp-blue text-white shadow-lg shadow-bp-blue/25 transition-all duration-200"
              >
                <Pencil size={15} />
                Edit Profile
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-bp-blue to-bp-cyan hover:from-bp-cyan hover:to-bp-blue text-white shadow-lg shadow-bp-blue/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <CheckCheck size={15} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={cancelEditing}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-bp-elevated border border-bp-border text-bp-text-secondary hover:bg-bp-elevated/80 hover:text-bp-text transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-bp-surface/60 border border-bp-border/50 transition-colors duration-200 hover:bg-bp-surface hover:border-bp-border">
              <div className="flex items-center gap-2 text-bp-text-muted text-xs font-medium mb-2 uppercase tracking-wider">
                <User size={13} /> Full Name
              </div>
              <p className="text-sm font-semibold text-bp-text truncate">{name}</p>
            </div>
            <div className="p-4 rounded-xl bg-bp-surface/60 border border-bp-border/50 transition-colors duration-200 hover:bg-bp-surface hover:border-bp-border">
              <div className="flex items-center gap-2 text-bp-text-muted text-xs font-medium mb-2 uppercase tracking-wider">
                <Mail size={13} /> Email
              </div>
              <p className="text-sm font-semibold text-bp-text truncate">{email || "—"}</p>
            </div>
            <div className="p-4 rounded-xl bg-bp-surface/60 border border-bp-border/50 transition-colors duration-200 hover:bg-bp-surface hover:border-bp-border">
              <div className="flex items-center gap-2 text-bp-text-muted text-xs font-medium mb-2 uppercase tracking-wider">
                <Shield size={13} /> Role
              </div>
              <p className="text-sm font-semibold text-bp-text">{roleMeta.label}</p>
            </div>
            <div className="p-4 rounded-xl bg-bp-surface/60 border border-bp-border/50 transition-colors duration-200 hover:bg-bp-surface hover:border-bp-border">
              <div className="flex items-center gap-2 text-bp-text-muted text-xs font-medium mb-2 uppercase tracking-wider">
                <Phone size={13} /> Contact
              </div>
              <p className="text-sm font-semibold text-bp-text truncate">{contact || "—"}</p>
            </div>
          </div>
          {loading && (
            <p className="text-[12px] text-bp-text-muted mt-4 animate-pulse">
              Syncing profile...
            </p>
          )}
        </div>
      </div>

      {/* Security / Password Reset (OTP) */}
      <div className="relative bg-bp-card border border-bp-border rounded-2xl shadow-xl overflow-hidden">
        <div className="absolute top-0 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-bp-orange/30 to-transparent" />
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-3 mb-1.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, rgba(255,106,0,0.1), rgba(255,196,0,0.08))" }}>
              <Lock size={17} className="text-bp-text" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-bp-text">Security</h2>
              <p className="text-[12px] text-bp-text-secondary">
                Reset your password via a verification code sent to {email || "your registered email"}
              </p>
            </div>
          </div>

          {pwStep === "idle" ? (
            <button
              onClick={handleSendOtp}
              disabled={pwSending}
              className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-bp-blue to-bp-cyan hover:from-bp-cyan hover:to-bp-blue text-white shadow-lg shadow-bp-blue/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              <SendHorizonal size={16} />
              {pwSending ? "Sending..." : "Send Verification Code"}
            </button>
          ) : (
            <div className="mt-6 max-w-xl space-y-4">
              <div className="p-3.5 rounded-xl bg-bp-elevated border border-bp-border text-[13px] text-bp-text-secondary flex items-start gap-2.5">
                <KeyRound size={16} className="shrink-0 text-bp-blue mt-0.5" />
                <span>
                  A 6-digit verification code has been sent to <strong className="text-bp-text font-semibold">{email}</strong>. Enter it below to reset your password.
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-bp-text-secondary mb-1.5">
                  Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="••••••"
                  className="w-full px-3.5 py-2.5 bg-bp-surface/60 border border-bp-border text-bp-text rounded-xl tracking-[0.35em] text-center text-lg font-semibold focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue/60 outline-none transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-bp-text-secondary mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showNewPw ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 pr-11 bg-bp-surface/60 border border-bp-border text-bp-text rounded-xl focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue/60 outline-none transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-bp-text-muted hover:text-bp-text transition-colors duration-200"
                    title={showNewPw ? "Hide password" : "Show password"}
                  >
                    {showNewPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-bp-text-secondary mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPw ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 pr-11 bg-bp-surface/60 border border-bp-border text-bp-text rounded-xl focus:ring-2 focus:ring-bp-blue/20 focus:border-bp-blue/60 outline-none transition-all duration-200"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-bp-text-muted hover:text-bp-text transition-colors duration-200"
                    title={showConfirmPw ? "Hide password" : "Show password"}
                  >
                    {showConfirmPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <button
                  onClick={handleVerifyReset}
                  disabled={pwVerifying}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-bp-blue to-bp-cyan hover:from-bp-cyan hover:to-bp-blue text-white shadow-lg shadow-bp-blue/25 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  <CheckCheck size={16} />
                  {pwVerifying ? "Resetting..." : "Verify & Reset"}
                </button>
                <button
                  onClick={handleSendOtp}
                  disabled={cooldown > 0 || pwSending}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-bp-elevated border border-bp-border text-bp-text-secondary hover:text-bp-text hover:border-bp-blue/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {cooldown > 0 ? `Resend (${cooldown}s)` : "Resend Code"}
                </button>
                <button
                  onClick={cancelPasswordReset}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-bp-elevated border border-bp-border text-bp-text-secondary hover:text-bp-text hover:border-red-400/40 transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}