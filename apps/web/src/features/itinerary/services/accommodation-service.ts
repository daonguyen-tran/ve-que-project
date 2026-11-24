import {
  accommodationSchema,
  createEntity,
  updateEntity,
  type Accommodation,
  type BookingStatus,
  type GeoPoint,
  type Money,
  type Stop,
} from '@ve-que/domain';
import type { Repositories } from '@/infrastructure/repositories';

export interface AccommodationInput {
  name: string;
  status: BookingStatus;
  /** Prix total du séjour, dans sa devise ; `null` si inconnu. */
  price: Money | null;
  bookingRef: string;
  url: string | null;
  address: string;
  vietnameseAddress: string;
  /**
   * Position GPS (M4). `undefined` : on garde celle déjà enregistrée ; `null` : on l'efface.
   */
  location?: GeoPoint | null;
}

/** Cas d'usage des hébergements d'une étape (F-2.2). */
export class AccommodationService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async create(stop: Stop, input: AccommodationInput): Promise<Accommodation> {
    const accommodation = accommodationSchema.parse(
      createEntity<Accommodation>(
        {
          tripId: stop.tripId,
          stopId: stop.id,
          ...this.fields(input),
          place: this.place(input, input.location ?? null),
        },
        this.clock(),
      ),
    );
    await this.repositories.accommodations.save(accommodation);
    return accommodation;
  }

  async update(accommodation: Accommodation, input: AccommodationInput): Promise<Accommodation> {
    const updated = accommodationSchema.parse(
      updateEntity(
        accommodation,
        {
          ...this.fields(input),
          place: this.place(
            input,
            input.location === undefined ? accommodation.place.location : input.location,
          ),
        },
        this.clock(),
      ),
    );
    await this.repositories.accommodations.save(updated);
    return updated;
  }

  async remove(accommodation: Accommodation): Promise<void> {
    await this.repositories.accommodations.remove(accommodation.id);
  }

  private fields(input: AccommodationInput) {
    return {
      name: input.name.trim(),
      status: input.status,
      price: input.price,
      bookingRef: input.bookingRef.trim(),
      url: input.url?.trim() || null,
    };
  }

  /** La position GPS existante est conservée : elle sera choisie sur la carte (lot 8). */
  private place(input: AccommodationInput, location: Accommodation['place']['location']) {
    return { address: input.address.trim(), vietnamese: input.vietnameseAddress.trim(), location };
  }
}
