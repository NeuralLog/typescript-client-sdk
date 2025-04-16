import { AxiosInstance } from 'axios';
import { ConfigurationService } from './services/ConfigurationService';
import { AuthProvider } from './services/AuthProvider';
import { RetentionPolicy, RetentionPolicyApi, Configuration, RetentionPolicyRequest } from '../generated/log-server/api';
import { LogError } from '../errors';

/**
 * Client for managing retention policies
 */
export class RetentionPolicyClient {
  private apiClient: RetentionPolicyApi;
  private tenantId: string;
  private baseUrl: string;

  /**
   * Constructor
   *
   * @param configService Configuration service
   * @param authProvider Authentication provider
   */
  constructor(
    private configService: ConfigurationService,
    private authProvider: AuthProvider
  ) {
    this.tenantId = configService.getTenantId();
    this.baseUrl = configService.getServerUrlSync() || '';

    // Create API client configuration
    const apiConfig = new Configuration({
      basePath: this.baseUrl,
      accessToken: async () => await this.authProvider.getToken() || ''
    });

    // Create API client
    this.apiClient = new RetentionPolicyApi(apiConfig);
  }

  /**
   * Set the base URL for the API client
   *
   * @param url Base URL
   */
  public setBaseUrl(url: string): void {
    this.baseUrl = url;

    // Create new API client with updated base URL
    const apiConfig = new Configuration({
      basePath: url,
      accessToken: async () => await this.authProvider.getToken() || ''
    });

    this.apiClient = new RetentionPolicyApi(apiConfig);
  }

  /**
   * Initialize the client
   *
   * @returns Promise that resolves when initialization is complete
   */
  public async initialize(): Promise<void> {
    // Nothing to do here, but required for consistency with other clients
    return Promise.resolve();
  }

  /**
   * Get the retention policy for the tenant or a specific log
   *
   * @param encryptedLogName Optional encrypted log name - if provided, gets the policy for this specific log
   * @returns The retention policy
   */
  public async getRetentionPolicy(encryptedLogName?: string): Promise<RetentionPolicy> {
    try {
      // Call the API
      const response = await this.apiClient.getRetentionPolicy({
        xTenantId: this.tenantId,
        logName: encryptedLogName
      });

      return response.data;
    } catch (error) {
      throw new LogError(
        `Failed to get retention policy: ${error instanceof Error ? error.message : String(error)}`,
        'get_retention_policy_failed'
      );
    }
  }

  /**
   * Get all retention policies for the tenant
   *
   * @returns Array of retention policies
   */
  public async getAllRetentionPolicies(): Promise<RetentionPolicy[]> {
    try {
      const response = await this.apiClient.getAllRetentionPolicies({
        xTenantId: this.tenantId
      });

      return response.data;
    } catch (error) {
      throw new LogError(
        `Failed to get all retention policies: ${error instanceof Error ? error.message : String(error)}`,
        'get_all_retention_policies_failed'
      );
    }
  }

  /**
   * Set the retention policy for the tenant or a specific log
   *
   * @param retentionPeriodMs Retention period in milliseconds
   * @param encryptedLogName Optional encrypted log name - if provided, sets the policy for this specific log
   * @returns The updated retention policy
   */
  public async setRetentionPolicy(retentionPeriodMs: number, encryptedLogName?: string): Promise<RetentionPolicy> {
    try {
      // Prepare request
      const request: RetentionPolicyRequest = {
        retentionPeriodMs,
        logName: encryptedLogName
      };

      // Call the API
      const response = await this.apiClient.setRetentionPolicy({
        xTenantId: this.tenantId,
        retentionPolicyRequest: request
      });

      return response.data;
    } catch (error) {
      throw new LogError(
        `Failed to set retention policy: ${error instanceof Error ? error.message : String(error)}`,
        'set_retention_policy_failed'
      );
    }
  }

  /**
   * Delete the retention policy for the tenant or a specific log
   *
   * @param encryptedLogName Optional encrypted log name - if provided, deletes the policy for this specific log
   */
  public async deleteRetentionPolicy(encryptedLogName?: string): Promise<void> {
    try {
      await this.apiClient.deleteRetentionPolicy({
        xTenantId: this.tenantId,
        logName: encryptedLogName
      });
    } catch (error) {
      throw new LogError(
        `Failed to delete retention policy: ${error instanceof Error ? error.message : String(error)}`,
        'delete_retention_policy_failed'
      );
    }
  }

  /**
   * Get the count of logs that would be affected by a retention policy change
   *
   * @param retentionPeriodMs Retention period in milliseconds
   * @param encryptedLogName Optional encrypted log name - if provided, gets the count for this specific log
   * @returns The count of logs that would be affected
   */
  public async getExpiredLogsCount(retentionPeriodMs: number, encryptedLogName?: string): Promise<number> {
    try {
      const response = await this.apiClient.getExpiredLogsCount({
        xTenantId: this.tenantId,
        retentionPeriodMs,
        logName: encryptedLogName
      });

      return response.data.count || 0;
    } catch (error) {
      throw new LogError(
        `Failed to get expired logs count: ${error instanceof Error ? error.message : String(error)}`,
        'get_expired_logs_count_failed'
      );
    }
  }
}
