import { Bookmark, CloudOff, Globe, Loader2, MapPin } from 'lucide-react';
import { useId, useState, type KeyboardEvent } from 'react';
import type { LocalitySuggestion } from '@ve-que/domain';
import { STOP_KIND_STYLE } from '@/features/itinerary/stop-style';
import type { OnlineLocalitySearch } from '@/infrastructure/geocoding/photon-locality-search';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { controlClass, describedBy } from '@/shared/ui/form/field-chrome';
import { FieldFrame } from '@/shared/ui/form/fields';
import { PICKER_PANEL_CLASS } from '@/shared/ui/picker/picker-cell';
import { useLocalitySuggestions, type OnlineState } from '../hooks/use-locality-suggestions';

/**
 * Champ « Nom » d'une étape, avec suggestions de lieux sous le champ.
 *
 * Motif ARIA « combobox » (liste de suggestions) :
 * - le focus reste dans le champ ; flèches haut et bas pour parcourir les suggestions,
 *   Entrée pour choisir, Échap pour fermer la liste ;
 * - la suggestion active est signalée par `aria-activedescendant` (pas par le focus) ;
 * - les suggestions sont groupées par provenance (mes lieux, lieux connus, en ligne).
 *
 * Choisir n'est jamais obligatoire : le texte tapé reste le nom de l'étape. Le composant ne
 * fait qu'afficher ; c'est l'appelant qui décide quoi remplir avec la suggestion (`onPick`).
 */
export function LocalityNameField({
  label,
  placeholder,
  error,
  value,
  onChange,
  onBlur,
  onPick,
  online,
}: {
  label: string;
  placeholder?: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onPick: (suggestion: LocalitySuggestion) => void;
  /** Recherche en ligne à utiliser (remplaçable dans les tests). */
  online?: OnlineLocalitySearch;
}) {
  const id = useId();
  const listId = useId();
  const statusId = useId();
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const suggestions = useLocalitySuggestions(value, { enabled: open, online });

  const groups = (
    [
      { source: 'saved', title: t.localities.groups.saved, items: suggestions.saved },
      { source: 'builtin', title: t.localities.groups.builtin, items: suggestions.builtin },
      { source: 'online', title: t.localities.groups.online, items: suggestions.online },
    ] as const
  ).filter((group) => group.items.length > 0);
  // Liste à plat, dans l'ordre d'affichage : c'est elle que parcourent les flèches.
  const flat = groups.flatMap((group) => group.items);
  const status = statusText(suggestions.onlineState);
  const expanded = open && value.trim().length > 0 && (flat.length > 0 || status !== null);
  const optionId = (suggestion: LocalitySuggestion) => `${listId}-${suggestion.key}`;
  const active = expanded ? flat[activeIndex] : undefined;

  const pick = (suggestion: LocalitySuggestion) => {
    onPick(suggestion);
    setOpen(false);
    setActiveIndex(-1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      if (flat.length === 0) return;
      const step = event.key === 'ArrowDown' ? 1 : -1;
      // On boucle : après la dernière suggestion, on revient à la première.
      setActiveIndex((index) => (index + step + flat.length) % flat.length);
    } else if (event.key === 'Enter' && active) {
      // Entrée choisit la suggestion active au lieu d'envoyer le formulaire.
      event.preventDefault();
      pick(active);
    } else if (event.key === 'Escape' && expanded) {
      // On ferme la liste sans fermer le panneau (<dialog>) qui contient le formulaire.
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <FieldFrame id={id} label={label} error={error}>
        <input
          id={id}
          type="text"
          role="combobox"
          autoComplete="off"
          spellCheck={false}
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={listId}
          aria-activedescendant={active ? optionId(active) : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, { error }) ?? statusId}
          placeholder={placeholder}
          value={value}
          onChange={(event) => {
            onChange(event.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            setOpen(false);
            onBlur?.();
          }}
          onKeyDown={onKeyDown}
          className={controlClass(Boolean(error))}
        />
      </FieldFrame>

      <div hidden={!expanded} className={cn(PICKER_PANEL_CLASS, 'flex flex-col gap-1 py-1.5')}>
        <ul
          id={listId}
          role="listbox"
          aria-label={t.localities.listLabel}
          className="m-0 list-none p-0"
        >
          {groups.map((group) => (
            <li key={group.source} role="group" aria-labelledby={`${listId}-${group.source}`}>
              <span
                id={`${listId}-${group.source}`}
                role="presentation"
                className="text-muted flex items-center gap-1.5 px-2 pt-1.5 pb-1 text-xs font-medium"
              >
                <SourceIcon source={group.source} />
                {group.title}
              </span>
              <ul role="none" className="m-0 list-none p-0">
                {group.items.map((suggestion) => (
                  <SuggestionOption
                    key={suggestion.key}
                    id={optionId(suggestion)}
                    suggestion={suggestion}
                    active={suggestion === active}
                    // `mousedown` plutôt que `click` : il passe avant la perte de focus du
                    // champ, qui fermerait la liste avant que le clic n'arrive.
                    onChoose={() => pick(suggestion)}
                  />
                ))}
              </ul>
            </li>
          ))}
        </ul>
        {status && (
          <p className="text-muted m-0 flex items-center gap-1.5 px-2 py-1.5 text-[13px]">
            <StatusIcon state={suggestions.onlineState} />
            {status}
          </p>
        )}
      </div>
      {/* Annonce pour les lecteurs d'écran : nombre de suggestions et état de la recherche. */}
      <p id={statusId} className="sr-only" aria-live="polite">
        {expanded ? [t.localities.count(flat.length), status].filter(Boolean).join('. ') : ''}
      </p>
    </div>
  );
}

function SuggestionOption({
  id,
  suggestion,
  active,
  onChoose,
}: {
  id: string;
  suggestion: LocalitySuggestion;
  active: boolean;
  onChoose: () => void;
}) {
  const { icon: KindIcon, label: kindLabel } = STOP_KIND_STYLE[suggestion.kind];
  const secondary = [
    suggestion.vietnameseName !== suggestion.name ? suggestion.vietnameseName : null,
    suggestion.detail,
    kindLabel,
  ]
    .filter(Boolean)
    .join(' · ');
  return (
    <li
      id={id}
      role="option"
      aria-selected={active}
      onMouseDown={(event) => {
        event.preventDefault();
        onChoose();
      }}
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5',
        active ? 'bg-laque-tint' : 'hover:bg-ground',
      )}
    >
      <KindIcon className="text-muted size-[18px] shrink-0" strokeWidth={1.9} aria-hidden="true" />
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-[15px] font-medium">{suggestion.name}</span>
        <span lang="vi" className="text-muted truncate text-[13px]">
          {secondary}
        </span>
      </span>
    </li>
  );
}

function SourceIcon({ source }: { source: LocalitySuggestion['source'] }) {
  const Icon = source === 'saved' ? Bookmark : source === 'builtin' ? MapPin : Globe;
  return <Icon className="size-3.5" strokeWidth={2} aria-hidden="true" />;
}

function StatusIcon({ state }: { state: OnlineState }) {
  if (state === 'loading') {
    return (
      <Loader2 className="size-3.5 animate-spin motion-reduce:animate-none" aria-hidden="true" />
    );
  }
  if (state === 'offline') return <CloudOff className="size-3.5" aria-hidden="true" />;
  return null;
}

function statusText(state: OnlineState): string | null {
  if (state === 'loading') return t.localities.searching;
  if (state === 'offline') return t.localities.offline;
  if (state === 'error') return t.localities.onlineError;
  return null;
}
