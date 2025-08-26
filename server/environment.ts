import dotenv from 'dotenv';
dotenv.config();

let serviceAccount: Record<string, string> = {};
try {
    serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT || '{}');
} catch (e) {
    serviceAccount = {};
}

export const GOOGLE_SERVICE_ACCOUNT_EMAIL = serviceAccount['client_email'];
export const GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY = serviceAccount['private_key'];
