import type { ReactNode } from 'react';

/** En-tête simple des écrans secondaires : titre sur le fond, sans bandeau. */
export function PageHeader({ title, action }: { title: ReactNode; action?: ReactNode }) {
  return (
    <header className="pt-safe">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 pt-6 pb-2">
        <h1 className="m-0 text-[28px] leading-tight font-bold tracking-[-0.02em]">{title}</h1>
        {action}
      </div>
    </header>
  );
}
