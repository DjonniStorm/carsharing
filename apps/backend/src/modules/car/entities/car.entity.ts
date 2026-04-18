import { BaseEntity } from 'src/shared/types/entities/base-entity';
import { DateError } from 'src/shared/types/errors/date.error';
import { EmptyFieldError } from 'src/shared/types/errors/empty-field.error';
import { IdError } from 'src/shared/types/errors/id.error';
import { validate } from 'uuid';
import { CarStatus } from './car-status';

export class CarEntity extends BaseEntity<string> {
  constructor(
    public readonly id: string,
    public readonly brand: string,
    public readonly model: string,
    public readonly licensePlate: string,
    public readonly color: string,
    public readonly mileage: number,
    public readonly fuelLevel: number,
    public readonly isAvailable: boolean,
    public readonly carStatus: CarStatus,
    public readonly isDeleted: boolean,
    public readonly createdAt: string,
    public readonly updatedAt: string | null,
    public readonly lastKnownLat: number | null,
    public readonly lastKnownLon: number | null,
    public readonly lastPositionAt: string | null,
  ) {
    super(id);
  }

  public static validate(car: CarEntity): void {
    if (!car.id) {
      throw new IdError('field id is required');
    }
    if (!validate(car.id)) {
      throw new IdError(`field id is not valid UUID: ${car.id}`);
    }
    if (!car.brand) {
      throw new EmptyFieldError('field brand is required');
    }
    if (!car.model) {
      throw new EmptyFieldError('field model is required');
    }
    if (!car.licensePlate) {
      throw new EmptyFieldError('field license plate is required');
    }
    if (!car.color) {
      throw new EmptyFieldError('field color is required');
    }
    if (typeof car.mileage !== 'number') {
      throw new EmptyFieldError('field mileage is required');
    }
    if (typeof car.fuelLevel !== 'number') {
      throw new EmptyFieldError('field fuelLevel is required');
    }
    if (typeof car.isAvailable !== 'boolean') {
      throw new EmptyFieldError('field isAvailable is required');
    }
    if (!Object.values(CarStatus).includes(car.carStatus)) {
      throw new EmptyFieldError('field carStatus is not valid');
    }
    if (
      car.lastPositionAt &&
      new Date(car.lastPositionAt) < new Date(car.createdAt)
    ) {
      throw new DateError(
        `field lastPositionAt must be greater than createdAt`,
      );
    }
  }
}
