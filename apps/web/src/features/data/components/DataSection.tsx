import type { ReactNode } from 'react';

/** Bloc titré de l'écran Sauvegarde : un titre de section, puis une carte. */
export function DataSection({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id} className="flex flex-col gap-2.5">
      <h2 id={id} className="m-0 px-1 text-lg font-semibold tracking-[-0.01em]">
        {title}
      </h2>
      <div className="border-line bg-surface flex flex-col gap-4 rounded-[var(--radius-card)] border p-4">
        {children}
      </div>
    </section>
  );
}
