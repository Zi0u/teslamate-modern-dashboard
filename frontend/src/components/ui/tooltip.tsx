import type { ReactNode } from "react";

export function Tooltip({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <div className="relative group">
      {children}
      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 whitespace-nowrap rounded-md bg-zinc-900 px-2 py-1 text-xs text-zinc-100 shadow-md opacity-0 transition-opacity group-hover:opacity-100 z-50">
        {label}
      </span>
    </div>
  );
}
