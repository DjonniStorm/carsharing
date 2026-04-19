import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CarAlreadyDeletedException,
  CarAlreadyExistsException,
  CarAlreadyRestoredException,
  CarNotFoundException,
  LicensePlateAlreadyExistsException,
} from '../common/errors';
import { Car } from '../entities/dtos/car';
import { CarRead } from '../entities/dtos/car.read';
import { CarService } from '../services/car.service';
import { ICarController } from './car.controller.interface';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { UpdatePosition } from '../entities/dtos/update-position';

@Controller('cars')
@ApiTags('Cars')
export class CarController implements ICarController {
  private readonly logger = new Logger(CarController.name);
  constructor(private readonly carService: CarService) {}

  @Get()
  @ApiOperation({ summary: 'Получить все автомобили' })
  @ApiResponse({ status: 200, type: [CarRead] })
  async findAll(
    @Query('includeDeleted') includeDeleted: boolean = false,
  ): Promise<CarRead[]> {
    try {
      this.logger.log(
        `Finding all cars with includeDeleted: ${includeDeleted}`,
      );
      const cars = await this.carService.findAll(includeDeleted);
      this.logger.log(`Found ${cars.length} cars`);
      return cars;
    } catch (error) {
      this.logger.error(`Failed to find all cars: ${error}`);
      throw new BadRequestException(error.message);
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Получить автомобиль по ID' })
  @ApiResponse({ status: 200, type: CarRead })
  async findById(@Param('id') id: string): Promise<CarRead> {
    try {
      this.logger.log(`Finding car by id: ${id}`);
      const car = await this.carService.findById(id);
      this.logger.log(`Found car: ${car}`);
      return car;
    } catch (error) {
      this.logger.error(`Failed to find car by id: ${error}`);
      if (error instanceof CarNotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @Get('license-plate/:licensePlate')
  @ApiOperation({ summary: 'Получить автомобиль по номеру' })
  @ApiResponse({ status: 200, type: CarRead })
  async findByLicensePlate(
    @Param('licensePlate') licensePlate: string,
  ): Promise<CarRead> {
    try {
      this.logger.log(`Finding car by license plate: ${licensePlate}`);
      const car = await this.carService.findByLicensePlate(licensePlate);
      this.logger.log(`Found car: ${car}`);
      return car;
    } catch (error) {
      this.logger.error(`Failed to find car by license plate: ${error}`);
      if (error instanceof CarNotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @Post()
  @ApiOperation({ summary: 'Создать автомобиль' })
  @ApiResponse({ status: 201, type: CarRead })
  async create(@Body() car: Car): Promise<CarRead> {
    try {
      this.logger.log(`Creating car: ${car}`);
      const createdCar = await this.carService.create(car);
      this.logger.log(`Created car: ${createdCar}`);
      return createdCar;
    } catch (error) {
      this.logger.error(`Failed to create car: ${error}`);
      if (error instanceof CarAlreadyExistsException) {
        throw new ConflictException(error.message);
      }
      if (error instanceof LicensePlateAlreadyExistsException) {
        throw new ConflictException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Обновить автомобиль' })
  @ApiResponse({ status: 200, type: CarRead })
  async update(
    @Param('id') id: string,
    @Body() car: Partial<Car>,
  ): Promise<CarRead> {
    try {
      this.logger.log(`Updating car: ${id}`);
      const updatedCar = await this.carService.update(id, car);
      this.logger.log(`Updated car: ${updatedCar}`);
      return updatedCar;
    } catch (error) {
      this.logger.error(`Failed to update car: ${error}`);
      if (error instanceof CarNotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof LicensePlateAlreadyExistsException) {
        throw new ConflictException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Удалить автомобиль' })
  @ApiResponse({ status: 200, type: CarRead })
  async delete(@Param('id') id: string): Promise<CarRead> {
    try {
      this.logger.log(`Deleting car: ${id}`);
      const deletedCar = await this.carService.delete(id);
      this.logger.log(`Deleted car: ${deletedCar}`);
      return deletedCar;
    } catch (error) {
      this.logger.error(`Failed to delete car: ${error}`);
      if (error instanceof CarNotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof CarAlreadyDeletedException) {
        throw new ConflictException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @Post('restore/:id')
  @ApiOperation({ summary: 'Восстановить автомобиль' })
  @ApiResponse({ status: 200, type: CarRead })
  async restore(@Param('id') id: string): Promise<CarRead> {
    try {
      this.logger.log(`Restoring car: ${id}`);
      const restoredCar = await this.carService.restore(id);
      this.logger.log(`Restored car: ${restoredCar}`);
      return restoredCar;
    } catch (error) {
      this.logger.error(`Failed to restore car: ${error}`);
      if (error instanceof CarNotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof CarAlreadyRestoredException) {
        throw new ConflictException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }

  @Post('update-position/:id')
  @ApiOperation({ summary: 'Обновить позицию автомобиля' })
  @ApiResponse({ status: 200, type: CarRead })
  async updatePosition(
    @Param('id') id: string,
    @Body() updatePosition: UpdatePosition,
  ): Promise<CarRead> {
    try {
      this.logger.log(`Updating position for car: ${id}`);
      const updatedPositionCar = await this.carService.updatePosition(
        id,
        updatePosition.lastKnownLat,
        updatePosition.lastKnownLon,
        updatePosition.lastPositionAt,
      );
      this.logger.log(`Updated position for car: ${updatedPositionCar}`);
      return updatedPositionCar;
    } catch (error) {
      this.logger.error(`Failed to update position for car: ${error}`);
      if (error instanceof CarNotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw new BadRequestException(error.message);
    }
  }
}
