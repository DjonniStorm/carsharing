import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';
import { ViolationDbErrors } from '../common/db-errors';
import { ViolationMapper } from '../common/mapper';
import type { ViolationEntity } from '../entities/violation.entity';
import type { ViolationCreate } from '../entities/dtos/violation.create';
import { ViolationStatus } from '../entities/violation.status';
import type { IViolationRepository } from './violation.repository.interface';

@Injectable()
export class ViolationRepository implements IViolationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: ViolationCreate): Promise<ViolationEntity> {
    try {
      const row = await this.prisma.violation.create({
        data: {
          tripId: input.tripId,
          type: input.type,
          description: input.description,
        },
      });
      return ViolationMapper.fromDbToEntity(row);
    } catch (e) {
      ViolationDbErrors.mapError(e);
    }
  }

  async findAllByTripId(tripId: string): Promise<ViolationEntity[]> {
    try {
      const rows = await this.prisma.violation.findMany({
        where: { tripId },
        orderBy: { createdAt: 'desc' },
      });
      return rows.map(ViolationMapper.fromDbToEntity);
    } catch (e) {
      ViolationDbErrors.mapError(e);
    }
  }

  async updateStatus(
    id: string,
    status: ViolationStatus,
  ): Promise<ViolationEntity> {
    try {
      const row = await this.prisma.violation.update({
        where: { id },
        data: { type: status },
      });
      return ViolationMapper.fromDbToEntity(row);
    } catch (e) {
      ViolationDbErrors.mapError(e);
    }
  }

  async findById(id: string): Promise<ViolationEntity | null> {
    try {
      const row = await this.prisma.violation.findUnique({
        where: { id },
      });
      return row ? ViolationMapper.fromDbToEntity(row) : null;
    } catch (e) {
      ViolationDbErrors.mapError(e);
    }
  }

  async findAll(): Promise<ViolationEntity[]> {
    try {
      const rows = await this.prisma.violation.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return rows.map(ViolationMapper.fromDbToEntity);
    } catch (e) {
      ViolationDbErrors.mapError(e);
    }
  }

  async findAllByStatus(
    status: ViolationStatus,
    includeResolved: boolean,
  ): Promise<ViolationEntity[]> {
    try {
      const rows = await this.prisma.violation.findMany({
        where: {
          type: includeResolved
            ? { in: [status, ViolationStatus.RESOLVED] }
            : status,
        },
        orderBy: { createdAt: 'desc' },
      });
      return rows.map(ViolationMapper.fromDbToEntity);
    } catch (e) {
      ViolationDbErrors.mapError(e);
    }
  }

  async resolve(id: string): Promise<ViolationEntity> {
    return this.updateStatus(id, ViolationStatus.RESOLVED);
  }
}
