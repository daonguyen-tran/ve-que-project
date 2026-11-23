import {
  createEntity,
  insertionIndex,
  plannedItemSchema,
  planMove,
  slotItems,
  updateEntity,
  type LocalDate,
  type LocalTime,
  type Money,
  type PlacementChange,
  type PlacementTarget,
  type PlannedItem,
  type PlannedItemKind,
  type PlannedItemStatus,
  type TimeSlot,
  type Trip,
} from '@ve-que/domain';
import type { Repositories } from '@/infrastructure/repositories';

export interface PlannedItemInput {
  date: LocalDate;
  slot: TimeSlot;
  time: LocalTime | null;
  kind: PlannedItemKind;
  title: string;
  address: string;
  vietnameseAddress: string;
  durationMinutes: number | null;
  estimatedCost: Money | null;
  status: PlannedItemStatus;
  notes: string;
  /** Idée de la banque d'idées dont l'élément est issu (F-3.3), à l'ajout seulement. */
  ideaId?: string | null;
}

/**
 * Cas d'usage du programme des journées (F-2.5 à F-2.9).
 *
 * Toute opération qui change la place d'un élément passe par `planMove` (domaine), qui
 * renumérote les créneaux touchés ; les écritures sont groupées dans une transaction pour
 * qu'un créneau ne reste jamais à moitié renuméroté.
 */
export class PlannedItemService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  /** Ajoute un élément ; avec une heure, il se range parmi les éléments déjà horodatés. */
  async create(trip: Trip, input: PlannedItemInput): Promise<PlannedItem> {
    return this.repositories.transaction(async () => {
      const items = await this.repositories.plannedItems.listByTrip(trip.id);
      const target = slotItems(items, input.date, input.slot);
      const item = plannedItemSchema.parse(
        createEntity<PlannedItem>(
          {
            tripId: trip.id,
            ideaId: input.ideaId ?? null,
            ...this.content(input, null),
            date: input.date,
            slot: input.slot,
            time: input.time,
            position: target.length,
          },
          this.clock(),
        ),
      );
      const placed = await this.place([...items, item], item, {
        date: input.date,
        slot: input.slot,
        index: insertionIndex(target, input.time),
      });
      return placed;
    });
  }

  /**
   * Modifie un élément. S'il change de jour, de créneau ou d'heure, il est replacé comme à
   * l'ajout ; sinon il garde son rang.
   */
  async update(item: PlannedItem, input: PlannedItemInput): Promise<PlannedItem> {
    return this.repositories.transaction(async () => {
      // On repart de la version en base : la position de `item` a pu changer depuis qu'il a
      // été lu (un autre élément ajouté avant lui dans le créneau, par exemple).
      const current = (await this.repositories.plannedItems.getById(item.id)) ?? item;
      const edited = plannedItemSchema.parse(
        updateEntity(
          current,
          { ...this.content(input, current.place?.location ?? null), time: input.time },
          this.clock(),
        ),
      );
      const moved =
        current.date !== input.date || current.slot !== input.slot || current.time !== input.time;
      if (!moved) {
        await this.repositories.plannedItems.save(edited);
        return edited;
      }
      const others = (await this.repositories.plannedItems.listByTrip(item.tripId)).filter(
        (other) => other.id !== current.id,
      );
      const target = slotItems(others, input.date, input.slot);
      return this.place([...others, edited], edited, {
        date: input.date,
        slot: input.slot,
        index: insertionIndex(target, input.time),
      });
    });
  }

  /** Glisser-déposer ou action « Déplacer » : l'heure éventuelle est conservée. */
  async move(item: PlannedItem, target: PlacementTarget): Promise<void> {
    await this.repositories.transaction(async () => {
      const items = await this.repositories.plannedItems.listByTrip(item.tripId);
      const current = items.find((other) => other.id === item.id);
      if (current) await this.place(items, current, target);
    });
  }

  async setStatus(item: PlannedItem, status: PlannedItemStatus): Promise<void> {
    const current = (await this.repositories.plannedItems.getById(item.id)) ?? item;
    await this.repositories.plannedItems.save(updateEntity(current, { status }, this.clock()));
  }

  /** Les autres éléments du créneau gardent leurs positions : un trou ne gêne pas le tri. */
  async remove(item: PlannedItem): Promise<void> {
    await this.repositories.plannedItems.remove(item.id);
  }

  /**
   * Place `item` à `target` puis enregistre l'élément et tous ceux dont le rang a changé.
   * `items` doit contenir `item` dans sa version à enregistrer.
   */
  private async place(
    items: PlannedItem[],
    item: PlannedItem,
    target: PlacementTarget,
  ): Promise<PlannedItem> {
    const changes = new Map<string, PlacementChange>(
      planMove(items, item.id, target).map((change) => [change.id, change]),
    );
    const now = this.clock();
    const toSave: PlannedItem[] = [];
    let saved = item;
    for (const candidate of items) {
      const change = changes.get(candidate.id);
      if (candidate.id === item.id) {
        saved = change ? updateEntity(candidate, placement(change), now) : candidate;
        toSave.push(saved);
      } else if (change) {
        toSave.push(updateEntity(candidate, placement(change), now));
      }
    }
    await this.repositories.plannedItems.saveMany(toSave);
    return saved;
  }

  private content(input: PlannedItemInput, location: { lat: number; lng: number } | null) {
    const address = input.address.trim();
    const vietnamese = input.vietnameseAddress.trim();
    return {
      kind: input.kind,
      title: input.title.trim(),
      place: address || vietnamese || location ? { address, vietnamese, location } : null,
      durationMinutes: input.durationMinutes,
      estimatedCost: input.estimatedCost,
      status: input.status,
      notes: input.notes.trim(),
    };
  }
}

function placement(change: PlacementChange) {
  return { date: change.date, slot: change.slot, position: change.position };
}
