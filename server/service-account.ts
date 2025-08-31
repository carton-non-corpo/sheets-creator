/**
 * Parse and validate service account credentials from runtime config
 */
export function getServiceAccountCredentials(config: any) {
  let serviceAccount: Record<string, string>;

  try {
    serviceAccount = JSON.parse(config.GOOGLE_APPLICATION_CREDENTIALS);
  } catch (e) {
    throw new Error('Invalid Google service account configuration');
  }

  if (!serviceAccount.client_email || !serviceAccount.private_key) {
    throw new Error('Missing Google service account credentials');
  }

  return serviceAccount;
}