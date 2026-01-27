"use client";

import { useEffect, type ReactNode } from "react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: "sm" | "md" | "lg";
}

export const Sidebar = ({
  isOpen,
  onClose,
  title,
  children,
  width = "md",
}: SidebarProps) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const widthClass = {
    sm: "w-80",
    md: "w-96",
    lg: "w-[32rem]",
  }[width];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 bottom-0 ${widthClass} bg-[color:var(--surface-elevated)] shadow-[var(--shadow-lg)] z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sidebar-title"
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[color:var(--border)] px-6 py-4">
            <h2
              id="sidebar-title"
              className="text-lg font-semibold text-[color:var(--text-primary)]"
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-[color:var(--text-secondary)] hover:bg-[color:var(--surface)] transition"
              aria-label="Close sidebar"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">{children}</div>
        </div>
      </div>
    </>
  );
};
