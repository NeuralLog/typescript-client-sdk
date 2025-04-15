import { hmac } from '@noble/hashes/hmac';
import { sha256 } from '@noble/hashes/sha256';
import { utf8ToBytes } from '@noble/ciphers/utils';
import { base64 } from '@scure/base';

/**
 * Zero-Knowledge Proof utilities
 */
export class ZKPUtils {
  /**
   * Generate a challenge response for API key authentication
   * 
   * @param apiKey API key
   * @param challenge Challenge from the server
   * @returns Challenge response
   */
  public generateChallengeResponse(apiKey: string, challenge: string): string {
    // Extract the key ID and secret from the API key
    const [keyId, secret] = apiKey.split('.');

    // Create a signature using the secret and the challenge
    const signature = this.hmacSha256(challenge, secret);

    // Return the key ID and the signature
    return `${keyId}.${signature}`;
  }

  /**
   * Generate a token client-side using the API key
   * 
   * @param apiKey API key
   * @param userId User ID
   * @param tenantId Tenant ID
   * @param scopes Scopes
   * @returns Generated token
   */
  public generateToken(apiKey: string, userId: string, tenantId: string, scopes: string[]): string {
    // Extract the secret from the API key
    const secret = apiKey.split('.')[1];

    // Create a payload
    const payload = {
      sub: userId,
      tenant: tenantId,
      scopes,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
    };

    // Convert payload to string
    const payloadStr = JSON.stringify(payload);

    // Create a signature using the secret and the payload
    const signature = this.hmacSha256(payloadStr, secret);

    // Combine the payload and signature
    const token = base64.encode(utf8ToBytes(`${payloadStr}.${signature}`));

    return token;
  }

  /**
   * Create an HMAC-SHA256 signature
   * 
   * @param message Message to sign
   * @param key Key to use for signing
   * @returns Signature
   */
  private hmacSha256(message: string, key: string): string {
    const messageBytes = utf8ToBytes(message);
    const keyBytes = utf8ToBytes(key);
    const signature = hmac(sha256, keyBytes, messageBytes);
    return base64.encode(signature);
  }
}
