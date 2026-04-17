import { VehiclePrismaRepository } from '../vehicle-prisma.repository';

describe('VehiclePrismaRepository', () => {
  let repository: VehiclePrismaRepository;

  beforeEach(() => {
    repository = new VehiclePrismaRepository();
  });

  it('creates a vehicle', async () => {
    // arrange
    const input = {
      brand: 'Tesla',
      model: 'Model 3',
      plateNumber: 'AA0001AA',
      status: 'ACTIVE' as const,
      location: { lat: 50.45, lon: 30.52 },
    };

    // act
    const created = await repository.create(input);

    // assert
    expect(created.id).toBeGreaterThan(0);
    expect(created.brand).toBe('Tesla');
    expect(created.deletedAt).toBeNull();
  });

  it('findById returns correct entity', async () => {
    // arrange
    const created = await repository.create({
      brand: 'Toyota',
      model: 'Corolla',
      plateNumber: 'AA0002AA',
      status: 'ACTIVE',
      location: { lat: 50.45, lon: 30.52 },
    });

    // act
    const found = await repository.findById(created.id);

    // assert
    expect(found).not.toBeNull();
    expect(found?.id).toBe(created.id);
  });

  it('findAll returns only non-deleted records', async () => {
    // arrange
    const visible = await repository.create({
      brand: 'VW',
      model: 'Polo',
      plateNumber: 'AA0003AA',
      status: 'ACTIVE',
      location: { lat: 50.45, lon: 30.52 },
    });
    const hidden = await repository.create({
      brand: 'Ford',
      model: 'Focus',
      plateNumber: 'AA0004AA',
      status: 'BLOCKED',
      location: { lat: 50.45, lon: 30.52 },
    });
    await repository.softDelete(hidden.id);

    // act
    const all = await repository.findAll();

    // assert
    expect(all.map((item) => item.id)).toEqual([visible.id]);
  });

  it('softDelete sets deletedAt and hides from findAll, restore brings back', async () => {
    // arrange
    const created = await repository.create({
      brand: 'Nissan',
      model: 'Leaf',
      plateNumber: 'AA0005AA',
      status: 'ACTIVE',
      location: { lat: 50.45, lon: 30.52 },
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
