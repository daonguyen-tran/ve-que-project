import {
  closestCorners,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useMemo, useState } from 'react';
import {
  defaultItemKind,
  TIME_SLOTS,
  type LocalDate,
  type PlannedItem,
  type PlannedItemKind,
  type Transfer,
  type Trip,
  type TripDay,
} from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { formatShortDate } from '@/shared/lib/format-date';
import { useMediaQuery } from '@/shared/lib/use-media-query';
import { usePlannedItemService, type TripCalendar } from '../hooks/use-day-plan';
import {
  buildColumns,
  containerId,
  findContainer,
  idsIn,
  moveAcross,
  moveWithin,
  parseContainerId,
  type Columns,
  type ContainerId,
} from '../plan-board';
import type { PlannedItemSheetTarget } from '../planned-item-form';
import { DayHeading } from './DayHeading';
import { PlanItemCard } from './PlanItemCard';
import { SlotSection } from './SlotSection';
import { TransferNote } from './TransferNote';

/**
 * Programme d'un ou plusieurs jours côte à côte, avec glisser-déposer (F-2.9).
 *
 * Pendant le glisser, on travaille sur une copie locale des colonnes (`override`) : l'élément
 * saute de créneau à chaque survol pour faire de la place sous le doigt. Au dépôt, on écrit en
 * base via le service. L'override est rattaché aux colonnes dont il est issu (`base`) : dès que
 * la base renvoie des données nouvelles (après l'écriture), il devient obsolète et l'affichage
 * repasse sur les vraies données, sans clignotement ni effet à synchroniser.
 */
export function DayBoard({
  trip,
  calendar,
  days,
  items,
  transfers,
  showDayHeadings,
  onOpenSheet,
}: {
  trip: Trip;
  calendar: TripCalendar;
  days: TripDay[];
  items: PlannedItem[];
  transfers: Transfer[];
  showDayHeadings: boolean;
  onOpenSheet: (target: PlannedItemSheetTarget) => void;
}) {
  const service = usePlannedItemService();
  const reducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const dates = useMemo(() => days.map((day) => day.date), [days]);
  const base = useMemo(() => buildColumns(items, dates), [items, dates]);
  const [override, setOverride] = useState<{ base: Columns; columns: Columns } | null>(null);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const columns = override?.base === base ? override.columns : base;

  const byId = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);
  const activeItem = activeId ? byId.get(String(activeId)) : undefined;

  const sensors = useSensors(
    // Sur la poignée seulement : 4 px de mouvement suffisent à distinguer un glisser d'un clic.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const describe = (id: UniqueIdentifier | undefined) => {
    if (id === undefined) return '';
    const key = findContainer(columns, String(id));
    if (!key) return '';
    const { date, slot } = parseContainerId(key);
    return t.plan.dnd.place(t.slots[slot], formatShortDate(date));
  };
  const titleOf = (id: UniqueIdentifier) => byId.get(String(id))?.title ?? '';
  const announcements: Announcements = {
    onDragStart: ({ active }) => t.plan.dnd.picked(titleOf(active.id)),
    onDragOver: ({ active, over }) =>
      over ? t.plan.dnd.over(titleOf(active.id), describe(over.id)) : undefined,
    onDragEnd: ({ active, over }) =>
      over ? t.plan.dnd.dropped(titleOf(active.id), describe(over.id)) : undefined,
    onDragCancel: ({ active }) => t.plan.dnd.cancelled(titleOf(active.id)),
  };

  function onDragStart({ active }: DragStartEvent) {
    setActiveId(active.id);
    setOverride({ base, columns: base });
  }

  function onDragOver({ active, over }: DragOverEvent) {
    if (!over) return;
    // La carte déplacée a-t-elle dépassé le bas de l'élément survolé ? On se place alors après.
    const dragged = active.rect.current.translated;
    const below = dragged !== null && dragged.top > over.rect.top + over.rect.height / 2;
    setOverride((current) => {
      const from = current?.base === base ? current.columns : base;
      const next = moveAcross(from, String(active.id), String(over.id), below);
      return next === from ? current : { base, columns: next };
    });
  }

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null);
    const item = byId.get(String(active.id));
    if (!over || !item) {
      setOverride(null);
      return;
    }
    const arranged = moveWithin(columns, String(active.id), String(over.id));
    const key = findContainer(arranged, String(active.id));
    if (!key) {
      setOverride(null);
      return;
    }
    const { date, slot } = parseContainerId(key);
    const index = idsIn(arranged, key).indexOf(String(active.id));
    if (date === item.date && slot === item.slot && index === base[key]?.indexOf(item.id)) {
      setOverride(null);
      return;
    }
    // L'affichage garde la nouvelle place jusqu'à ce que la base renvoie l'état écrit.
    setOverride({ base, columns: arranged });
    void service.move(item, { date, slot, index }).catch(() => setOverride(null));
  }

  const quickAdd = (date: LocalDate, slot: PlannedItem['slot'], kind: PlannedItemKind) => {
    if (kind === 'activity') {
      onOpenSheet({ mode: 'create', date, slot, kind });
      return;
    }
    // Temps libre et moment en famille s'ajoutent en un geste ; on pourra préciser ensuite.
    void service.create(trip, {
      date,
      slot,
      kind,
      title: t.plan.kinds[kind],
      time: null,
      address: '',
      vietnameseAddress: '',
      durationMinutes: null,
      estimatedCost: null,
      status: 'planned',
      notes: '',
    });
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      accessibility={{
        announcements,
        screenReaderInstructions: { draggable: t.plan.dnd.instructions },
      }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveId(null);
        setOverride(null);
      }}
    >
      <div
        className="grid gap-x-6 gap-y-8"
        style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
      >
        {days.map((day) => {
          const stop = day.stopId ? calendar.stopsById.get(day.stopId) : undefined;
          const kinds = quickKindsFor(defaultItemKind(stop?.kind ?? null));
          const overKey = activeId ? findContainer(columns, String(activeId)) : undefined;
          return (
            <div key={day.date} className="flex min-w-0 flex-col gap-5">
              {showDayHeadings && <DayHeading day={day} total={calendar.days.length} stop={stop} />}
              <TransferNote day={day} transfers={transfers} calendar={calendar} showMissing />
              {TIME_SLOTS.map((slot) => {
                const key: ContainerId = containerId(day.date, slot);
                const slotItemsList = idsIn(columns, key)
                  .map((id) => byId.get(id))
                  .filter((item): item is PlannedItem => item !== undefined);
                return (
                  <SlotSection
                    key={key}
                    id={key}
                    slot={slot}
                    items={slotItemsList}
                    quickKinds={kinds}
                    isOver={overKey === key}
                    onAdd={() =>
                      onOpenSheet({
                        mode: 'create',
                        date: day.date,
                        slot,
                        kind: defaultItemKind(stop?.kind ?? null),
                      })
                    }
                    onQuickAdd={(kind) => quickAdd(day.date, slot, kind)}
                    onOpen={(item) => onOpenSheet({ mode: 'edit', item })}
                  />
                );
              })}
            </div>
          );
        })}
      </div>

      <DragOverlay
        dropAnimation={
          reducedMotion ? null : { duration: 180, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
        }
      >
        {activeItem ? <PlanItemCard item={activeItem} lifted /> : null}
      </DragOverlay>
    </DndContext>
  );
}

/** Ajouts rapides d'un créneau vide : le type par défaut d'abord, puis le temps libre. */
function quickKindsFor(preferred: PlannedItemKind): PlannedItemKind[] {
  return preferred === 'family' ? ['family', 'free_time'] : ['free_time', 'activity'];
}
