import React from "react";
import { useAppDispatch, useAppSelector } from "../hooks/reduxHooks";
import {
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
} from "../features/notification/notificationApi";
import {
  markAsRead,
  markAllAsRead,
} from "../features/notification/notificationSlice";
import { formatDistanceToNow } from "date-fns";
import { useNavigate } from "react-router-dom";

const NotificationsPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount } = useAppSelector((state) => state.notification);
  
  const [markAsReadApi] = useMarkAsReadMutation();
  const [markAllAsReadApi] = useMarkAllAsReadMutation();

  const handleNotificationClick = async (id: number, url: string) => {
    await markAsReadApi(id);
    dispatch(markAsRead(id));
    if (url) {
      navigate(url);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsReadApi().unwrap();
      dispatch(markAllAsRead());
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          <p className="text-gray-500 mt-1">Manage all your alerts and activities</p>
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors shadow-sm"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="bg-gray-50 p-6 rounded-full mb-4">
              <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">No notifications yet</h2>
            <p className="text-gray-500 mt-2 max-w-xs mx-auto">
              We'll notify you when something important happens in the system.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification.id, notification.actionUrl)}
                className={`flex items-start p-6 cursor-pointer transition-all duration-200 hover:bg-gray-50/80 group ${
                  !notification.isRead ? "bg-blue-50/20" : ""
                }`}
              >
                {/* Status Indicator */}
                <div className="mr-4 mt-1.5">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      !notification.isRead ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-gray-200"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm font-bold ${!notification.isRead ? "text-gray-900" : "text-gray-700"}`}>
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  
                  <p className={`text-sm leading-relaxed ${!notification.isRead ? "text-gray-700 font-medium" : "text-gray-500"}`}>
                    {notification.message}
                  </p>

                  {notification.actionUrl && (
                    <div className="mt-3 flex items-center text-xs font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span>View details</span>
                      <svg className="w-3.5 h-3.5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-8 text-center">
        <button
          onClick={() => navigate("/dashboard")}
          className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors inline-flex items-center"
        >
          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
};

export default NotificationsPage;
