import { BaseEntity } from 'src/shared/types/entities/base-entity';

export class TelemetryEntity extends BaseEntity<string> {
  constructor(
    public readonly id: string,
    public readonly timestamp: Date,
    public readonly lat: number,
    public readonly lon: number,
    public readonly speed: number,
    public readonly acceleration: number,
    public readonly fuelLevel: number,
    public readonly tripId: string,
  ) {
    super(id);
  }
}
