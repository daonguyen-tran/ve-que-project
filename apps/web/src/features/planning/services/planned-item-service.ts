import {
  createEntity,
  nextPosition,
  plannedItemSchema,
  updateEntity,
  type GeoPoint,
  type LocalDate,
  type LocalTime,
  type Money,
  type PlannedItem,
  type PlannedItemKind,
  type PlannedItemStatus,
  type Trip,
} from '@ve-que/domain';
import type { Repositories } from '@/infrastructure/repositories';

export interface PlannedItemInput {
  date: LocalDate;
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
  /**
   * Position GPS (M4). `undefined` : on garde celle déjà enregistrée ; `null` : on l'efface.
   */
  location?: GeoPoint | null;
}

/**
 * Cas d'usage du programme des journées (F-2.5 à F-2.9).
 *
 * Une journée est une liste chronologique (voir `compareInDay`) : l'heure range les éléments
 * horodatés, et `position` (rang d'ajout dans la journée) ordonne ceux qui n'ont pas d'heure.
 * Ajouter ou changer de jour place donc simplement l'élément après les autres de ce jour ;
 * aucun autre élément n'est réécrit.
 */
export class PlannedItemService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  /** Ajoute un élément à la fin de sa journée (ou à son heure, s'il en a une). */
  async create(trip: Trip, input: PlannedItemInput): Promise<PlannedItem> {
    return this.repositories.transaction(async () => {
      const items = await this.repositories.plannedItems.listByTrip(trip.id);
      const item = plannedItemSchema.parse(
        createEntity<PlannedItem>(
          {
            tripId: trip.id,
            ideaId: input.ideaId ?? null,
            ...this.content(input, input.location ?? null),
            date: input.date,
            time: input.time,
            position: nextPosition(items, input.date),
          },
          this.clock(),
        ),
      );
      await this.repositories.plannedItems.save(item);
      return item;
    });
  }

  /**
   * Modifie un élément. S'il change de jour, il passe après les éléments de son nouveau jour ;
   * sinon il garde son rang. Changer l'heure suffit à le replacer dans la journée.
   */
  async update(item: PlannedItem, input: PlannedItemInput): Promise<PlannedItem> {
    return this.repositories.transaction(async () => {
      // On repart de la version en base, au cas où l'élément aurait changé depuis sa lecture.
      const current = (await this.repositories.plannedItems.getById(item.id)) ?? item;
      const position =
        current.date === input.date
          ? current.position
          : nextPosition(
              await this.repositories.plannedItems.listByTrip(item.tripId),
              input.date,
              current.id,
            );
      const edited = plannedItemSchema.parse(
        updateEntity(
          current,
          {
            ...this.content(
              input,
              input.location === undefined ? (current.place?.location ?? null) : input.location,
            ),
            date: input.date,
            time: input.time,
            position,
          },
          this.clock(),
        ),
      );
      await this.repositories.plannedItems.save(edited);
      return edited;
    });
  }

  async setStatus(item: PlannedItem, status: PlannedItemStatus): Promise<void> {
    const current = (await this.repositories.plannedItems.getById(item.id)) ?? item;
    await this.repositories.plannedItems.save(updateEntity(current, { status }, this.clock()));
  }

  /** Les autres éléments du jour gardent leurs rangs : un trou ne gêne pas le tri. */
  async remove(item: PlannedItem): Promise<void> {
    await this.repositories.plannedItems.remove(item.id);
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
