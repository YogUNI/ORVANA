import React from 'react';

export interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

export interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  renderMobileCard?: (item: T) => React.ReactNode;
  emptyMessage?: string;
  isLoading?: boolean;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  renderMobileCard,
  emptyMessage = 'Tidak ada data untuk ditampilkan.',
  isLoading = false,
}: ResponsiveTableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full bg-white rounded-card border border-surface-border p-6 space-y-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="h-10 bg-stone-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-card border border-surface-border p-8 text-center text-xs text-stone-500 font-sans">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Mobile Card View (renders if renderMobileCard provided, hidden on md+) */}
      {renderMobileCard && (
        <div className="md:hidden space-y-3">
          {data.map((item) => (
            <div
              key={keyExtractor(item)}
              className="bg-white rounded-card border border-surface-border p-4 shadow-soft"
            >
              {renderMobileCard(item)}
            </div>
          ))}
        </div>
      )}

      {/* Desktop / Tablet Table View (hidden on mobile if mobile card exists) */}
      <div
        className={`w-full overflow-x-auto bg-white rounded-card border border-surface-border shadow-soft ${
          renderMobileCard ? 'hidden md:block' : 'block'
        }`}
      >
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-surface-border bg-stone-50/70">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`text-[11px] font-mono uppercase tracking-wider font-semibold text-stone-600 px-4 py-3 ${
                    col.className || ''
                  } ${col.hideOnMobile ? 'hidden sm:table-cell' : ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border/60 text-xs text-stone-700 font-sans">
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                className="hover:bg-pine-50/30 transition-colors"
              >
                {columns.map((col, idx) => (
                  <td
                    key={idx}
                    className={`px-4 py-3.5 align-middle ${col.className || ''} ${
                      col.hideOnMobile ? 'hidden sm:table-cell' : ''
                    }`}
                  >
                    {col.cell
                      ? col.cell(item)
                      : col.accessorKey
                      ? String(item[col.accessorKey] ?? '-')
                      : '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
