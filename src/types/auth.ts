/**
 * Interface for an encrypted KEK
 */
export interface EncryptedKEK {
  /**
   * Whether the KEK is encrypted
   */
  encrypted: boolean;
  
  /**
   * Encryption algorithm
   */
  algorithm: string;
  
  /**
   * Initialization vector
   */
  iv: string;
  
  /**
   * Encrypted KEK data
   */
  data: string;
  
  /**
   * KEK version
   */
  version: string;
}

/**
 * Interface for a user
 */
export interface User {
  /**
   * User ID
   */
  id: string;
  
  /**
   * Username
   */
  username: string;
  
  /**
   * Whether the user is an admin
   */
  isAdmin: boolean;
  
  /**
   * Tenant ID
   */
  tenantId: string;
}

/**
 * Interface for an admin promotion request
 */
export interface AdminPromotionRequest {
  /**
   * Request ID
   */
  id: string;
  
  /**
   * Candidate user ID
   */
  candidateId: string;
  
  /**
   * Candidate username
   */
  candidateName: string;
  
  /**
   * Requester user ID
   */
  requesterId: string;
  
  /**
   * Requester username
   */
  requesterName: string;
  
  /**
   * Request timestamp
   */
  timestamp: string;
  
  /**
   * Request status
   */
  status: 'pending' | 'approved' | 'rejected';
  
  /**
   * Threshold (number of approvals required)
   */
  threshold: number;
  
  /**
   * Number of approvals received
   */
  approvals: number;
}
