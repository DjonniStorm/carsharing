import { ZonePrismaRepository } from '../zone-prisma.repository';

describe('ZonePrismaRepository', () => {
  let repository: ZonePrismaRepository;

  beforeEach(() => {
    repository = new ZonePrismaRepository();
  });

  it('creates zone with GeoJSON Polygon and keeps geometry unchanged', async () => {
    // arrange
    const geometry = {
      type: 'Polygon' as const,
      coordinates: [
        [
          [30.1, 50.4],
          [30.2, 50.4],
          [30.2, 50.5],
          [30.1, 50.4],
        ],
      ],
    };

    // act
    const created = await repository.create({
      name: 'Central',
      type: 'ALLOWED',
      geometry,
      isActive: true,
    });

    // assert
    expect(created.geometry).toEqual(geometry);
    expect(created.geometry.type).toBe('Polygon');
  });

  it('findAll returns only non-deleted zones', async () => {
    // arrange
    const zoneA = await repository.create({
      name: 'A',
      type: 'ALLOWED',
      geometry: { type: 'Polygon', coordinates: [[[30, 50], [30.1, 50], [30, 50]]] },
      isActive: true,
    });
    const zoneB = await repository.create({
      name: 'B',
      type: 'PARKING',
      geometry: { type: 'Polygon', coordinates: [[[31, 51], [31.1, 51], [31, 51]]] },
      isActive: false,
    });
    await repository.softDelete(zoneB.id);

    // act
    const list = await repository.findAll();

    // assert
    expect(list.map((item) => item.id)).toEqual([zoneA.id]);
  });

  it('findActive returns only active non-deleted zones', async () => {
    // arrange
    await repository.create({
      name: 'Active',
      type: 'ALLOWED',
      geometry: { type: 'Polygon', coordinates: [[[30, 50], [30.1, 50], [30, 50]]] },
      isActive: true,
    });
    await repository.create({
      name: 'Inactive',
      type: 'PARKING',
      geometry: { type: 'Polygon', coordinates: [[[31, 51], [31.1, 51], [31, 51]]] },
      isActive: false,
    });

    // act
    const list = await repository.findActive();

    // assert
    expect(list).toHaveLength(1);
    expect(list[0].isActive).toBe(true);
  });

  it('softDelete and restore behavior works', async () => {
    // arrange
    const created = await repository.create({
      name: 'Temp',
      type: 'RESTRICTED',
      geometry: { type: 'Polygon', coordinates: [[[32, 52], [32.1, 52], [32, 52]]] },
      isActive: true,
    });

    // act + assert
    const deleted = await repository.softDelete(created.id);
    expect(deleted.deletedAt).not.toBeNull();
    expect((await repository.findAll()).length).toBe(0);

    // act + assert
    const restored = await repository.restore(created.id);
    expect(restored.deletedAt).toBeNull();
    expect((await repository.findAll()).length).toBe(1);
  });
});
