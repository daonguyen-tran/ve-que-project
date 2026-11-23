import {
  createEntity,
  groupCost,
  ideaSchema,
  updateEntity,
  type Idea,
  type IdeaCategory,
  type LocalDate,
  type LocalTime,
  type Money,
  type OpeningRange,
  type PlannedItem,
  type TimeSlot,
  type Trip,
} from '@ve-que/domain';
import { PlannedItemService } from '@/features/planning/services/planned-item-service';
import type { Repositories } from '@/infrastructure/repositories';

export interface IdeaInput {
  city: string;
  title: string;
  category: IdeaCategory;
  durationMinutes: number;
  pricePerPerson: Money | null;
  /** `null` = horaires inconnus. */
  openingHours: OpeningRange[] | null;
  indoor: boolean;
  priority: Idea['priority'];
  url: string | null;
  address: string;
  vietnameseAddress: string;
  notes: string;
}

/**
 * Cas d'usage de la banque d'idées (F-3.1, F-3.3).
 *
 * Planifier une idée **copie** ses informations dans un élément du programme, relié par
 * `ideaId`. Modifier l'idée ensuite ne change donc pas ce qui est déjà planifié (le coût prévu
 * pour un jour donné ne bouge pas tout seul), et la supprimer ne vide pas le programme.
 */
export class IdeaService {
  private readonly plannedItems: PlannedItemService;

  constructor(
    private readonly repositories: Repositories,
    private readonly clock: () => Date = () => new Date(),
  ) {
    this.plannedItems = new PlannedItemService(repositories, clock);
  }

  async create(trip: Trip, input: IdeaInput): Promise<Idea> {
    const idea = ideaSchema.parse(
      createEntity<Idea>({ tripId: trip.id, ...this.fields(input, null) }, this.clock()),
    );
    await this.repositories.ideas.save(idea);
    return idea;
  }

  async update(idea: Idea, input: IdeaInput): Promise<Idea> {
    const updated = ideaSchema.parse(
      updateEntity(idea, this.fields(input, idea.place.location), this.clock()),
    );
    await this.repositories.ideas.save(updated);
    return updated;
  }

  async remove(idea: Idea): Promise<void> {
    await this.repositories.ideas.remove(idea.id);
  }

  /** Place l'idée dans un créneau ; le coût prévu est le prix par personne × voyageurs. */
  async plan(
    trip: Trip,
    idea: Idea,
    when: { date: LocalDate; slot: TimeSlot; time: LocalTime | null },
    travellers: number,
  ): Promise<PlannedItem> {
    return this.plannedItems.create(trip, {
      ...when,
      kind: 'activity',
      ideaId: idea.id,
      title: idea.title,
      address: idea.place.address,
      vietnameseAddress: idea.place.vietnamese,
      durationMinutes: idea.durationMinutes,
      estimatedCost: groupCost(idea.pricePerPerson, travellers),
      status: 'planned',
      notes: '',
    });
  }

  private fields(input: IdeaInput, location: Idea['place']['location']) {
    return {
      city: input.city.trim(),
      title: input.title.trim(),
      category: input.category,
      durationMinutes: input.durationMinutes,
      pricePerPerson: input.pricePerPerson,
      openingHours: input.openingHours && input.openingHours.length > 0 ? input.openingHours : null,
      indoor: input.indoor,
      priority: input.priority,
      url: input.url?.trim() || null,
      // La position GPS existante est conservée : elle se choisira sur la carte (lot 8).
      place: {
        address: input.address.trim(),
        vietnamese: input.vietnameseAddress.trim(),
        location,
      },
      notes: input.notes.trim(),
    };
  }
}
