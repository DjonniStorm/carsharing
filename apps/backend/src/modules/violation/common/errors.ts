export class ViolationNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ViolationNotFoundException';
  }
}

export class ViolationRelationNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ViolationRelationNotFoundException';
  }
}

export class DatabaseViolationErrorException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseViolationErrorException';
  }
}

