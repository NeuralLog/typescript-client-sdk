/**
 * Error codes for NeuralLog operations
 */
export type LogErrorCode = string;

/**
 * Error code constants
 */
export const LogErrorCodes = {
  // General errors
  UNKNOWN_ERROR: 'unknown_error',
  NETWORK_ERROR: 'network_error',

  // Authentication errors
  LOGIN_FAILED: 'login_failed',
  LOGIN_WITH_API_KEY_FAILED: 'login_with_api_key_failed',
  LOGOUT_FAILED: 'logout_failed',
  TOKEN_VALIDATION_FAILED: 'token_validation_failed',
  NO_AUTH_CREDENTIAL: 'no_auth_credential',
  CHANGE_PASSWORD_FAILED: 'change_password_failed',
  VALIDATE_API_KEY_FAILED: 'validate_api_key_failed',
  GET_RESOURCE_TOKEN_FAILED: 'get_resource_token_failed',
  LIST_API_KEYS_FAILED: 'list_api_keys_failed',

  // API Key errors
  CREATE_API_KEY_FAILED: 'create_api_key_failed',
  GET_API_KEYS_FAILED: 'get_api_keys_failed',
  REVOKE_API_KEY_FAILED: 'revoke_api_key_failed',

  // Permission errors
  CHECK_PERMISSION_FAILED: 'check_permission_failed',

  // KEK errors
  GET_ENCRYPTED_KEK_FAILED: 'get_encrypted_kek_failed',
  CREATE_ENCRYPTED_KEK_FAILED: 'create_encrypted_kek_failed',
  UPDATE_ENCRYPTED_KEK_FAILED: 'update_encrypted_kek_failed',
  GET_KEK_BLOBS_FAILED: 'get_kek_blobs_failed',
  GET_KEK_VERSIONS_FAILED: 'get_kek_versions_failed',
  CREATE_KEK_VERSION_FAILED: 'create_kek_version_failed',
  ROTATE_KEK_FAILED: 'rotate_kek_failed',
  PROVISION_KEK_BLOB_FAILED: 'provision_kek_blob_failed',
  PROVISION_KEK_FAILED: 'provision_kek_failed',
  CREATE_QUORUM_TASK_FAILED: 'create_quorum_task_failed',
  ADD_SHARE_CONTRIBUTION_FAILED: 'add_share_contribution_failed',

  // Admin promotion errors
  PROVISION_ADMIN_SHARE_FAILED: 'provision_admin_share_failed',
  GET_ADMIN_SHARES_FAILED: 'get_admin_shares_failed',
  GET_PENDING_ADMIN_PROMOTIONS_FAILED: 'get_pending_admin_promotions_failed',
  APPROVE_ADMIN_PROMOTION_FAILED: 'approve_admin_promotion_failed',
  REJECT_ADMIN_PROMOTION_FAILED: 'reject_admin_promotion_failed',

  // User errors
  GET_USERS_FAILED: 'get_users_failed',
  GET_USER_KEY_PAIR_FAILED: 'get_user_key_pair_failed',
  UPLOAD_PUBLIC_KEY_FAILED: 'upload_public_key_failed',
  GET_PUBLIC_KEY_FAILED: 'get_public_key_failed',

  // Log errors
  CREATE_LOG_FAILED: 'create_log_failed',
  GET_LOG_FAILED: 'get_log_failed',
  UPDATE_LOG_FAILED: 'update_log_failed',
  DELETE_LOG_FAILED: 'delete_log_failed',
  GET_ALL_LOGS_FAILED: 'get_all_logs_failed',
  APPEND_LOG_ENTRY_FAILED: 'append_log_entry_failed',
  GET_LOG_ENTRIES_FAILED: 'get_log_entries_failed',
  GET_LOG_ENTRY_FAILED: 'get_log_entry_failed',
  SEARCH_LOG_ENTRIES_FAILED: 'search_log_entries_failed',
  GET_LOG_STATISTICS_FAILED: 'get_log_statistics_failed',
  BATCH_APPEND_LOG_ENTRIES_FAILED: 'batch_append_log_entries_failed',

  // Crypto errors
  DERIVE_MASTER_SECRET_FROM_MNEMONIC_FAILED: 'derive_master_secret_from_mnemonic_failed',
  DERIVE_MASTER_KEK_FAILED: 'derive_master_kek_failed',
  DERIVE_KEK_FAILED: 'derive_kek_failed',
  KEK_VERSION_NOT_FOUND: 'kek_version_not_found',
  NO_ACTIVE_KEK_VERSION: 'no_active_kek_version',
  DERIVE_LOG_KEY_FAILED: 'derive_log_key_failed',
  DERIVE_LOG_NAME_KEY_FAILED: 'derive_log_name_key_failed',
  DERIVE_SEARCH_KEY_FAILED: 'derive_search_key_failed',
  SPLIT_KEK_FAILED: 'split_kek_failed',
  DERIVE_KEY_PAIR_FAILED: 'derive_key_pair_failed',
  EXPORT_PUBLIC_KEY_FAILED: 'export_public_key_failed',
  IMPORT_PUBLIC_KEY_FAILED: 'import_public_key_failed',
  ENCRYPT_WITH_PUBLIC_KEY_FAILED: 'encrypt_with_public_key_failed',
  DECRYPT_WITH_PRIVATE_KEY_FAILED: 'decrypt_with_private_key_failed',
  RECONSTRUCT_KEK_FAILED: 'reconstruct_kek_failed',
  RECOVER_KEK_VERSIONS_FAILED: 'recover_kek_versions_failed',

  // Key derivation errors
  DERIVE_KEY_PBKDF2_FAILED: 'derive_key_pbkdf2_failed',
  DERIVE_KEY_HKDF_FAILED: 'derive_key_hkdf_failed',
  IMPORT_AES_GCM_KEY_FAILED: 'import_aes_gcm_key_failed',
  IMPORT_HMAC_KEY_FAILED: 'import_hmac_key_failed',

  // Initialization errors
  INITIALIZE_WITH_RECOVERY_PHRASE_FAILED: 'initialize_with_recovery_phrase_failed',
  INITIALIZE_WITH_MNEMONIC_FAILED: 'initialize_with_mnemonic_failed',
  INITIALIZE_WITH_API_KEY_FAILED: 'initialize_with_api_key_failed',

  // Mnemonic errors
  GENERATE_MNEMONIC_FAILED: 'generate_mnemonic_failed',
  VALIDATE_MNEMONIC_FAILED: 'validate_mnemonic_failed',
  MNEMONIC_TO_SEED_FAILED: 'mnemonic_to_seed_failed',
  GENERATE_QUIZ_QUESTIONS_FAILED: 'generate_quiz_questions_failed',
  VERIFY_QUIZ_ANSWERS_FAILED: 'verify_quiz_answers_failed'
} as const;
