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
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'TripPublishFailedException';
  }
}
