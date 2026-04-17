import { Injectable } from '@nestjs/common';
import {
  CreateViolationInput,
  ViolationEntity,
} from '../../../../shared/types/repository.types';
import { PrismaService } from '../../../../prisma/prisma.service';
import { ViolationRepository } from '../violation.repository';

@Injectable()
export class ViolationPrismaRepository implements ViolationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ViolationEntity[]> {
    const violations = await this.prisma.violation.findMany({
      orderBy: { id: 'asc' },
    });
    return violations.map((violation) => this.toViolationEntity(violation));
  }

  async findById(id: number): Promise<ViolationEntity | null> {
    const violation = await this.prisma.violation.findUnique({ where: { id } });
    return violation ? this.toViolationEntity(violation) : null;
  }

  async create(data: CreateViolationInput): Promise<ViolationEntity> {
    const created = await this.prisma.violation.create({
      data: {
        tripId: data.tripId,
        type: this.typeToCode(data.type),
        description: data.type,
      },
    });
    return this.toViolationEntity(created, data.createdAt ?? new Date());
  }

  private toViolationEntity(
    violation: { id: number; tripId: number; type: number },
    createdAtOverride?: Date,
  ): ViolationEntity {
    return {
      id: violation.id,
      tripId: violation.tripId,
      type: this.codeToType(violation.type),
      createdAt: createdAtOverride ?? new Date(),
    };
  }

  private typeToCode(type: ViolationEntity['type']): number {
    if (type === 'OUT_OF_ZONE') return 1;
    if (type === 'SPEEDING') return 2;
    return 3;
  }

  private codeToType(code: number): ViolationEntity['type'] {
    if (code === 1) return 'OUT_OF_ZONE';
    if (code === 2) return 'SPEEDING';
    return 'OTHER';
  }
}
