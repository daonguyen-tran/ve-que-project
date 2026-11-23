import type { ReactNode } from 'react';

/**
 * État vide : dit ce qui manque, pourquoi c'est utile, et quoi faire. Jamais un simple
 * « Aucune donnée ».
 */
export function EmptyState({
  icon,
  title,
  body,
  badge,
  actions,
}: {
  icon: ReactNode;
  title: string;
  body: string;
  badge?: string;
  actions?: ReactNode;
}) {
  return (
    <section className="border-line bg-surface flex flex-col items-start gap-3 rounded-[var(--radius-card)] border p-5">
      <span className="bg-laque-tint text-laque-deep flex size-11 items-center justify-center rounded-xl">
        {icon}
      </span>
      <div className="flex flex-col gap-1.5">
        <h2 className="m-0 text-lg font-semibold tracking-[-0.01em]">{title}</h2>
        <p className="text-muted m-0 max-w-[60ch] text-[15px] leading-relaxed">{body}</p>
      </div>
      {badge && (
        <span className="border-line text-muted rounded-full border px-2.5 py-0.5 text-[13px]">
          {badge}
        </span>
      )}
      {actions && <div className="flex flex-wrap items-center gap-3 pt-1">{actions}</div>}
    </section>
  );
}
