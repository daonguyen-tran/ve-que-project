import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus } from 'lucide-react';
import type { PlannedItem, PlannedItemKind, TimeSlot } from '@ve-que/domain';
import { t } from '@/shared/i18n';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import type { ContainerId } from '../plan-board';
import { KIND_STYLE, SLOT_ICON } from '../plan-style';
import { PlanItemCard } from './PlanItemCard';

/**
 * Un créneau : titre, éléments réordonnables, et ajouts rapides quand il est vide. Toute la
 * liste est une zone de dépôt, y compris vide : on peut y glisser un élément d'un autre créneau.
 */
export function SlotSection({
  id,
  slot,
  items,
  quickKinds,
  isOver,
  onAdd,
  onQuickAdd,
  onOpen,
}: {
  id: ContainerId;
  slot: TimeSlot;
  items: PlannedItem[];
  /** Types proposés en un geste dans un créneau vide (« En famille » d'abord au village). */
  quickKinds: readonly PlannedItemKind[];
  isOver: boolean;
  onAdd: () => void;
  onQuickAdd: (kind: PlannedItemKind) => void;
  onOpen: (item: PlannedItem) => void;
}) {
  const { setNodeRef } = useDroppable({ id });
  const Icon = SLOT_ICON[slot];
  const headingId = `${id}-title`;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 pl-1">
        <h3
          id={headingId}
          className="text-ink-soft m-0 flex items-center gap-2 text-[15px] font-semibold"
        >
          <Icon className="text-muted size-[18px]" strokeWidth={1.9} aria-hidden="true" />
          {t.slots[slot]}
        </h3>
        <Button
          variant="quiet"
          onClick={onAdd}
          aria-label={t.plan.addTo(t.slots[slot])}
          className="min-h-10 px-3 text-sm"
        >
          <Plus className="size-[18px]" strokeWidth={2} aria-hidden="true" />
          {t.plan.add}
        </Button>
      </div>

      <SortableContext
        id={id}
        items={items.map((item) => item.id)}
        strategy={verticalListSortingStrategy}
      >
        <ol
          ref={setNodeRef}
          className={cn(
            'm-0 flex min-h-14 list-none flex-col gap-2 rounded-xl p-0 transition-colors duration-150',
            isOver && items.length === 0 && 'bg-laque-tint',
          )}
        >
          {items.map((item) => (
            <SortablePlanItem key={item.id} item={item} onOpen={() => onOpen(item)} />
          ))}
          {items.length === 0 && (
            // Créneau vide : le pointillé dit « rien de prévu », les boutons disent quoi faire.
            <li className="border-line grid grid-cols-2 gap-1 rounded-xl border border-dashed p-1">
              <span className="sr-only">{t.plan.emptySlot}</span>
              {quickKinds.map((kind) => {
                const KindIcon = KIND_STYLE[kind].icon;
                return (
                  <Button
                    key={kind}
                    variant="quiet"
                    onClick={() => onQuickAdd(kind)}
                    className="min-h-11 px-2 text-sm"
                  >
                    <KindIcon className="size-4 shrink-0" strokeWidth={1.9} aria-hidden="true" />
                    {KIND_STYLE[kind].label}
                  </Button>
                );
              })}
            </li>
          )}
        </ol>
      </SortableContext>
    </section>
  );
}

/**
 * Élément réordonnable. dnd-kit déplace l'élément avec `transform` (pas de mise en page
 * recalculée) ; pendant le glisser, la carte d'origine reste en « fantôme » et c'est la copie
 * dans le `DragOverlay` qui suit le doigt.
 */
function SortablePlanItem({ item, onOpen }: { item: PlannedItem; onOpen: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className="list-none"
    >
      <PlanItemCard
        item={item}
        onOpen={onOpen}
        ghost={isDragging}
        handleRef={setActivatorNodeRef}
        handleProps={{ ...attributes, ...listeners }}
      />
    </li>
  );
}
