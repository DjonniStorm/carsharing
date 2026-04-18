export class PhoneError extends Error {
  constructor(errorMessage: string = 'Phone is required') {
    super(errorMessage);
    this.name = 'PhoneError';
    this.message = errorMessage;
  }
}
