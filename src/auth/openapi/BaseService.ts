import { AxiosInstance } from 'axios';

/**
 * Base service for OpenAPI services
 */
export class BaseService {
  protected baseUrl: string;
  protected apiClient: AxiosInstance;

  /**
   * Create a new BaseService
   *
   * @param baseUrl Base URL of the service
   * @param apiClient Axios instance for making requests
   */
  constructor(baseUrl: string, apiClient: AxiosInstance) {
    this.baseUrl = baseUrl;
    this.apiClient = apiClient;
  }

  /**
   * Set the base URL
   *
   * @param baseUrl Base URL of the service
   */
  public setBaseUrl(baseUrl: string): void {
    this.baseUrl = baseUrl;
  }
}
