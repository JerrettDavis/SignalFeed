"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface UserDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onSignOut: () => void;
  userEmail?: string;
  notificationsEnabled?: boolean;
}

export function UserDropdown({ isOpen, onClose, onSignOut, userEmail, notificationsEnabled }: UserDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [isTogglingNotifications, setIsTogglingNotifications] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const menuItems = [
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      label: "Profile",
      action: () => {
        router.push("/profile");
        onClose();
      },
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      label: "Settings",
      action: () => {
        router.push("/settings");
        onClose();
      },
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
      ),
      label: notificationsEnabled ? "Disable Notifications" : "Enable Notifications",
      action: async () => {
        setIsTogglingNotifications(true);
        const win = window as typeof window & { 
          pushNotifications?: { 
            subscribe: () => Promise<void>; 
            unsubscribe: () => Promise<void>;
            isSubscribed: () => boolean;
          } 
        };
        
        if (win.pushNotifications) {
          if (notificationsEnabled) {
            await win.pushNotifications.unsubscribe();
          } else {
            await win.pushNotifications.subscribe();
          }
        }
        setIsTogglingNotifications(false);
        onClose();
      },
      loading: isTogglingNotifications,
    },
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
      label: "Messages",
      action: () => {
        router.push("/messages");
        onClose();
      },
    },
    "divider",
    {
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
      ),
      label: "Sign Out",
      action: () => {
        onSignOut();
        onClose();
      },
      danger: true,
    },
  ];

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
    >
      {userEmail && (
        <div className="border-b border-[color:var(--border)] px-4 py-3">
          <p className="text-xs text-[color:var(--text-tertiary)]">Signed in as</p>
          <p className="mt-0.5 truncate text-sm font-medium text-[color:var(--text-primary)]">{userEmail}</p>
        </div>
      )}

      <div className="py-1">
        {menuItems.map((item, index) => {
          if (item === "divider") {
            return <div key={`divider-${index}`} className="my-1 h-px bg-[color:var(--border)]" />;
          }

          const menuItem = item as {
            icon: React.ReactNode;
            label: string;
            action: () => void;
            danger?: boolean;
            badge?: string;
            loading?: boolean;
          };

          return (
            <button
              key={menuItem.label}
              onClick={menuItem.action}
              disabled={menuItem.loading}
              className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition ${
                menuItem.danger
                  ? "text-[color:var(--accent-danger)] hover:bg-[color:var(--accent-danger)]/10"
                  : "text-[color:var(--text-primary)] hover:bg-[color:var(--surface-elevated)]"
              } ${menuItem.loading ? "opacity-50 cursor-wait" : ""}`}
            >
              <span className={menuItem.danger ? "text-[color:var(--accent-danger)]" : "text-[color:var(--text-secondary)]"}>
                {menuItem.loading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[color:var(--border)] border-t-[color:var(--accent-primary)]" />
                ) : (
                  menuItem.icon
                )}
              </span>
              <span className="flex-1 text-left">{menuItem.label}</span>
              {menuItem.badge && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[color:var(--accent-primary)] px-1.5 text-xs font-medium text-white">
                  {menuItem.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
