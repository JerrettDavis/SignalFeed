import React from "react";

export interface Column<T> {
  key: string;
  label: string;
  render: (item: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
}

export interface AdminTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  selectedIds?: Set<string>;
  onSelectAll?: (checked: boolean) => void;
  onSelectOne?: (id: string, checked: boolean) => void;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  stickyHeader?: boolean;
}

export const AdminTable = <T extends { id: string }>({
  columns,
  data,
  selectedIds,
  onSelectAll,
  onSelectOne,
  onRowClick,
  emptyMessage = "No items found",
  stickyHeader = false,
}: AdminTableProps<T>) => {
  const hasSelection = !!onSelectAll && !!onSelectOne && !!selectedIds;
  const allSelected =
    hasSelection && data.length > 0 && selectedIds.size === data.length;

  return (
    <div className="overflow-hidden rounded-lg border border-[color:var(--border)] bg-[color:var(--surface)]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead
            className={`border-b border-[color:var(--border)] bg-[color:var(--surface-elevated)] ${
              stickyHeader ? "sticky top-0 z-10" : ""
            }`}
          >
            <tr>
              {hasSelection && (
                <th className="w-12 px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => onSelectAll?.(e.target.checked)}
                    className="h-4 w-4 rounded border-[color:var(--border)]"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-4 py-3 text-${column.align || "left"} text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wider`}
                  style={column.width ? { width: column.width } : undefined}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[color:var(--border)]">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (hasSelection ? 1 : 0)}
                  className="px-4 py-12 text-center text-sm text-[color:var(--text-secondary)]"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-[color:var(--surface-elevated)] transition ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                  onClick={() => onRowClick?.(item)}
                >
                  {hasSelection && (
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={(e) => {
                          e.stopPropagation();
                          onSelectOne?.(item.id, e.target.checked);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 rounded border-[color:var(--border)]"
                      />
                    </td>
                  )}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`px-4 py-3 text-${column.align || "left"}`}
                    >
                      {column.render(item)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
