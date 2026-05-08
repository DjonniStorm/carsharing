import { v4 as uuidv4 } from 'uuid';

import { PrismaService } from 'src/prisma/prisma.service';
import { CarStatus } from '../../../../../car/entities/car-status';
import type {
  GeoJSONMultiPolygon,
  GeoJSONPosition,
} from '../../../../../geozone/entities/geozone.geometry';
import { GeozoneType } from '../../../../../geozone/entities/geozone.type';
import { GeozoneRepository } from '../../../../../geozone/repositories/geozone.repository';

/**
 * Общий сид для интеграционных тестов джобов: пользователь, машина, RENTAL-геозона с версией, поездка.
 * Координаты полигона из `sampleRentalRing()` — западнее Москвы; «Москва» (lon≈37.6) точно вне этой RENTAL.
 */
export async function seedTripWithRentalTariff(
  prisma: PrismaService,
): Promise<{ tripId: string; userId: string }> {
  const suffix = uuidv4().replace(/-/g, '');
  const user = await prisma.user.create({
    data: {
      name: `Job integration ${suffix.slice(0, 10)}`,
      email: `job-int-${suffix}@test.local`,
      phone: `+79${suffix.replace(/[a-f]/gi, '6').slice(0, 10)}`,
      passwordHash: 'hash',
      role: 0,
      isActive: true,
      isDeleted: false,
    },
  });

  const car = await prisma.car.create({
    data: {
      brand: 'Job',
      model: 'Integration',
      licensePlate: `JI${suffix.slice(0, 8)}`,
      color: 'grey',
      mileage: 500,
      fuelLevel: 50,
      isAvailable: true,
      carStatus: CarStatus.AVAILABLE,
      isDeleted: false,
      createdAt: new Date().toISOString(),
    },
  });

  const geozoneRepository = new GeozoneRepository(prisma);
  const zone = await geozoneRepository.createWithInitialVersion({
    name: `Job integration rental ${suffix.slice(0, 6)}`,
    type: GeozoneType.RENTAL,
    color: '#505050',
    createdByUserId: user.id,
    geometry: sampleRentalRing(),
    rules: null,
    pricePerMinute: 1,
    pricePerKm: 2,
    pausePricePerMinute: 0.5,
  });
  if (!zone.currentVersionId) {
    throw new Error('currentVersionId expected');
  }

  const trip = await prisma.trip.create({
    data: {
      userId: user.id,
      carId: car.id,
      tariffVersionId: zone.currentVersionId,
      startedAt: new Date('2026-05-09T08:00:00.000Z'),
      distance: 0,
      duration: 0,
      status: 0,
    },
  });

  return { tripId: trip.id, userId: user.id };
}

/** RENTAL-полигон (lon 35…35.15, lat 55.7…55.85) — «Москва» ~37.6 не попадает внутрь. */
export function sampleRentalRing(): GeoJSONMultiPolygon {
  const baseLon = 35;
  const ring: GeoJSONPosition[] = [
    [baseLon, 55.7],
    [baseLon + 0.15, 55.7],
    [baseLon + 0.15, 55.85],
    [baseLon, 55.85],
    [baseLon, 55.7],
  ];
  return {
    type: 'MultiPolygon',
    coordinates: [[ring]] as unknown as GeoJSONMultiPolygon['coordinates'],
  };
}

/** Полигон PARKING вокруг условного центра (lon 37.5–37.7), чтобы точка (37.61, 55.75) была внутри. */
export function sampleParkingMoscowRing(): GeoJSONMultiPolygon {
  const ring: GeoJSONPosition[] = [
    [37.5, 55.7],
    [37.7, 55.7],
    [37.7, 55.85],
    [37.5, 55.85],
    [37.5, 55.7],
  ];
  return {
    type: 'MultiPolygon',
    coordinates: [[ring]] as unknown as GeoJSONMultiPolygon['coordinates'],
  };
}
