import { useState } from 'react';
import { t } from '@/shared/i18n';
import { Button } from './Button';
import { Sheet } from './Sheet';

/**
 * Demande de confirmation avant une action destructrice.
 * Le bouton de confirmation **nomme l'action** (« Supprimer le voyage », pas « OK ») et le
 * texte dit ce qui sera perdu : on ne doit jamais confirmer sans savoir quoi.
 */
export function ConfirmSheet({
  open,
  onClose,
  title,
  message,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void> | void;
}) {
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="quiet" onClick={onClose}>
            {t.common.cancel}
          </Button>
          <Button variant="danger" onClick={() => void confirm()} disabled={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-ink-soft m-0 text-[15px] leading-relaxed">{message}</p>
    </Sheet>
  );
}
