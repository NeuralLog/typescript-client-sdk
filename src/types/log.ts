/**
 * Interface for a log
 */
export interface Log {
  /**
   * Log ID
   */
  id: string;

  /**
   * Log name (encrypted)
   */
  name: string;

  /**
   * Creation timestamp
   */
  createdAt: string;

  /**
   * Last update timestamp
   */
  updatedAt: string;

  /**
   * User ID who created this log
   */
  createdBy: string;

  /**
   * Tenant ID
   */
  tenantId: string;

  /**
   * Log encryption information
   */
  encryption?: {
    /**
     * KEK version used to encrypt this log
     */
    kekVersion: string;

    /**
     * Encryption algorithm
     */
    algorithm: string;
  };
}

/**
 * Interface for a log entry
 */
export interface LogEntry {
  /**
   * Entry ID
   */
  id: string;

  /**
   * Log ID
   */
  logId: string;

  /**
   * Timestamp
   */
  timestamp: string;

  /**
   * Log data
   */
  data: any;
}

/**
 * Interface for an encrypted log entry
 */
export interface EncryptedLogEntry {
  /**
   * Encrypted log data
   */
  data: string;

  /**
   * Initialization vector
   */
  iv: string;

  /**
   * Encryption algorithm
   */
  algorithm: string;

  /**
   * KEK version used to encrypt this log
   */
  kekVersion: string;

  /**
   * Timestamp
   */
  timestamp: string;

  /**
   * Log ID
   */
  id: string;

  /**
   * Search tokens
   */
  searchTokens?: string[];
}

/**
 * Interface for log search options
 */
export interface LogSearchOptions {
  /**
   * Search query
   */
  query?: string;

  /**
   * Start timestamp
   */
  startTime?: string;

  /**
   * End timestamp
   */
  endTime?: string;

  /**
   * Maximum number of results
   */
  limit?: number;

  /**
   * Offset for pagination
   */
  offset?: number;

  /**
   * Sort order
   */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Interface for log statistics
 */
export interface LogStatistics {
  /**
   * Total number of entries
   */
  totalEntries: number;

  /**
   * First entry timestamp
   */
  firstEntryTimestamp?: string;

  /**
   * Last entry timestamp
   */
  lastEntryTimestamp?: string;

  /**
   * Average entries per day
   */
  averageEntriesPerDay?: number;

  /**
   * Total storage size in bytes
   */
  totalStorageSize?: number;
}

/**
 * Interface for paginated results
 */
export interface PaginatedResult<T> {
  /**
   * Result entries
   */
  entries: T[];

  /**
   * Total count
   */
  totalCount: number;

  /**
   * Offset
   */
  offset: number;

  /**
   * Limit
   */
  limit: number;

  /**
   * Whether there are more results
   */
  hasMore: boolean;
}

/**
 * Interface for log creation options
 */
export interface LogCreateOptions {
  /**
   * Log name
   */
  name: string;

  /**
   * Log description
   */
  description?: string;

  /**
   * Log tags
   */
  tags?: string[];

  /**
   * Log retention period in days
   */
  retentionDays?: number;
}

/**
 * Interface for log update options
 */
export interface LogUpdateOptions {
  /**
   * Log description
   */
  description?: string;

  /**
   * Log tags
   */
  tags?: string[];

  /**
   * Log retention period in days
   */
  retentionDays?: number;
}
