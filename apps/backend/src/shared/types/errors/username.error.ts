export class UsernameError extends Error {
  constructor(errorMessage: string = 'Username is required') {
    super(errorMessage);
    this.name = 'UsernameError';
    this.message = errorMessage;
  }
}
