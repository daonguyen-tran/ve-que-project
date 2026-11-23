import { zodResolver } from '@hookform/resolvers/zod';
import { UserMinus } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { EntityId, Member } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { Button } from '@/shared/ui/Button';
import { ConfirmSheet } from '@/shared/ui/ConfirmSheet';
import { TextField } from '@/shared/ui/form/fields';
import { Sheet } from '@/shared/ui/Sheet';
import { useTripService } from '../hooks/use-trips';
import { memberFormSchema, type MemberFormValues } from '../trip-form-schemas';

/**
 * Ajout (`member` absent) ou modification d'un voyageur. Le retrait passe par une
 * confirmation ; il n'est pas proposé pour « Moi ».
 */
export function MemberSheet({
  tripId,
  member,
  open,
  onClose,
}: {
  tripId: EntityId;
  member?: Member;
  open: boolean;
  onClose: () => void;
}) {
  const tripService = useTripService();
  const formId = useId();
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [saveError, setSaveError] = useState(false);
  // Fermer efface aussi un éventuel message d'erreur : il ne doit pas réapparaître à la réouverture.
  const close = () => {
    setSaveError(false);
    onClose();
  };
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: { name: '' },
  });

  useEffect(() => {
    if (open) {
      reset({ name: member?.name ?? '' });
    }
  }, [open, member, reset]);

  const onSubmit = handleSubmit(async ({ name }) => {
    setSaveError(false);
    try {
      if (member) await tripService.renameMember(member, name);
      else await tripService.addMember(tripId, name);
      close();
    } catch {
      setSaveError(true);
    }
  });

  return (
    <>
      <Sheet
        open={open && !confirmRemove}
        onClose={close}
        title={member ? t.members.editTitle : t.members.addTitle}
        footer={
          <>
            <Button variant="quiet" onClick={close}>
              {t.common.cancel}
            </Button>
            <Button type="submit" form={formId} disabled={isSubmitting}>
              {t.common.save}
            </Button>
          </>
        }
      >
        <form
          id={formId}
          noValidate
          onSubmit={(event) => void onSubmit(event)}
          className="flex flex-col gap-3"
        >
          <TextField
            label={t.members.nameLabel}
            autoComplete="off"
            error={errors.name?.message}
            hint={member?.isMe ? t.members.ownerHint : undefined}
            {...register('name')}
          />
          {saveError && (
            <p role="alert" className="text-laque-deep m-0 text-[15px] font-medium">
              {t.validation.saveFailed}
            </p>
          )}
          {member && !member.isMe && (
            <Button
              variant="quiet"
              onClick={() => setConfirmRemove(true)}
              className="-ml-4 self-start"
            >
              <UserMinus className="size-5" strokeWidth={1.9} aria-hidden="true" />
              {t.members.remove}
            </Button>
          )}
        </form>
      </Sheet>

      {member && (
        <ConfirmSheet
          open={confirmRemove}
          onClose={() => {
            setConfirmRemove(false);
            onClose();
          }}
          title={t.members.removeTitle}
          message={t.members.removeMessage(member.name)}
          confirmLabel={t.members.remove}
          onConfirm={() => tripService.removeMember(member)}
        />
      )}
    </>
  );
}
