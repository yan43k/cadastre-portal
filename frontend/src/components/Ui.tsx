import clsx from "clsx";
import { type ReactNode } from "react";

export function StampRibbon({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={clsx(
        "inline-flex rotate-[-6deg] items-center justify-center rounded border-2 border-umber/40 bg-cream/90 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-umber",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={clsx("text-xs font-semibold uppercase tracking-[0.25em] text-sepia", className)}>
      {children}
    </p>
  );
}

export function Panel({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "border border-line bg-cream/70 p-6 shadow-seal transition-shadow hover:shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
}
