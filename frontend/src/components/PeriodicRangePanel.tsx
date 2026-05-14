"use client";

interface PeriodicRangePanelProps {
  dateFrom: string;
  dateTo: string;
  onPeriodicDateRangeChange: (range: { dateFrom: string; dateTo: string }) => void;
  onApplyPeriodicRange: () => void;
}

export default function PeriodicRangePanel({
  dateFrom,
  dateTo,
  onPeriodicDateRangeChange,
  onApplyPeriodicRange,
}: PeriodicRangePanelProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-800 bg-gray-900 px-4 py-3">
      <span className="text-xs text-gray-500">Context range:</span>
      <div className="flex items-center gap-2">
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => onPeriodicDateRangeChange({ dateFrom: e.target.value, dateTo })}
          className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-600"
        />
        <span className="text-xs text-gray-600">→</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => onPeriodicDateRangeChange({ dateFrom, dateTo: e.target.value })}
          className="rounded border border-gray-700 bg-gray-800 px-2 py-1 text-xs text-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-600"
        />
      </div>
      <button
        onClick={onApplyPeriodicRange}
        className="ml-auto rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs text-gray-300 transition hover:border-gray-600 hover:bg-gray-700 hover:text-gray-100"
      >
        Attach reflections
      </button>
    </div>
  );
}
