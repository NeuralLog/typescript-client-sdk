import { MnemonicService } from '../../../src/crypto/MnemonicService';
import { jest, describe, it, expect, beforeEach, beforeAll, afterAll } from '@jest/globals';

// Mock the bip39 library
jest.mock('bip39', () => ({
  generateMnemonic: jest.fn().mockImplementation((strength = 128) => {
    // Return a fixed mnemonic for testing
    if (strength === 256) {
      return 'abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actress actual';
    }
    return 'abandon ability able about above absent absorb abstract absurd abuse access accident';
  }),
  validateMnemonic: jest.fn().mockImplementation((mnemonic) => {
    // Only validate our test mnemonics
    return mnemonic === 'abandon ability able about above absent absorb abstract absurd abuse access accident' ||
           mnemonic === 'abandon ability able about above absent absorb abstract absurd abuse access accident account accuse achieve acid acoustic acquire across act action actor actress actual';
  }),
  mnemonicToSeedSync: jest.fn().mockImplementation((mnemonic) => {
    // Return a fixed buffer for testing
    return Buffer.from('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', 'hex');
  }),
  wordlists: {
    english: Array(2048).fill(0).map((_, i) => `word${i}`)
  }
}));

describe('MnemonicService', () => {
  let mnemonicService: MnemonicService;

  beforeEach(() => {
    mnemonicService = new MnemonicService();
  });

  // Test that the class exists and has the expected methods
  it('should be defined', () => {
    expect(mnemonicService).toBeDefined();
  });

  it('should have the expected methods', () => {
    expect(typeof mnemonicService.generateMnemonic).toBe('function');
    expect(typeof mnemonicService.validateMnemonic).toBe('function');
    expect(typeof mnemonicService.mnemonicToSeed).toBe('function');
    expect(typeof mnemonicService.getWordList).toBe('function');
    expect(typeof mnemonicService.generateQuizQuestions).toBe('function');
    expect(typeof mnemonicService.verifyQuizAnswers).toBe('function');
  });

  // Test the generateMnemonic method
  it('should generate a mnemonic phrase with the default strength', () => {
    const mnemonic = mnemonicService.generateMnemonic();
    expect(typeof mnemonic).toBe('string');
    expect(mnemonic.split(' ').length).toBe(12); // Default is 128 bits = 12 words
    expect(mnemonicService.validateMnemonic(mnemonic)).toBe(true);
  });

  it('should generate a mnemonic phrase with custom strength', () => {
    const mnemonic = mnemonicService.generateMnemonic(256);
    expect(typeof mnemonic).toBe('string');
    expect(mnemonic.split(' ').length).toBe(24); // 256 bits = 24 words
    expect(mnemonicService.validateMnemonic(mnemonic)).toBe(true);
  });

  // Test the validateMnemonic method
  it('should validate a valid mnemonic phrase', () => {
    const mnemonic = mnemonicService.generateMnemonic();
    expect(mnemonicService.validateMnemonic(mnemonic)).toBe(true);
  });

  it('should invalidate an invalid mnemonic phrase', () => {
    const invalidMnemonic = 'invalid mnemonic phrase that is not valid';
    expect(mnemonicService.validateMnemonic(invalidMnemonic)).toBe(false);
  });

  // Test the mnemonicToSeed method
  it('should convert a mnemonic to a seed', () => {
    const mnemonic = mnemonicService.generateMnemonic();
    const seed = mnemonicService.mnemonicToSeed(mnemonic);
    expect(seed).toBeInstanceOf(Buffer);
    expect(seed.length).toBe(64); // 512 bits = 64 bytes
  });

  // Test the getWordList method
  it('should return the BIP-39 word list', () => {
    const wordList = mnemonicService.getWordList();
    expect(Array.isArray(wordList)).toBe(true);
    expect(wordList.length).toBe(2048); // BIP-39 English word list has 2048 words
  });

  // Test the generateQuizQuestions method
  it('should generate quiz questions from a mnemonic', () => {
    const mnemonic = mnemonicService.generateMnemonic();
    const questions = mnemonicService.generateQuizQuestions(mnemonic, 3);
    expect(Array.isArray(questions)).toBe(true);
    expect(questions.length).toBe(3);

    // Verify each question has the expected properties
    questions.forEach(question => {
      expect(question).toHaveProperty('index');
      expect(question).toHaveProperty('word');
      expect(typeof question.index).toBe('number');
      expect(typeof question.word).toBe('string');

      // Verify the word matches the mnemonic at the given index
      const words = mnemonic.split(' ');
      expect(question.word).toBe(words[question.index]);
    });
  });

  // Test the verifyQuizAnswers method
  it('should verify quiz answers correctly', () => {
    const mnemonic = mnemonicService.generateMnemonic();
    const words = mnemonic.split(' ');

    // Create some correct answers
    const correctAnswers = [
      { index: 0, word: words[0] },
      { index: 5, word: words[5] },
      { index: 10, word: words[10] }
    ];

    // Verify correct answers
    expect(mnemonicService.verifyQuizAnswers(mnemonic, correctAnswers)).toBe(true);

    // Create some incorrect answers
    const incorrectAnswers = [
      { index: 0, word: words[0] },
      { index: 5, word: 'wrong-word' },
      { index: 10, word: words[10] }
    ];

    // Verify incorrect answers
    expect(mnemonicService.verifyQuizAnswers(mnemonic, incorrectAnswers)).toBe(false);
  });
});
