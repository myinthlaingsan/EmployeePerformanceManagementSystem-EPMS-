import React, { useState, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../hooks/reduxHooks";
import {
  useGetMyNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "../features/notification/notificationApi";
import {
  setNotifications,
  markAsRead,
  markAllAsRead,
} from "../features/notification/notificationSlice";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";
import { Bell, MailOpen, Inbox } from "lucide-react";

export const NotificationBell: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount } = useAppSelector((state) => state.notification);
  const { data: initialNotifications, isSuccess } = useGetMyNotificationsQuery();
  const [markAsReadApi] = useMarkAsReadMutation();
  const [markAllAsReadApi] = useMarkAllAsReadMutation();

  // Sync initial notifications from API to Redux state
  useEffect(() => {
    if (isSuccess && initialNotifications) {
      dispatch(setNotifications(initialNotifications));
    }
  }, [isSuccess, initialNotifications, dispatch]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleNotificationClick = async (id: number, url: string) => {
    await markAsReadApi(id);
    dispatch(markAsRead(id));
    setIsOpen(false);
    if (url) {
      navigate(url);
    }
  };

  const handleMarkAllAsRead = async () => {
    await markAllAsReadApi();
    dispatch(markAllAsRead());
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:bg-gray-50 hover:text-blue-600 rounded-lg transition-all duration-200 focus:outline-none"
      >
        <Bell className="w-5 h-5" strokeWidth={2} />

        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-3.5 w-3.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500 text-[9px] font-bold text-white items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-50 bg-gray-50/50">
            <h3 className="font-bold text-gray-800 flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-full">
                  {unreadCount} new
                </span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 uppercase tracking-tight flex items-center gap-1"
              >
                <MailOpen className="w-3 h-3" />
                Mark all
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-gray-400">
                <Inbox className="w-12 h-12 mb-3 opacity-20" strokeWidth={1.5} />
                <p className="text-xs font-medium">All caught up!</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id, notification.actionUrl)}
                  className={`flex flex-col p-4 border-b border-gray-50 cursor-pointer transition-colors duration-150 hover:bg-gray-50 ${!notification.isRead ? "bg-blue-50/20 border-l-4 border-l-blue-500" : ""
                    }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-gray-900 text-xs">{notification.title}</span>
                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {notification.message}
                  </p>
                </div>
              ))
            )}
          </div>

          <div className="p-3 bg-gray-50 text-center border-t border-gray-100">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate("/notifications");
              }}
              className="text-sm font-bold text-gray-600 hover:text-blue-600 transition-colors uppercase tracking-widest text-[10px]"
            >
              View all
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
