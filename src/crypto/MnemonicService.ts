/**
 * Mnemonic Service for generating and validating BIP-39 mnemonic phrases
 */

import * as bip39 from 'bip39';
import { LogError } from '../errors';

/**
 * Mnemonic Service
 * 
 * Provides methods for generating and validating BIP-39 mnemonic phrases,
 * which are used as recovery phrases for the master secret.
 */
export class MnemonicService {
  /**
   * Generate a new mnemonic phrase (12 words by default)
   * 
   * @param strength Optional strength in bits (128 = 12 words, 256 = 24 words)
   * @returns The generated mnemonic phrase
   */
  public generateMnemonic(strength: number = 128): string {
    try {
      return bip39.generateMnemonic(strength);
    } catch (error) {
      throw new LogError(
        `Failed to generate mnemonic: ${error instanceof Error ? error.message : String(error)}`,
        'generate_mnemonic_failed'
      );
    }
  }

  /**
   * Validate a mnemonic phrase
   * 
   * @param mnemonic The mnemonic phrase to validate
   * @returns True if the mnemonic is valid
   */
  public validateMnemonic(mnemonic: string): boolean {
    try {
      return bip39.validateMnemonic(mnemonic);
    } catch (error) {
      throw new LogError(
        `Failed to validate mnemonic: ${error instanceof Error ? error.message : String(error)}`,
        'validate_mnemonic_failed'
      );
    }
  }

  /**
   * Convert a mnemonic phrase to a seed
   * 
   * @param mnemonic The mnemonic phrase
   * @param passphrase Optional passphrase for additional security
   * @returns The seed as a Buffer
   */
  public mnemonicToSeed(mnemonic: string, passphrase: string = ''): Buffer {
    try {
      return bip39.mnemonicToSeedSync(mnemonic, passphrase);
    } catch (error) {
      throw new LogError(
        `Failed to convert mnemonic to seed: ${error instanceof Error ? error.message : String(error)}`,
        'mnemonic_to_seed_failed'
      );
    }
  }

  /**
   * Get the word list
   * 
   * @returns The BIP-39 word list
   */
  public getWordList(): string[] {
    return bip39.wordlists.english;
  }

  /**
   * Generate quiz questions from a mnemonic phrase
   * 
   * @param mnemonic The mnemonic phrase
   * @param numQuestions Number of questions to generate (default: 3)
   * @returns Array of quiz questions with word index and word
   */
  public generateQuizQuestions(mnemonic: string, numQuestions: number = 3): Array<{ index: number; word: string }> {
    try {
      if (!this.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      const words = mnemonic.split(' ');
      const totalWords = words.length;
      
      if (numQuestions > totalWords) {
        numQuestions = totalWords;
      }

      // Generate random indices
      const indices = new Set<number>();
      while (indices.size < numQuestions) {
        indices.add(Math.floor(Math.random() * totalWords));
      }

      // Create quiz questions
      return Array.from(indices).map(index => ({
        index,
        word: words[index]
      }));
    } catch (error) {
      throw new LogError(
        `Failed to generate quiz questions: ${error instanceof Error ? error.message : String(error)}`,
        'generate_quiz_questions_failed'
      );
    }
  }

  /**
   * Verify quiz answers
   * 
   * @param mnemonic The original mnemonic phrase
   * @param answers Array of answers with index and word
   * @returns True if all answers are correct
   */
  public verifyQuizAnswers(
    mnemonic: string,
    answers: Array<{ index: number; word: string }>
  ): boolean {
    try {
      if (!this.validateMnemonic(mnemonic)) {
        throw new Error('Invalid mnemonic phrase');
      }

      const words = mnemonic.split(' ');
      
      // Check each answer
      return answers.every(answer => words[answer.index] === answer.word);
    } catch (error) {
      throw new LogError(
        `Failed to verify quiz answers: ${error instanceof Error ? error.message : String(error)}`,
        'verify_quiz_answers_failed'
      );
    }
  }
}
