export class TariffNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TariffNotFoundException';
  }
}

export class TariffGeoZoneNotFoundException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TariffGeoZoneNotFoundException';
  }
}

export class TariffAlreadyDeletedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TariffAlreadyDeletedException';
  }
}

export class TariffNotDeletedException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TariffNotDeletedException';
  }
}

export class DatabaseTariffErrorException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseTariffErrorException';
  }
}
