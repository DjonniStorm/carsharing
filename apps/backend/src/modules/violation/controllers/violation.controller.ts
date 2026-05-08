import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import {
  DatabaseViolationErrorException,
  ViolationNotFoundException,
  ViolationRelationNotFoundException,
} from '../common/errors';
import { ViolationMapper } from '../common/mapper';
import { ViolationCreate } from '../entities/dtos/violation.create';
import { ViolationRead } from '../entities/dtos/violation.read';
import { ViolationUpdateStatus } from '../entities/dtos/violation.update-status';
import { ViolationStatus } from '../entities/violation.status';
import {
  IViolationServiceToken,
  type IViolationService,
} from '../services/violation.service.interface';
import { IViolationController } from './violation.controller.interface';

function parseViolationStatusQuery(raw: string | undefined): ViolationStatus | undefined {
  if (raw == null || raw.trim() === '') {
    return undefined;
  }
  const value = Number(raw);
  if (!Number.isInteger(value)) {
    throw new BadRequestException('status must be an integer');
  }
  if (!(value in ViolationStatus)) {
    throw new BadRequestException('status has invalid value');
  }
  return value as ViolationStatus;
}

@Controller('violations')
@ApiTags('Violations')
export class ViolationController implements IViolationController {
  private readonly logger = new Logger(ViolationController.name);

  constructor(
    @Inject(IViolationServiceToken)
    private readonly violationService: IViolationService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Создать нарушение' })
  @ApiResponse({ status: 201, type: ViolationRead })
  async create(@Body() input: ViolationCreate): Promise<ViolationRead> {
    this.logger.debug('create violation', { tripId: input.tripId, type: input.type });
    try {
      const created = await this.violationService.create(input);
      return ViolationMapper.fromEntityToRead(created);
    } catch (error) {
      if (error instanceof ViolationRelationNotFoundException) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof DatabaseViolationErrorException) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }

  @Get()
  @ApiOperation({ summary: 'Список нарушений' })
  @ApiQuery({ name: 'status', required: false, description: 'Числовое значение ViolationStatus' })
  @ApiQuery({ name: 'includeResolved', required: false, type: Boolean })
  @ApiResponse({ status: 200, type: [ViolationRead] })
  async findAllByStatus(
    @Query('status') rawStatus?: string,
    @Query('includeResolved') includeResolved?: string,
  ): Promise<ViolationRead[]> {
    const status = parseViolationStatusQuery(rawStatus);
    const include = includeResolved === 'true';
    this.logger.debug('find violations', { status, includeResolved: include });

    try {
      const list =
        status !== undefined
          ? await this.violationService.findAllByStatus(status, include)
          : await this.violationService.findAll();
      return list.map(ViolationMapper.fromEntityToRead);
    } catch (error) {
      if (error instanceof DatabaseViolationErrorException) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Нарушение по id' })
  @ApiResponse({ status: 200, type: ViolationRead })
  async findById(@Param('id') id: string): Promise<ViolationRead> {
    this.logger.debug('findById violation', { id });
    try {
      const found = await this.violationService.findById(id);
      if (!found) {
        throw new ViolationNotFoundException(`Нарушение ${id} не найдено`);
      }
      return ViolationMapper.fromEntityToRead(found);
    } catch (error) {
      if (error instanceof ViolationNotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof DatabaseViolationErrorException) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }

  @Get('trip/:tripId')
  @ApiOperation({ summary: 'Нарушения по tripId' })
  @ApiResponse({ status: 200, type: [ViolationRead] })
  async findAllByTripId(@Param('tripId') tripId: string): Promise<ViolationRead[]> {
    this.logger.debug('findAllByTripId violation', { tripId });
    try {
      const list = await this.violationService.findAllByTripId(tripId);
      return list.map(ViolationMapper.fromEntityToRead);
    } catch (error) {
      if (error instanceof DatabaseViolationErrorException) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Обновить статус нарушения' })
  @ApiResponse({ status: 200, type: ViolationRead })
  async updateStatus(
    @Param('id') id: string,
    @Body() input: ViolationUpdateStatus,
  ): Promise<ViolationRead> {
    this.logger.debug('updateStatus violation', { id, status: input.status });
    try {
      const updated = await this.violationService.updateStatus(id, input.status);
      return ViolationMapper.fromEntityToRead(updated);
    } catch (error) {
      if (error instanceof ViolationNotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof DatabaseViolationErrorException) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Разрешить нарушение' })
  @ApiResponse({ status: 200, type: ViolationRead })
  async resolve(@Param('id') id: string): Promise<ViolationRead> {
    this.logger.debug('resolve violation', { id });
    try {
      const resolved = await this.violationService.resolve(id);
      return ViolationMapper.fromEntityToRead(resolved);
    } catch (error) {
      if (error instanceof ViolationNotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof DatabaseViolationErrorException) {
        throw new BadRequestException(error.message);
      }
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }

  // Для совместимости с интерфейсом: findAll() делаем алиасом.
  async findAll(): Promise<ViolationRead[]> {
    return this.findAllByStatus(undefined, undefined);
  }
}

