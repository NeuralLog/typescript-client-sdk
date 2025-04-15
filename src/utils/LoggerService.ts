import winston from 'winston';

/**
 * Logger service for the application
 * 
 * This service provides a centralized logging mechanism that can be configured
 * to behave differently in different environments (e.g., production, development, test).
 */
export class LoggerService {
  private static instance: LoggerService;
  private logger: winston.Logger;
  private isTestEnvironment: boolean;

  /**
   * Create a new LoggerService
   * 
   * @param isTestEnvironment Whether the application is running in a test environment
   */
  private constructor(isTestEnvironment: boolean = false) {
    this.isTestEnvironment = isTestEnvironment;
    
    // Create logger with appropriate configuration
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      defaultMeta: { service: 'neurallog-client' },
      transports: [
        // Only log to console in non-test environments by default
        new winston.transports.Console({
          level: isTestEnvironment ? 'error' : 'info',
          silent: isTestEnvironment
        })
      ]
    });
  }

  /**
   * Get the LoggerService instance
   * 
   * @param isTestEnvironment Whether the application is running in a test environment
   * @returns LoggerService instance
   */
  public static getInstance(isTestEnvironment: boolean = false): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService(isTestEnvironment);
    }
    
    // Update test environment setting if it has changed
    if (LoggerService.instance.isTestEnvironment !== isTestEnvironment) {
      LoggerService.instance.isTestEnvironment = isTestEnvironment;
      LoggerService.instance.updateLogLevel();
    }
    
    return LoggerService.instance;
  }

  /**
   * Update the log level based on the environment
   */
  private updateLogLevel(): void {
    this.logger.transports.forEach(transport => {
      if (transport instanceof winston.transports.Console) {
        transport.silent = this.isTestEnvironment;
      }
    });
  }

  /**
   * Log an error message
   * 
   * @param message Error message
   * @param meta Additional metadata
   */
  public error(message: string, meta?: any): void {
    this.logger.error(message, meta);
  }

  /**
   * Log a warning message
   * 
   * @param message Warning message
   * @param meta Additional metadata
   */
  public warn(message: string, meta?: any): void {
    this.logger.warn(message, meta);
  }

  /**
   * Log an info message
   * 
   * @param message Info message
   * @param meta Additional metadata
   */
  public info(message: string, meta?: any): void {
    this.logger.info(message, meta);
  }

  /**
   * Log a debug message
   * 
   * @param message Debug message
   * @param meta Additional metadata
   */
  public debug(message: string, meta?: any): void {
    this.logger.debug(message, meta);
  }
}
