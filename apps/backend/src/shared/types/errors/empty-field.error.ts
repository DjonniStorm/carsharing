export class EmptyFieldError extends Error {
  constructor(errorMessage: string = 'Field is required and cannot be empty') {
    super(errorMessage);
    this.name = 'EmptyFieldError';
    this.message = errorMessage;
  }
}
