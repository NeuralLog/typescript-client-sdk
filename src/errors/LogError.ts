import { LogErrorCode } from './LogErrorCode';

/**
 * Custom error class for NeuralLog operations
 */
export class LogError extends Error {
  /**
   * Error code
   */
  public readonly code: LogErrorCode;

  /**
   * Create a new LogError
   *
   * @param message Error message
   * @param code Error code
   */
  constructor(message: string, code: LogErrorCode) {
    super(message);
    this.name = 'LogError';
    this.code = code;

    // This is necessary for proper instanceof checks in TypeScript
    Object.setPrototypeOf(this, LogError.prototype);
  }
}
