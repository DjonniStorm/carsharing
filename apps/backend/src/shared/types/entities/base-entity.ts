export abstract class BaseEntity<TId> {
  protected constructor(public readonly id: TId) {}
}
