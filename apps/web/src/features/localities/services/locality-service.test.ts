import 'fake-indexeddb/auto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { VeQueDatabase } from '@/infrastructure/db/database';
import { createRepositories, type Repositories } from '@/infrastructure/repositories';
import { LocalityService } from './locality-service';

describe('LocalityService', () => {
  let db: VeQueDatabase;
  let repositories: Repositories;
  let service: LocalityService;

  beforeEach(() => {
    db = new VeQueDatabase(`test-${crypto.randomUUID()}`);
    repositories = createRepositories(db);
    service = new LocalityService(repositories);
  });

  afterEach(async () => {
    await db.delete();
  });

  it('retient un lieu une seule fois, à accents près, en complétant ce qui manquait', async () => {
    await service.remember({
      name: 'Xóm Đông',
      vietnameseName: '',
      kind: 'village',
      location: null,
    });
    await service.remember({
      name: 'xom dong',
      vietnameseName: 'Xóm Đông',
      kind: 'village',
      location: { lat: 15.9, lng: 108.3 },
    });

    const saved = await repositories.localities.listAll();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toMatchObject({
      name: 'Xóm Đông',
      vietnameseName: 'Xóm Đông',
      location: { lat: 15.9, lng: 108.3 },
    });
  });
});
