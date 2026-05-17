"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Camera, Lock, LogOut, User, Check, Loader2, Mail, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import PageLoader from "@/components/PageLoader";
import BottomNav from "@/components/BottomNav";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading, changePassword, updateUserProfile, logOut } = useAuth();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [showPhotoInput, setShowPhotoInput] = useState(false);

  const isEmailUser = user?.providerData?.some((p) => p.providerId === "password");
  const isGoogleUser = user?.providerData?.some((p) => p.providerId === "google.com");

  const handleChangePassword = async () => {
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) { setPasswordError("Current password is required."); return; }
    if (!newPassword) { setPasswordError("New password is required."); return; }
    if (newPassword.length < 6) { setPasswordError("Password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setPasswordError("Passwords do not match."); return; }

    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setPasswordSuccess("Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => {
        setShowPasswordForm(false);
        setPasswordSuccess("");
      }, 2000);
    } catch (err: any) {
      setPasswordError(err?.message || "Failed to change password.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateName = async () => {
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      await updateUserProfile({ displayName: displayName.trim() });
      setEditingName(false);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePhoto = async () => {
    if (!photoURL.trim()) return;
    setSaving(true);
    try {
      await updateUserProfile({ photoURL: photoURL.trim() });
      setShowPhotoInput(false);
      setPhotoURL("");
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logOut();
    router.replace("/login");
  };

  if (loading) return <PageLoader message="Loading profile..." />;
  if (!user) return null;

  return (
    <div className="app-screen mx-auto flex w-full max-w-[480px] flex-col overflow-x-hidden pb-24">
      {/* Header */}
      <nav className="sticky top-0 z-30 px-5 py-4 glass-nav border-b border-white/[0.06]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User size={20} className="text-[#8b6fff]" />
            <span className="font-syne text-xl font-black gradient-text">Profile</span>
          </div>
        </div>
      </nav>

      <main className="flex-1 px-4 pt-6 space-y-5">
        {/* Avatar Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-center"
        >
          <div className="relative mb-4">
            <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#6c47ff]/40 shadow-[0_0_24px_rgba(108,71,255,0.2)]">
              {user.photoURL ? (
                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-[#6c47ff] to-[#8b6fff] flex items-center justify-center">
                  <span className="font-syne text-3xl font-black text-white">
                    {(user.displayName || user.email || "U")[0].toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowPhotoInput(!showPhotoInput)}
              className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[#6c47ff] border-2 border-[#0a0a0f] flex items-center justify-center text-white"
            >
              <Camera size={14} />
            </motion.button>
          </div>

          {/* Name */}
          {editingName ? (
            <div className="flex items-center gap-2 w-full max-w-[260px]">
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex-1 bg-[#1e1e28] border border-white/10 rounded-xl px-3 py-2 text-sm text-white text-center outline-none focus:border-[#8b6fff]"
                placeholder="Enter name"
                autoFocus
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleUpdateName}
                disabled={saving}
                className="w-8 h-8 rounded-full bg-[#6c47ff] flex items-center justify-center text-white"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              </motion.button>
            </div>
          ) : (
            <button
              onClick={() => {
                setDisplayName(user.displayName || "");
                setEditingName(true);
              }}
              className="font-syne text-lg font-bold text-white hover:text-[#8b6fff] transition-colors"
            >
              {user.displayName || "Set your name"}
            </button>
          )}

          <p className="text-xs text-[#5a5a6e] mt-1 flex items-center gap-1">
            <Mail size={11} />
            {user.email || "No email"}
          </p>

          {/* Auth Provider Badge */}
          <div className="flex items-center gap-2 mt-2">
            {isGoogleUser && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#4285F4]/10 border border-[#4285F4]/20 text-[10px] font-semibold text-[#4285F4]">
                <svg width="10" height="10" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Google
              </span>
            )}
            {isEmailUser && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#8b6fff]/10 border border-[#8b6fff]/20 text-[10px] font-semibold text-[#8b6fff]">
                <Shield size={10} />
                Email
              </span>
            )}
          </div>
        </motion.div>

        {/* Photo URL Input */}
        <AnimatePresence>
          {showPhotoInput && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-4 bg-[#1e1e28] rounded-2xl border border-white/10 space-y-3">
                <h3 className="text-sm font-bold text-white">Update Profile Picture</h3>
                <p className="text-[11px] text-[#5a5a6e]">Paste a URL to your profile picture</p>
                <input
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={photoURL}
                  onChange={(e) => setPhotoURL(e.target.value)}
                  className="w-full bg-[#252533] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff]"
                />
                <div className="flex gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleUpdatePhoto}
                    disabled={saving || !photoURL.trim()}
                    className="flex-1 py-2.5 rounded-xl font-semibold text-sm text-white bg-[#6c47ff] disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Update Photo"}
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setShowPhotoInput(false); setPhotoURL(""); }}
                    className="px-4 py-2.5 rounded-xl font-semibold text-sm text-[#9898aa] bg-white/5"
                  >
                    Cancel
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Change Password (email users only) */}
        {isEmailUser && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <button
              onClick={() => setShowPasswordForm(!showPasswordForm)}
              className="w-full flex items-center gap-3 px-4 py-3.5 bg-[#1e1e28] border border-white/[0.06] rounded-2xl hover:bg-[#252533] transition-all"
            >
              <div className="w-9 h-9 rounded-xl bg-[#facc15]/10 flex items-center justify-center">
                <Lock size={16} className="text-[#facc15]" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-white">Change Password</div>
                <div className="text-[11px] text-[#5a5a6e]">Update your account password</div>
              </div>
            </button>

            <AnimatePresence>
              {showPasswordForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 p-4 bg-[#1e1e28] rounded-2xl border border-white/10 space-y-3">
                    {passwordError && (
                      <div className="px-3 py-2 bg-[#ff4f6b]/10 border border-[#ff4f6b]/20 rounded-xl text-xs text-[#ff4f6b]">
                        {passwordError}
                      </div>
                    )}
                    {passwordSuccess && (
                      <div className="px-3 py-2 bg-[#2ce88a]/10 border border-[#2ce88a]/20 rounded-xl text-xs text-[#2ce88a]">
                        {passwordSuccess}
                      </div>
                    )}
                    <input
                      type="password"
                      placeholder="Current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full bg-[#252533] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff]"
                    />
                    <input
                      type="password"
                      placeholder="New password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-[#252533] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff]"
                    />
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#252533] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-[#5a5a6e] outline-none focus:border-[#8b6fff]"
                    />
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleChangePassword}
                      disabled={saving}
                      className="w-full py-2.5 rounded-xl font-semibold text-sm text-white bg-[#6c47ff] disabled:opacity-50"
                    >
                      {saving ? "Changing..." : "Change Password"}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Sign Out */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-[#1e1e28] border border-red-500/[0.1] rounded-2xl hover:bg-red-500/[0.04] transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
              <LogOut size={16} className="text-red-400" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-sm font-semibold text-red-400">Sign Out</div>
              <div className="text-[11px] text-[#5a5a6e]">Logout from your account</div>
            </div>
          </motion.button>
        </motion.div>
      </main>

      <BottomNav onAddClick={() => {}} disabled />
    </div>
  );
}