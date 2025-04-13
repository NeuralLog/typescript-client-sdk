/**
 * Error codes for the NeuralLog client
 */
export type LogErrorCode =
  | 'authentication_failed'
  | 'not_authenticated'
  | 'login_failed'
  | 'logout_failed'
  | 'change_password_failed'
  | 'log_failed'
  | 'get_logs_failed'
  | 'search_logs_failed'
  | 'get_log_names_failed'
  | 'clear_log_failed'
  | 'delete_log_failed'
  | 'validate_api_key_failed'
  | 'get_resource_token_failed'
  | 'create_api_key_failed'
  | 'list_api_keys_failed'
  | 'revoke_api_key_failed'
  | 'encrypt_log_data_failed'
  | 'decrypt_log_data_failed'
  | 'generate_search_tokens_failed'
  | 'encrypt_log_name_failed'
  | 'decrypt_log_name_failed'
  | 'derive_key_failed'
  | 'derive_master_secret_failed'
  | 'generate_kek_failed'
  | 'encrypt_kek_failed'
  | 'decrypt_kek_failed'
  | 'get_encrypted_kek_failed'
  | 'create_encrypted_kek_failed'
  | 'update_encrypted_kek_failed'
  | 'generate_id_failed'
  | 'generate_api_key_verification_hash_failed'
  | 'generate_api_key_proof_failed'
  | 'verify_resource_token_failed'
  | 'initialize_key_hierarchy_failed'
  | 'derive_api_key_failed'
  | 'kek_not_found'
  | 'append_log_failed'
  | 'migrate_log_names_failed';

/**
 * Error class for the NeuralLog client
 */
export class LogError extends Error {
  /**
   * Error code
   */
  public readonly code: LogErrorCode;

  /**
   * Create a new LogError
   *
   * @param message Error message
   * @param code Error code
   */
  constructor(message: string, code: LogErrorCode) {
    super(message);
    this.name = 'LogError';
    this.code = code;

    // Set the prototype explicitly
    Object.setPrototypeOf(this, LogError.prototype);
  }
}
