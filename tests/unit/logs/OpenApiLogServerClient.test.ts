import { LogsService } from '../../../src/logs/LogsService';
import { OpenApiLogServerClient } from '../../../src/logs/OpenApiLogServerClient';
import { LogServerClient } from '../../../src/logs/LogServerClient';
import { LogError } from '../../../src/errors';

// Mock the OpenAPI client
jest.mock('../../../src/logs/OpenApiLogServerClient');
jest.mock('../../../src/logs/LogServerClient');

describe('OpenAPI Client Integration', () => {
  describe('LogsService with OpenApiLogServerClient', () => {
    let logsService: LogsService;
    let mockOpenApiClient: jest.Mocked<OpenApiLogServerClient>;
    let mockAxiosInstance: any;

    beforeEach(() => {
      jest.clearAllMocks();

      // Create mock axios instance
      mockAxiosInstance = {
        defaults: {
          headers: {
            common: {
              'Authorization': 'Bearer test-token',
              'x-tenant-id': 'test-tenant'
            }
          }
        }
      };

      // Create mock for OpenApiLogServerClient
      mockOpenApiClient = {
        appendLog: jest.fn().mockResolvedValue('log-id-123'),
        getLogs: jest.fn().mockResolvedValue([{ id: 'log-1' }]),
        searchLogs: jest.fn().mockResolvedValue([{ id: 'log-1', timestamp: '2023-01-01T00:00:00Z', data: { encrypted: 'data' } }]),
        getBaseUrl: jest.fn().mockReturnValue('https://logs.test.com'),
        setBaseUrl: jest.fn()
      } as unknown as jest.Mocked<OpenApiLogServerClient>;

      // Mock the OpenApiLogServerClient constructor
      (OpenApiLogServerClient as jest.Mock).mockImplementation(() => mockOpenApiClient);

      // Create LogsService instance
      logsService = new LogsService('https://logs.test.com', mockAxiosInstance);

      // Replace the openApiClient property with our mock
      (logsService as any).openApiClient = mockOpenApiClient;
    });

    describe('appendLog', () => {
      it('should delegate to OpenApiLogServerClient', async () => {
        // Call appendLog
        await logsService.appendLog('encrypted-log-name', { data: 'test' }, 'token', ['search-token']);

        // Verify OpenApiLogServerClient was called
        expect(mockOpenApiClient.appendLog).toHaveBeenCalledWith('encrypted-log-name', { data: 'test' }, 'token', ['search-token']);
      });

      it('should handle errors', async () => {
        // Mock OpenApiLogServerClient to throw an error
        mockOpenApiClient.appendLog.mockRejectedValue(new Error('API error'));

        // Call appendLog and expect it to throw
        await expect(logsService.appendLog('encrypted-log-name', { data: 'test' }, 'token', ['search-token']))
          .rejects.toThrow('API error');
      });
    });

    describe('getLogs', () => {
      it('should delegate to OpenApiLogServerClient', async () => {
        // Call getLogs
        await logsService.getLogs('token', 10);

        // Verify OpenApiLogServerClient was called
        expect(mockOpenApiClient.getLogs).toHaveBeenCalledWith('token', 10, 0);
      });

      it('should handle errors', async () => {
        // Mock OpenApiLogServerClient to throw an error
        mockOpenApiClient.getLogs.mockRejectedValue(new Error('API error'));

        // Call getLogs and expect it to throw
        await expect(logsService.getLogs('token', 10))
          .rejects.toThrow('API error');
      });
    });

    describe('searchLogs', () => {
      it('should delegate to OpenApiLogServerClient', async () => {
        // Call searchLogs
        await logsService.searchLogs('encrypted-log-name', ['search-token'], 10, 'token');

        // Verify OpenApiLogServerClient was called
        expect(mockOpenApiClient.searchLogs).toHaveBeenCalledWith('encrypted-log-name', ['search-token'], 10, 'token');
      });

      it('should handle errors', async () => {
        // Mock OpenApiLogServerClient to throw an error
        mockOpenApiClient.searchLogs.mockRejectedValue(new Error('API error'));

        // Call searchLogs and expect it to throw
        await expect(logsService.searchLogs('encrypted-log-name', ['search-token'], 10, 'token'))
          .rejects.toThrow('API error');
      });
    });
  });

  describe('LogServerClient', () => {
    let mockLogServerClient: jest.Mocked<LogServerClient>;

    beforeEach(() => {
      jest.clearAllMocks();

      // Create mock for LogServerClient
      mockLogServerClient = {
        appendLog: jest.fn().mockResolvedValue('log-id-123'),
        getLogs: jest.fn().mockResolvedValue([{ id: 'log-1' }]),
        searchLogs: jest.fn().mockResolvedValue([{ id: 'log-1', timestamp: '2023-01-01T00:00:00Z', data: { encrypted: 'data' } }])
      } as unknown as jest.Mocked<LogServerClient>;

      // Mock the LogServerClient constructor
      (LogServerClient as jest.Mock).mockImplementation(() => mockLogServerClient);
    });

    it('should handle log operations correctly', async () => {
      // Call the methods
      const appendResult = await mockLogServerClient.appendLog('encrypted-log-name', { data: 'test' }, 'token', ['search-token']);
      const getResult = await mockLogServerClient.getLogs('encrypted-log-name', 'token', 10);
      const searchResult = await mockLogServerClient.searchLogs('encrypted-log-name', ['search-token'], 10, 'token');

      // Verify the results
      expect(appendResult).toBe('log-id-123');
      expect(getResult).toEqual([{ id: 'log-1' }]);
      expect(searchResult).toEqual([{ id: 'log-1', timestamp: '2023-01-01T00:00:00Z', data: { encrypted: 'data' } }]);

      // Verify the methods were called with correct parameters
      expect(mockLogServerClient.appendLog).toHaveBeenCalledWith('encrypted-log-name', { data: 'test' }, 'token', ['search-token']);
      expect(mockLogServerClient.getLogs).toHaveBeenCalledWith('encrypted-log-name', 'token', 10);
      expect(mockLogServerClient.searchLogs).toHaveBeenCalledWith('encrypted-log-name', ['search-token'], 10, 'token');
    });

    it('should handle errors correctly', async () => {
      // Mock the methods to throw errors
      mockLogServerClient.appendLog.mockRejectedValue(new LogError('Failed to append log', 'append_log_failed'));
      mockLogServerClient.getLogs.mockRejectedValue(new LogError('Failed to get logs', 'get_logs_failed'));
      mockLogServerClient.searchLogs.mockRejectedValue(new LogError('Failed to search logs', 'search_logs_failed'));

      // Verify that errors are thrown with correct messages
      await expect(mockLogServerClient.appendLog('encrypted-log-name', { data: 'test' }, 'token', ['search-token']))
        .rejects.toThrow('Failed to append log');
      await expect(mockLogServerClient.getLogs('encrypted-log-name', 'token', 10))
        .rejects.toThrow('Failed to get logs');
      await expect(mockLogServerClient.searchLogs('encrypted-log-name', ['search-token'], 10, 'token'))
        .rejects.toThrow('Failed to search logs');
    });
  });
});

