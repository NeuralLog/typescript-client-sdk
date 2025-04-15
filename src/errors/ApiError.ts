/**
 * Custom error class for API-related errors
 */
export class ApiError extends Error {
  /**
   * Create a new ApiError
   *
   * @param statusCode HTTP status code
   * @param message Error message
   * @param originalError Original error that caused this error
   */
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'ApiError';

    // This is necessary for proper instanceof checks in TypeScript
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}
