import { GeozoneType } from './geozone.type';

// Стабильная геозона; геометрия и правила — в GeozoneVersionEntity (currentVersionId).
export class GeozoneEntity {
  constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly type: GeozoneType,
    public readonly color: string,
    public readonly currentVersionId: string,
    public readonly createdAt: Date,
    public readonly deletedAt: Date | null,
    public readonly createdByUserId: string,
  ) {}
}
