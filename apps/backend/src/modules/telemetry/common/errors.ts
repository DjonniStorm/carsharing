export class TelemetryNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TelemetryNotFoundException';
  }
}

export class TelemetryRelationNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TelemetryRelationNotFoundException';
  }
}

export class DatabaseTelemetryErrorException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseTelemetryErrorException';
  }
}
