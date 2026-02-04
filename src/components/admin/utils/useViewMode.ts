import { useState, useEffect } from "react";

export type ViewMode = "grid" | "table";

export const useViewMode = (
  key: string = "admin-view-mode"
): [ViewMode, (mode: ViewMode) => void] => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(key);
      return (stored as ViewMode) || "table";
    }
    return "table";
  });

  const handleViewChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem(key, mode);
    }
  };

  return [viewMode, handleViewChange];
};
