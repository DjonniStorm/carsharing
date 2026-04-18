export class EmailError extends Error {
  constructor(errorMessage: string = 'Email is required') {
    super(errorMessage);
    this.name = 'EmailError';
    this.message = errorMessage;
  }
}
