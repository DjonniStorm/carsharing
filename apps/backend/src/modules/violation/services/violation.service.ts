import { Inject, Injectable, Logger } from '@nestjs/common';

import { ViolationDbErrors } from '../common/db-errors';
import { ViolationNotFoundException } from '../common/errors';
import type { ViolationCreate } from '../entities/dtos/violation.create';
import type { ViolationEntity } from '../entities/violation.entity';
import type { ViolationStatus } from '../entities/violation.status';
import {
  IViolationRepositoryToken,
  type IViolationRepository,
} from '../repositories/violation.repository.interface';
import type { IViolationService } from './violation.service.interface';
import {
  IViolationRealtimePublisherToken,
  type IViolationRealtimePublisher,
} from '../realtime/violation-realtime.publisher.interface';

@Injectable()
export class ViolationService implements IViolationService {
  private readonly logger = new Logger(ViolationService.name);

  constructor(
    @Inject(IViolationRepositoryToken)
    private readonly repository: IViolationRepository,
    @Inject(IViolationRealtimePublisherToken)
    private readonly realtimePublisher: IViolationRealtimePublisher,
  ) {}

  async create(input: ViolationCreate): Promise<ViolationEntity> {
    this.logger.log('Создание нарушения');
    try {
      const created = await this.repository.create(input);
      await this.realtimePublisher.publishViolationCreated(created);
      return created;
    } catch (error) {
      this.logger.error('Ошибка при создании нарушения', error);
      throw ViolationDbErrors.mapError(error);
    }
  }

  async findAllByTripId(tripId: string): Promise<ViolationEntity[]> {
    this.logger.log(`Поиск нарушений по tripId: ${tripId}`);
    try {
      return await this.repository.findAllByTripId(tripId);
    } catch (error) {
      this.logger.error(`Ошибка при поиске нарушений по tripId: ${tripId}`, error);
      throw ViolationDbErrors.mapError(error);
    }
  }

  async findById(id: string): Promise<ViolationEntity | null> {
    this.logger.log(`Поиск нарушения по id: ${id}`);
    try {
      return await this.repository.findById(id);
    } catch (error) {
      this.logger.error(`Ошибка при поиске нарушения по id: ${id}`, error);
      throw ViolationDbErrors.mapError(error);
    }
  }

  async findAll(): Promise<ViolationEntity[]> {
    this.logger.log('Поиск всех нарушений');
    try {
      return await this.repository.findAll();
    } catch (error) {
      this.logger.error('Ошибка при поиске всех нарушений', error);
      throw ViolationDbErrors.mapError(error);
    }
  }

  async findAllByStatus(
    status: ViolationStatus,
    includeResolved: boolean,
  ): Promise<ViolationEntity[]> {
    this.logger.log(`Поиск нарушений по статусу: ${status}`);
    try {
      return await this.repository.findAllByStatus(status, includeResolved);
    } catch (error) {
      this.logger.error(`Ошибка при поиске нарушений по статусу: ${status}`, error);
      throw ViolationDbErrors.mapError(error);
    }
  }

  async updateStatus(
    id: string,
    status: ViolationStatus,
  ): Promise<ViolationEntity> {
    this.logger.log(`Обновление статуса нарушения: id=${id}, status=${status}`);
    try {
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new ViolationNotFoundException(`Нарушение ${id} не найдено`);
      }
      const updated = await this.repository.updateStatus(id, status);
      await this.realtimePublisher.publishViolationUpdated(updated);
      return updated;
    } catch (error) {
      this.logger.error(
        `Ошибка при обновлении статуса нарушения: id=${id}, status=${status}`,
        error,
      );
      throw ViolationDbErrors.mapError(error);
    }
  }

  async resolve(id: string): Promise<ViolationEntity> {
    this.logger.log(`Разрешение нарушения: id=${id}`);
    try {
      const existing = await this.repository.findById(id);
      if (!existing) {
        throw new ViolationNotFoundException(`Нарушение ${id} не найдено`);
      }
      const resolved = await this.repository.resolve(id);
      await this.realtimePublisher.publishViolationUpdated(resolved);
      return resolved;
    } catch (error) {
      this.logger.error(`Ошибка при разрешении нарушения: id=${id}`, error);
      throw ViolationDbErrors.mapError(error);
    }
  }
}

