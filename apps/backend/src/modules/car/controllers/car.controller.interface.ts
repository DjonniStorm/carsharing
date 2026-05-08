import { Car } from '../entities/dtos/car';
import { CarRead } from '../entities/dtos/car.read';
import { UpdatePosition } from '../entities/dtos/update-position';

export interface ICarController {
  findAll(includeDeleted: boolean): Promise<CarRead[]>;
  findById(id: string): Promise<CarRead>;
  findByLicensePlate(licensePlate: string): Promise<CarRead>;
  create(car: Car): Promise<CarRead>;
  update(id: string, car: Partial<Car>): Promise<CarRead>;
  delete(id: string): Promise<CarRead>;
  restore(id: string): Promise<CarRead>;
  updatePosition(id: string, updatePosition: UpdatePosition): Promise<CarRead>;
}
