import { Provider } from '@nestjs/common';
import { REPOSITORY_TOKENS } from '../tokens/repository.tokens';
import { UserPrismaRepository } from '../../modules/auth/repositories/prisma/user-prisma.repository';
import { TripPrismaRepository } from '../../modules/driver/repositories/prisma/trip-prisma.repository';
import { TariffPrismaRepository } from '../../modules/manager/repositories/prisma/tariff-prisma.repository';
import { VehiclePrismaRepository } from '../../modules/manager/repositories/prisma/vehicle-prisma.repository';
import { ViolationPrismaRepository } from '../../modules/manager/repositories/prisma/violation-prisma.repository';
import { ZonePrismaRepository } from '../../modules/manager/repositories/prisma/zone-prisma.repository';

export const repositoryProviders: Provider[] = [
  { provide: REPOSITORY_TOKENS.vehicle, useClass: VehiclePrismaRepository },
  { provide: REPOSITORY_TOKENS.trip, useClass: TripPrismaRepository },
  { provide: REPOSITORY_TOKENS.tariff, useClass: TariffPrismaRepository },
  { provide: REPOSITORY_TOKENS.zone, useClass: ZonePrismaRepository },
  { provide: REPOSITORY_TOKENS.violation, useClass: ViolationPrismaRepository },
  { provide: REPOSITORY_TOKENS.user, useClass: UserPrismaRepository },
];
