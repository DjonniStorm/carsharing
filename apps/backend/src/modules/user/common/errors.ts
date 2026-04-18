export class UserNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserNotFoundException';
  }
}

export class UserAlreadyExistsException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserAlreadyExistsException';
  }
}

export class EmailAlreadyExistsException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EmailAlreadyExistsException';
  }
}

export class PhoneAlreadyExistsException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PhoneAlreadyExistsException';
  }
}

export class DeletionFailedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DeletionFailedException';
  }
}

export class DatabaseUserErrorException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseUserErrorException';
  }
}
