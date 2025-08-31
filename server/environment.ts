import dotenv from 'dotenv';
dotenv.config();

let serviceAccount: Record<string, string> = {};
try {
    serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || '{}');

} catch (e) {
    serviceAccount = {};
}

export const GOOGLE_APPLICATION_CREDENTIALS_EMAIL = serviceAccount['client_email'];
export const GOOGLE_APPLICATION_CREDENTIALS_PRIVATE_KEY = serviceAccount['private_key'];
