export class GeozoneNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeozoneNotFoundException';
  }
}

export class GeozoneCreatedByUserIdRequiredException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeozoneCreatedByUserIdRequiredException';
  }
}

export class GeozoneGeometryMissingException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeozoneGeometryMissingException';
  }
}

export class DatabaseGeozoneErrorException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseGeozoneErrorException';
  }
}

export class GeozoneAlreadyDeletedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeozoneAlreadyDeletedException';
  }
}

export class GeozoneNotDeletedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeozoneNotDeletedException';
  }
}

export class GeozoneVersionNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GeozoneVersionNotFoundException';
  }
}
