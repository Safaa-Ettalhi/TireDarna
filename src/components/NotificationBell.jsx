import { useEffect, useMemo, useRef, useState } from "react";
import { useRealtime } from "../context/RealtimeContext";

export function NotificationBell() {
  const { socket } = useRealtime();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!socket) return;

    const handleList = (list) => setNotifications(list);
    const handleNotification = (notif) => {
      setNotifications((prev) => [notif, ...prev]);
    };

    socket.on("notifications_list", handleList);
    socket.on("notification", handleNotification);
    socket.emit("get_notifications");

    return () => {
      socket.off("notifications_list", handleList);
      socket.off("notification", handleNotification);
    };
  }, [socket]);

  const unreadCount = useMemo(
    () => notifications.filter((notif) => !notif.isRead).length,
    [notifications]
  );

  function toggleOpen() {
    setOpen((prev) => !prev);
  }

  function markAsRead(notificationId) {
    if (!socket) return;
    socket.emit("mark_notification_read", { id: notificationId });
    setNotifications((prev) =>
      prev.map((notif) =>
        notif._id === notificationId ? { ...notif, isRead: true } : notif
      )
    );
  }

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      if (!containerRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const formatTimestamp = (value) => {
    if (!value) return "";
    try {
      return new Date(value).toLocaleString("fr-FR", {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const unreadNotifications = notifications.filter((notif) => !notif.isRead);
  const hasUnread = unreadNotifications.length > 0;

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={toggleOpen}
        aria-haspopup="true"
        aria-expanded={open}
        className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-gradient-to-br from-white to-slate-50 text-slate-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-600"
      >
        <span className="sr-only">Ouvrir les notifications</span>
        <i className="ri-notification-3-line text-[20px] leading-none" aria-hidden="true" />
        {hasUnread && (
          <span className="absolute -right-1 -top-1 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 px-1.5 text-[11px] font-semibold text-white shadow-sm">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-3 w-80 rounded-3xl border border-slate-200 bg-white/95 p-4 text-sm shadow-2xl backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-900">Notifications</p>
              <p className="text-xs text-slate-500">
                {hasUnread ? `${unreadCount} non lues` : "À jour"}
              </p>
            </div>
            {hasUnread && (
              <button
                onClick={() => unreadNotifications.forEach((notif) => markAsRead(notif._id))}
                className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                Tout marquer comme lu
              </button>
            )}
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {notifications.length === 0 && (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                Aucune notification pour l'instant.
              </div>
            )}
            {notifications.map((notif) => (
              <article
                key={notif._id}
                className={`rounded-2xl border px-3 py-2 transition ${
                  notif.isRead
                    ? "border-slate-100 bg-slate-50"
                    : "border-emerald-100 bg-gradient-to-r from-emerald-50 to-white shadow-[0_4px_12px_rgba(16,185,129,0.12)]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{notif.title}</p>
                    <p className="mt-0.5 text-xs text-slate-600">{notif.message}</p>
                  </div>
                  {!notif.isRead && (
                    <button
                      onClick={() => markAsRead(notif._id)}
                      className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-800"
                    >
                      Marquer lu
                    </button>
                  )}
                </div>
                <p className="mt-2 text-[11px] font-medium text-slate-400">
                  {formatTimestamp(notif.createdAt)}
                </p>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

