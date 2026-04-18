import { CarEntity } from '../entities/car.entity';

export interface ICarRepository {
  findAll(includeDeleted: boolean): Promise<CarEntity[]>;
  findById(id: string): Promise<CarEntity | null>;
  create(car: CarEntity): Promise<CarEntity>;
  update(id: string, car: Partial<CarEntity>): Promise<CarEntity>;
  delete(id: string): Promise<CarEntity>;
  restore(id: string): Promise<CarEntity>;
  updatePosition(
    id: string,
    lastKnownLat: number,
    lastKnownLon: number,
    lastPositionAt: string,
  ): Promise<CarEntity>;
}

export const ICarRepositoryToken = Symbol('ICarRepository');
