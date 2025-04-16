import { Configuration } from '../generated/log-server/configuration';
import { DefaultApi } from '../generated/log-server/api';
import { AxiosInstance } from 'axios';
import { ClientConfig } from '../types/config';

/**
 * Client for managing retention policies
 */
export class RetentionPolicyClient {
  private api: DefaultApi;
  private tenantId: string;

  /**
   * Constructor
   * 
   * @param config Client configuration
   * @param axiosInstance Axios instance
   */
  constructor(config: ClientConfig, axiosInstance: AxiosInstance) {
    this.tenantId = config.tenantId;

    // Create the API client
    const apiConfig = new Configuration({
      basePath: config.logServerUrl,
      accessToken: config.token,
    });

    this.api = new DefaultApi(apiConfig, axiosInstance);
  }

  /**
   * Get the retention policy for the tenant
   * 
   * @returns The retention policy
   */
  public async getRetentionPolicy() {
    const response = await this.api.getRetentionPolicy({
      xTenantId: this.tenantId
    });
    return response.data;
  }

  /**
   * Set the retention policy for the tenant
   * 
   * @param retentionPeriodMs Retention period in milliseconds
   * @returns The updated retention policy
   */
  public async setRetentionPolicy(retentionPeriodMs: number) {
    const response = await this.api.setRetentionPolicy({
      xTenantId: this.tenantId,
      retentionPolicyRequest: {
        retentionPeriodMs
      }
    });
    return response.data;
  }

  /**
   * Delete the retention policy for the tenant
   */
  public async deleteRetentionPolicy() {
    await this.api.deleteRetentionPolicy({
      xTenantId: this.tenantId
    });
  }

  /**
   * Get the count of logs that would be affected by a retention policy change
   * 
   * @param retentionPeriodMs Retention period in milliseconds
   * @returns The count of logs that would be affected
   */
  public async getExpiredLogsCount(retentionPeriodMs: number) {
    const response = await this.api.getExpiredLogsCount({
      xTenantId: this.tenantId,
      retentionPeriodMs
    });
    return response.data.count;
  }
}
