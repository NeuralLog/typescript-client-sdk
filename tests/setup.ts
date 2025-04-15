// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
  })),
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn(), eject: jest.fn() },
    response: { use: jest.fn(), eject: jest.fn() },
  },
}));

// Mock crypto functions
jest.mock('crypto-browserify', () => ({
  randomBytes: jest.fn(() => Buffer.from('random-bytes')),
  createHash: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => Buffer.from('hashed-data')),
  })),
  createHmac: jest.fn(() => ({
    update: jest.fn().mockReturnThis(),
    digest: jest.fn(() => Buffer.from('hmac-data')),
  })),
  createCipheriv: jest.fn(() => ({
    update: jest.fn(() => Buffer.from('encrypted-data')),
    final: jest.fn(() => Buffer.from('final-encrypted-data')),
  })),
  createDecipheriv: jest.fn(() => ({
    update: jest.fn(() => Buffer.from('decrypted-data')),
    final: jest.fn(() => Buffer.from('final-decrypted-data')),
  })),
}));

// Mock bip39
jest.mock('bip39', () => ({
  generateMnemonic: jest.fn(() => 'test mnemonic phrase'),
  mnemonicToSeed: jest.fn(() => Buffer.from('seed-from-mnemonic')),
  validateMnemonic: jest.fn(() => true),
}));

// Import our crypto mock
import { mockCrypto } from './mocks/crypto.mock';

// Install the mock crypto implementation
beforeAll(() => {
  // @ts-ignore - We're intentionally mocking the crypto object
  global.crypto = mockCrypto;
});

// Global beforeEach
beforeEach(() => {
  jest.clearAllMocks();
});

// Global afterAll
afterAll(() => {
  jest.restoreAllMocks();
});
