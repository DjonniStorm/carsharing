export class CarNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CarNotFoundException';
  }
}

export class CarAlreadyExistsException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CarAlreadyExistsException';
  }
}

export class LicensePlateAlreadyExistsException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LicensePlateAlreadyExistsException';
  }
}

export class CarDeletionFailedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CarDeletionFailedException';
  }
}

export class DatabaseCarErrorException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseCarErrorException';
  }
}

export class CarAlreadyDeletedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CarAlreadyDeletedException';
  }
}

export class CarAlreadyRestoredException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CarAlreadyRestoredException';
  }
}

/** Админский PATCH запрещён, пока на машине есть незавершённая поездка. */
export class CarInActiveTripException extends Error {
  constructor(
    message: string,
    public readonly carId: string,
    public readonly activeTripId: string,
  ) {
    super(message);
    this.name = 'CarInActiveTripException';
  }
}
