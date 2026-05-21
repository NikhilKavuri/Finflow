"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import {
  getNotifications,
  markNotificationRead,
  markSplitInviteRead,
  markAllNotificationsRead,
  deleteReadNotifications,
} from "@/lib/firestore";
import type { SplitNotification } from "@/lib/types";

interface NotificationIconProps {
  onInviteClick?: (notification: SplitNotification) => void | Promise<void>;
  onInviteReject?: (notification: SplitNotification) => void | Promise<void>;
}

export default function NotificationIcon({ onInviteClick, onInviteReject }: NotificationIconProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<SplitNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const triggerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPosition, setPanelPosition] = useState({ top: 72, left: 16, width: 320 });

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const loadNotifications = async () => {
      try {
        const notifs = await getNotifications(user.uid);
        setNotifications(notifs);
      } catch (error) {
        console.warn("Failed to load notifications:", error);
      } finally {
        setLoading(false);
      }
    };

    loadNotifications();

    // Reload every 10 seconds
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, [user?.uid]);

  const visibleNotifications = notifications.filter((notification, index, list) => {
    if (notification.type !== "split_invite") return true;
    return list.findIndex((item) => item.type === "split_invite" && item.splitId === notification.splitId) === index;
  });
  const unreadCount = visibleNotifications.filter((n) => !n.read).length;
  const readCount = visibleNotifications.filter((n) => n.read).length;

  useLayoutEffect(() => {
    if (!isOpen) return;

    const updatePanelPosition = () => {
      const trigger = triggerRef.current;
      if (!trigger) return;

      const rect = trigger.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const width = Math.min(400, viewportWidth - 32);
      const centeredLeft = rect.left + rect.width / 2 - width / 2;
      const left = Math.min(Math.max(16, centeredLeft), viewportWidth - width - 16);

      setPanelPosition({
        top: rect.bottom + 8,
        left,
        width,
      });
    };

    updatePanelPosition();
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    return () => document.removeEventListener("pointerdown", handlePointerDown, true);
  }, [isOpen]);

  const handleMarkAsRead = async (notification: SplitNotification) => {
    if (!user?.uid) return;
    try {
      await markNotificationRead(user.uid, notification.id);
      if (notification.type === "split_invite") {
        await markSplitInviteRead(user.uid, notification.splitId);
      }
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notification.id || (notification.type === "split_invite" && n.splitId === notification.splitId)
            ? { ...n, read: true }
            : n
        )
      );
    } catch (error) {
      console.warn("Failed to mark notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.uid) return;
    setIsOpen(false);
    try {
      await markAllNotificationsRead(user.uid);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.warn("Failed to mark all as read:", error);
    }
  };

  const handleDeleteRead = async () => {
    if (!user?.uid) return;
    setIsOpen(false);
    try {
      await deleteReadNotifications(user.uid);
      setNotifications((prev) => prev.filter((n) => !n.read));
    } catch (error) {
      console.warn("Failed to delete read notifications:", error);
    }
  };

  const handleInviteAccept = async (notification: SplitNotification) => {
    setIsOpen(false);
    setNotifications((prev) =>
      prev.filter((n) =>
        notification.type === "split_invite" ? n.splitId !== notification.splitId : n.id !== notification.id
      )
    );
    try {
      await onInviteClick?.(notification);
      await handleMarkAsRead(notification);
    } catch (error) {
      console.warn("Failed to accept invite:", error);
    }
  };

  const handleInviteReject = async (notification: SplitNotification) => {
    setIsOpen(false);
    setNotifications((prev) =>
      prev.filter((n) =>
        notification.type === "split_invite" ? n.splitId !== notification.splitId : n.id !== notification.id
      )
    );
    try {
      await onInviteReject?.(notification);
      await handleMarkAsRead(notification);
    } catch (error) {
      console.warn("Failed to reject invite:", error);
    }
  };

  const handleNotificationClick = async (notification: SplitNotification) => {
    setIsOpen(false);
    await handleMarkAsRead(notification);
    router.push(`/splits/${notification.splitId}`);
  };

  if (!user) return null;

  return (
    <div ref={triggerRef} className="relative">
      {/* Bell Icon */}
      <motion.button
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
      >
        <Bell size={20} className="text-[#5a5a6e]" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[90]"
            />

            {/* Notification Panel */}
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="fixed z-[100] overflow-hidden rounded-2xl border border-white/[0.06] bg-[#1e1e28] shadow-xl"
              style={{
                top: panelPosition.top,
                left: panelPosition.left,
                width: panelPosition.width,
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
                <h3 className="font-syne font-bold text-white">Notifications</h3>
                <div className="flex items-center gap-3">
                  {readCount > 0 && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleDeleteRead}
                      className="text-xs font-medium text-[#ff6b8a] hover:text-[#ff8aa2]"
                    >
                      Clear read
                    </motion.button>
                  )}
                  {unreadCount > 0 && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleMarkAllAsRead}
                      className="text-xs text-[#8b6fff] hover:text-[#a080ff] font-medium"
                    >
                      Mark all read
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="max-h-[400px] overflow-y-auto">
                {loading ? (
                  <div className="p-6 text-center text-sm text-[#5a5a6e]">
                    Loading...
                  </div>
                ) : visibleNotifications.length === 0 ? (
                  <div className="p-6 text-center text-sm text-[#5a5a6e]">
                    No notifications yet
                  </div>
                ) : (
                  <div className="divide-y divide-white/[0.06]">
                    {visibleNotifications.map((notif) => (
                      <motion.div
                        key={notif.id}
                        layout
                        role="button"
                        tabIndex={0}
                        onClick={() => handleNotificationClick(notif)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            handleNotificationClick(notif);
                          }
                        }}
                        className={`p-4 transition-colors ${
                          notif.read ? "bg-transparent" : "bg-[#8b6fff]/10"
                        } cursor-pointer hover:bg-white/[0.04]`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl flex-shrink-0">
                            {notif.splitEmoji || "🔔"}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {notif.splitName}
                            </p>
                            <p className="text-xs text-[#5a5a6e] mt-1 line-clamp-2">
                              {notif.message}
                            </p>
                            {notif.type === "split_invite" && (
                              <div className="flex gap-2 mt-3">
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleInviteAccept(notif);
                                  }}
                                  className="flex-1 text-xs py-1.5 px-2 bg-[#8b6fff] text-white rounded-lg font-medium hover:bg-[#a080ff] transition-colors"
                                >
                                  Accept
                                </motion.button>
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleInviteReject(notif);
                                  }}
                                  className="flex-1 text-xs py-1.5 px-2 bg-white/10 text-[#5a5a6e] rounded-lg font-medium hover:bg-white/20 transition-colors"
                                >
                                  Reject
                                </motion.button>
                              </div>
                            )}
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 bg-[#8b6fff] rounded-full flex-shrink-0 mt-1" />
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
