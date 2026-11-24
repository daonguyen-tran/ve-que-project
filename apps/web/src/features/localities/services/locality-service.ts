import {
  createEntity,
  localitySchema,
  searchKey,
  updateEntity,
  type GeoPoint,
  type Locality,
  type StopKind,
} from '@ve-que/domain';
import type { Repositories } from '@/infrastructure/repositories';

export interface LocalityInput {
  name: string;
  vietnameseName: string;
  kind: StopKind;
  location: GeoPoint | null;
}

/** Cas d'usage de « mes lieux » (localités enregistrées par l'utilisateur). */
export class LocalityService {
  constructor(
    private readonly repositories: Repositories,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  /**
   * Retient un lieu pour les prochaines fois. Un lieu du même nom (à accents près) n'est pas
   * dupliqué : on le complète (position, nom vietnamien) s'il en manquait.
   */
  async remember(input: LocalityInput): Promise<Locality> {
    const name = input.name.trim();
    const existing = (await this.repositories.localities.listAll()).find(
      (locality) => searchKey(locality.name) === searchKey(name),
    );
    if (existing) {
      const completed = localitySchema.parse(
        updateEntity(
          existing,
          {
            vietnameseName: existing.vietnameseName || input.vietnameseName.trim(),
            location: existing.location ?? input.location,
          },
          this.clock(),
        ),
      );
      await this.repositories.localities.save(completed);
      return completed;
    }
    const locality = localitySchema.parse(
      createEntity<Locality>(
        {
          name,
          vietnameseName: input.vietnameseName.trim(),
          kind: input.kind,
          location: input.location,
        },
        this.clock(),
      ),
    );
    await this.repositories.localities.save(locality);
    return locality;
  }
}
