import { ZoneRepository } from '../repositories/zone.repository';
import { ZoneService } from './zone.service';

describe('ZoneService', () => {
  let service: ZoneService;
  let repository: jest.Mocked<ZoneRepository>;

  beforeEach(() => {
    repository = {
      findAll: jest.fn(),
      findActive: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      restore: jest.fn(),
    };
    service = new ZoneService(repository);
  });

  describe('createZone', () => {
    it('creates zone for valid GeoJSON Polygon', async () => {
      // arrange
      const payload = {
        name: 'Center',
        type: 'ALLOWED' as const,
        geometry: {
          type: 'Polygon' as const,
          coordinates: [
            [
              [30, 50],
              [30.1, 50],
              [30.1, 50.1],
              [30, 50.1],
              [30, 50],
            ],
          ],
        },
        isActive: true,
      };
      repository.create.mockResolvedValue({
        id: 1,
        ...payload,
        deletedAt: null,
      });

      // act
      const result = await service.createZone(payload);

      // assert
      expect(repository.create).toHaveBeenCalledWith(payload);
      expect(result.id).toBe(1);
    });

    it.each([
      {
        label: 'wrong GeoJSON type',
        payload: {
          name: 'Z',
          type: 'ALLOWED',
          geometry: { type: 'LineString', coordinates: [] },
          isActive: true,
        },
      },
      {
        label: 'missing coordinates',
        payload: {
          name: 'Z',
          type: 'ALLOWED',
          geometry: { type: 'Polygon' },
          isActive: true,
        },
      },
      {
        label: 'invalid geometry structure',
        payload: { name: 'Z', type: 'ALLOWED', geometry: null, isActive: true },
      },
    ])('rejects for $label', async ({ payload }) => {
      // act + assert
      await expect(service.createZone(payload as never)).rejects.toThrow();
      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('checkPointInZone', () => {
    it('returns true for point inside polygon', async () => {
      // act
      const result = await service.checkPointInZone(
        { lat: 50.2, lon: 30.2 },
        {
          type: 'Polygon',
          coordinates: [
            [
              [30, 50],
              [30.4, 50],
              [30.4, 50.4],
              [30, 50.4],
              [30, 50],
            ],
          ],
        },
      );

      // assert
      expect(result).toBe(true);
    });

    it('returns false for point outside polygon', async () => {
      const result = await service.checkPointInZone(
        { lat: 51, lon: 31 },
        {
          type: 'Polygon',
          coordinates: [
            [
              [30, 50],
              [30.4, 50],
              [30.4, 50.4],
              [30, 50.4],
              [30, 50],
            ],
          ],
        },
      );

      expect(result).toBe(false);
    });

    it('throws for invalid point format', async () => {
      // act + assert
      await expect(
        service.checkPointInZone(
          { lat: Number.NaN, lon: 30.52 },
          {
            type: 'Polygon',
            coordinates: [
              [
                [30, 50],
                [30.1, 50],
                [30.1, 50.1],
                [30, 50.1],
                [30, 50],
              ],
            ],
          },
        ),
      ).rejects.toThrow('Invalid point');
    });
  });
});
