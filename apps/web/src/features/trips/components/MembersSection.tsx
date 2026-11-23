import { ChevronRight, Plus } from 'lucide-react';
import { useState } from 'react';
import type { EntityId, Member } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { MemberAvatar } from './MemberAvatar';
import { MemberSheet } from './MemberSheet';

/** Liste des voyageurs d'un voyage, avec ajout et modification. */
export function MembersSection({ tripId, members }: { tripId: EntityId; members: Member[] }) {
  // `undefined` : panneau fermé ; `null` : ajout ; un membre : modification de ce membre.
  const [editing, setEditing] = useState<Member | null | undefined>(undefined);

  return (
    <section aria-labelledby="members-title" className="flex flex-col gap-2.5">
      <div className="flex items-baseline justify-between px-1">
        <h2 id="members-title" className="m-0 text-lg font-semibold tracking-[-0.01em]">
          {t.members.title}
        </h2>
        <span className="text-muted text-sm">{t.common.travellers(members.length)}</span>
      </div>
      <ul className="border-line bg-surface m-0 list-none overflow-hidden rounded-[var(--radius-card)] border p-0">
        {members.map((member) => (
          <li key={member.id} className="border-line-soft border-b last:border-b-0">
            <button
              type="button"
              onClick={() => setEditing(member)}
              aria-label={t.members.edit(member.name)}
              className="hover:bg-ground flex min-h-16 w-full items-center gap-3 px-4 text-left transition-colors"
            >
              <MemberAvatar member={member} />
              <span className="min-w-0 flex-1 truncate text-[15px] font-medium">{member.name}</span>
              {member.isMe && (
                <span className="border-line text-muted rounded-full border px-2 py-0.5 text-xs">
                  {t.members.me}
                </span>
              )}
              <ChevronRight className="text-muted size-5 shrink-0" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
      <Button variant="secondary" onClick={() => setEditing(null)} className="self-start">
        <Plus className="size-5" strokeWidth={2} aria-hidden="true" />
        {t.members.add}
      </Button>

      <MemberSheet
        tripId={tripId}
        member={editing ?? undefined}
        open={editing !== undefined}
        onClose={() => setEditing(undefined)}
      />
    </section>
  );
}
