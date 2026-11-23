import type { Member } from '@ve-que/domain';
import { cn } from '@/shared/lib/cn';
import { memberAvatarClass, memberInitial } from '@/shared/ui/member-style';

/** Pastille ronde à l'initiale du membre, dans sa couleur. Décorative : le nom est écrit à côté. */
export function MemberAvatar({
  member,
  className,
}: {
  member: Pick<Member, 'name' | 'color'>;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full text-[15px] font-semibold',
        memberAvatarClass(member.color),
        className,
      )}
    >
      {memberInitial(member.name)}
    </span>
  );
}
