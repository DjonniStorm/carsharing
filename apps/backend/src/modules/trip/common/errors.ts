export class TripNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TripNotFoundException';
  }
}

export class TripRelationNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TripRelationNotFoundException';
  }
}

export class DatabaseTripErrorException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseTripErrorException';
  }
}

export class TripPublishFailedException extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'TripPublishFailedException';
  }
}

/** H11: на машине уже есть незавершённая поездка. */
export class TripCarAlreadyInUseException extends Error {
  constructor(
    message: string,
    public readonly carId: string,
    public readonly activeTripId: string,
  ) {
    super(message);
    this.name = 'TripCarAlreadyInUseException';
  }
}
