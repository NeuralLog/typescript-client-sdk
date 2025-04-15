import { Base64Utils } from '../../../src/crypto/Base64Utils';
import { jest, describe, it, expect } from '@jest/globals';

describe('Base64Utils', () => {
  // Test that the class exists and has the expected methods
  it('should be defined', () => {
    expect(Base64Utils).toBeDefined();
  });

  it('should have the expected methods', () => {
    expect(typeof Base64Utils.arrayBufferToBase64).toBe('function');
    expect(typeof Base64Utils.base64ToArrayBuffer).toBe('function');
    expect(typeof Base64Utils.arrayBufferToBase64Url).toBe('function');
    expect(typeof Base64Utils.base64UrlToArrayBuffer).toBe('function');
  });

  // Test the arrayBufferToBase64 and base64ToArrayBuffer methods
  it('should convert ArrayBuffer to Base64 and back', () => {
    // Create a test buffer
    const buffer = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).buffer;
    
    // Convert to Base64
    const base64 = Base64Utils.arrayBufferToBase64(buffer);
    
    // Verify the Base64 string
    expect(typeof base64).toBe('string');
    
    // Convert back to ArrayBuffer
    const recoveredBuffer = Base64Utils.base64ToArrayBuffer(base64);
    
    // Verify the recovered buffer
    expect(recoveredBuffer).toBeInstanceOf(ArrayBuffer);
    
    // Compare the original and recovered buffers
    const originalBytes = new Uint8Array(buffer);
    const recoveredBytes = new Uint8Array(recoveredBuffer);
    
    expect(recoveredBytes.length).toBe(originalBytes.length);
    for (let i = 0; i < originalBytes.length; i++) {
      expect(recoveredBytes[i]).toBe(originalBytes[i]);
    }
  });

  // Test the arrayBufferToBase64Url and base64UrlToArrayBuffer methods
  it('should convert ArrayBuffer to URL-safe Base64 and back', () => {
    // Create a test buffer that would produce characters that need URL-safe encoding
    const buffer = new Uint8Array([
      // This should produce '+' and '/' in the Base64 encoding
      251, 239, 190, 239, 239, 255, 255, 255, 255, 255
    ]).buffer;
    
    // Convert to URL-safe Base64
    const base64Url = Base64Utils.arrayBufferToBase64Url(buffer);
    
    // Verify the URL-safe Base64 string
    expect(typeof base64Url).toBe('string');
    expect(base64Url).not.toContain('+');
    expect(base64Url).not.toContain('/');
    expect(base64Url).not.toContain('=');
    
    // Convert back to ArrayBuffer
    const recoveredBuffer = Base64Utils.base64UrlToArrayBuffer(base64Url);
    
    // Verify the recovered buffer
    expect(recoveredBuffer).toBeInstanceOf(ArrayBuffer);
    
    // Compare the original and recovered buffers
    const originalBytes = new Uint8Array(buffer);
    const recoveredBytes = new Uint8Array(recoveredBuffer);
    
    expect(recoveredBytes.length).toBe(originalBytes.length);
    for (let i = 0; i < originalBytes.length; i++) {
      expect(recoveredBytes[i]).toBe(originalBytes[i]);
    }
  });
});
