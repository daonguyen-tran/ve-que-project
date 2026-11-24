import {
  createEntity,
  stopSchema,
  suggestStopColor,
  updateEntity,
  validateStopDates,
  type LocalDate,
  type Stop,
  type StopDateIssue,
  type StopColor,
  type StopKind,
  type Trip,
  type GeoPoint,
} from '@ve-que/domain';
import type { Repositories } from '@/infrastructure/repositories';

export interface StopInput {
  name: string;
  kind: StopKind;
  /** Absente : une couleur encore libre est choisie automatiquement (création, import). */
  color?: StopColor;
  arrivalDate: LocalDate;
  departureDate: LocalDate;
  /** Nom écrit en vietnamien (« Hội An »), à montrer sur place. */
  vietnameseName: string;
  notes: string;
  /**
   * Position GPS (M4). `undefined` : on garde celle déjà enregistrée ; `null` : on l'efface.
   */
  location?: GeoPoint | null;
}

/** Dates refusées par les règles du domaine ; `issues` dit pourquoi. */
export class StopDatesError extends Error {
  constructor(readonly issues: StopDateIssue[]) {
    super(`Dates d'étape invalides : ${issues.map((issue) => issue.code).join(', ')}`);
    this.name = 'StopDatesError';
  }
}

/**
 * Cas d'usage des étapes (F-2.1). Même modèle que `TripService` : le formulaire vérifie déjà
 * les dates pour afficher les erreurs, mais le service **revérifie** toujours, car il est la
 * dernière barrière avant la base (un import JSON, par exemple, ne passe pas par le formulaire).
 */
export class StopService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async createStop(trip: Trip, input: StopInput): Promise<Stop> {
    await this.assertDatesValid(trip, input);
    const color =
      input.color ?? suggestStopColor(await this.repositories.stops.listByTrip(trip.id));
    const stop = stopSchema.parse(
      createEntity<Stop>(
        {
          tripId: trip.id,
          name: input.name.trim(),
          kind: input.kind,
          color,
          arrivalDate: input.arrivalDate,
          departureDate: input.departureDate,
          place: {
            address: '',
            vietnamese: input.vietnameseName.trim(),
            location: input.location ?? null,
          },
          notes: input.notes.trim(),
        },
        this.clock(),
      ),
    );
    await this.repositories.stops.save(stop);
    return stop;
  }

  async updateStop(trip: Trip, stop: Stop, input: StopInput): Promise<Stop> {
    await this.assertDatesValid(trip, input, stop.id);
    const updated = stopSchema.parse(
      updateEntity(
        stop,
        {
          name: input.name.trim(),
          kind: input.kind,
          color: input.color ?? stop.color,
          arrivalDate: input.arrivalDate,
          departureDate: input.departureDate,
          place: {
            ...stop.place,
            vietnamese: input.vietnameseName.trim(),
            location: input.location === undefined ? stop.place.location : input.location,
          },
          notes: input.notes.trim(),
        },
        this.clock(),
      ),
    );
    await this.repositories.stops.save(updated);
    return updated;
  }

  /** Supprime l'étape, ses hébergements et les trajets qui en partent ou y arrivent. */
  async deleteStop(stop: Stop): Promise<void> {
    await this.repositories.transaction(async () => {
      const accommodations = await this.repositories.accommodations.listByTrip(stop.tripId);
      for (const accommodation of accommodations.filter((a) => a.stopId === stop.id)) {
        await this.repositories.accommodations.remove(accommodation.id);
      }
      const transfers = await this.repositories.transfers.listByTrip(stop.tripId);
      for (const transfer of transfers.filter(
        (tr) => tr.fromStopId === stop.id || tr.toStopId === stop.id,
      )) {
        await this.repositories.transfers.remove(transfer.id);
      }
      await this.repositories.stops.remove(stop.id);
    });
  }

  private async assertDatesValid(trip: Trip, input: StopInput, stopId?: string): Promise<void> {
    const others = await this.repositories.stops.listByTrip(trip.id);
    const issues = validateStopDates({ ...input, id: stopId }, trip, others);
    if (issues.length > 0) throw new StopDatesError(issues);
  }
}
