"use client";

interface FilterGroupProps {
  label: string;
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}

export function FilterGroup({ label, options, value, onChange }: FilterGroupProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}:</span>
      <div className="flex overflow-hidden rounded-md border border-zinc-200 dark:border-zinc-700">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={[
              "px-2.5 py-1 text-xs transition-colors",
              value === opt.value
                ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                : "bg-white text-zinc-600 hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800",
            ].join(" ")}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
