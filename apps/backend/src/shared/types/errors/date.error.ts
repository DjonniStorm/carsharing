export class DateError extends Error {
  constructor(errorMessage: string = 'Date is required') {
    super(errorMessage);
    this.name = 'DateError';
    this.message = errorMessage;
  }
}
