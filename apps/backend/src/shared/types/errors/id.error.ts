export class IdError extends Error {
  constructor(errorMessage: string = 'Id is required') {
    super(errorMessage);
    this.name = 'IdError';
    this.message = errorMessage;
  }
}
