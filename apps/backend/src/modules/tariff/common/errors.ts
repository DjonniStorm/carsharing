export class TariffNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TariffNotFoundException';
  }
}

export class TariffAlreadyDeletedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TariffAlreadyDeletedException';
  }
}

export class DatabaseTariffErrorException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseTariffErrorException';
  }
}
