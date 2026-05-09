export class HttpApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'HttpApiError'
    this.status = status
  }
}
