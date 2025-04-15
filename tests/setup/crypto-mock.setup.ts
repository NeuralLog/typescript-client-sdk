import { installMockCrypto } from '../mocks/crypto.mock';

// Install the mock crypto implementation
beforeAll(() => {
  installMockCrypto();
});

// Add a global afterAll hook to ensure tests don't interfere with each other
afterAll(() => {
  jest.restoreAllMocks();
});
