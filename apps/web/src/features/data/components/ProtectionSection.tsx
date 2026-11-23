import { ShieldAlert, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { t } from '@/shared/i18n';
import {
  getPersistenceStatus,
  requestPersistentStorage,
  type PersistenceStatus,
} from '@/infrastructure/storage/persistent-storage';
import { Button } from '@/shared/ui/Button';
import { DataSection } from './DataSection';

/** État du stockage persistant (F-15.3), avec un bouton pour le redemander. */
export function ProtectionSection() {
  const [status, setStatus] = useState<PersistenceStatus | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getPersistenceStatus().then((value) => {
      if (!cancelled) setStatus(value);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (status === null) return null;
  const safe = status === 'persisted';
  const Icon = safe ? ShieldCheck : ShieldAlert;

  return (
    <DataSection id="data-protection" title={t.data.protectionTitle}>
      <div className="flex items-start gap-3">
        <Icon
          className={safe ? 'text-success size-5 shrink-0' : 'text-laque-deep size-5 shrink-0'}
          strokeWidth={1.9}
          aria-hidden="true"
        />
        <p className="text-ink-soft m-0 text-[15px] leading-relaxed">
          {safe
            ? t.data.persisted
            : status === 'unsupported'
              ? t.data.unsupported
              : t.data.notPersisted}
        </p>
      </div>
      {status === 'best-effort' && (
        <Button
          variant="secondary"
          className="self-start"
          onClick={() => void requestPersistentStorage().then(setStatus)}
        >
          {t.data.protect}
        </Button>
      )}
    </DataSection>
  );
}
