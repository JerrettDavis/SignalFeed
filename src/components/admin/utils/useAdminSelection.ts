import { useState } from "react";

export const useAdminSelection = <T extends { id: string }>(items: T[]) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? new Set(items.map((i) => i.id)) : new Set());
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    const newSet = new Set(selectedIds);
    if (checked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    setSelectedIds(newSet);
  };

  const clearSelection = () => setSelectedIds(new Set());

  return {
    selectedIds,
    handleSelectAll,
    handleSelectOne,
    clearSelection,
    hasSelection: selectedIds.size > 0,
    selectedCount: selectedIds.size,
  };
};
