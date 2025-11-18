// Centralized config loader for Firebase Cloud Functions
// Prefer environment variables (CI / Docker / GCP Secret Manager). If not set,
// fall back to firebase functions.config() values when running in Firebase.

const functions = (() => {
  try {
    return require('firebase-functions');
  } catch (e) {
    return null;
  }
})();

const env = process.env;

const config = {
  stripe: {
    secretKey:
      env.STRIPE_SECRET_KEY || (functions && functions.config && functions.config().stripe && functions.config().stripe.secret_key) || '',
    webhookSecret:
      env.STRIPE_WEBHOOK_SECRET || (functions && functions.config && functions.config().stripe && functions.config().stripe.webhook_secret) || '',
  },
  agora: {
    appId: env.AGORA_APP_ID || (functions && functions.config && functions.config().agora && functions.config().agora.app_id) || 'a41807bba5c144b5b8e1fd5ee711707b',
    appCertificate:
      env.AGORA_APP_CERTIFICATE || (functions && functions.config && functions.config().agora && functions.config().agora.app_certificate) || '007eJxTYJDwWGJZ/aI5caX921xR5Vln3rxMrPzesObEj5O9e32ll/QqMCSaGFoYmCclJZomG5qYJJkmWaQapqWYpqaaGxqaAyUmOvBnNgQyMiz/P5WRkQECQXx2huCCxOyS/GwGBgBM/CLY',
  },
  firebase: {
    // Prefer GOOGLE_APPLICATION_CREDENTIALS for service account file path
    credentialsPath: env.GOOGLE_APPLICATION_CREDENTIALS || '',
  },
  chat: {
    appKey: env.CHAT_APP_KEY || '',
    orgName: env.CHAT_ORG_NAME || '',
    appName: env.CHAT_APP_NAME || '',
    clientId: env.CHAT_CLIENT_ID || '',
    clientSecret: env.CHAT_CLIENT_SECRET || '',
  },
  docker: {
    registryUser: env.DOCKER_REGISTRY_USERNAME || '',
    registryPAT: env.DOCKER_REGISTRY_PAT || '',
  },

  cloudflareR2: {
    accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY_ID || '',
    secretAccessKey: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || '',
    bucket: env.CLOUDFLARE_R2_BUCKET || '',
    accountId: env.CLOUDFLARE_R2_ACCOUNT_ID || '',
    endpoint: env.CLOUDFLARE_R2_ENDPOINT || '',
  },

  cloudflareStream: {
    apiToken: env.CLOUDFLARE_STREAM_API_TOKEN || '',
    accountId: env.CLOUDFLARE_STREAM_ACCOUNT_ID || '',
  },

  cloudflareImages: {
    apiToken: env.CLOUDFLARE_IMAGES_API_TOKEN || '',
    accountId: env.CLOUDFLARE_IMAGES_ACCOUNT_ID || '',
    accountHash: env.CLOUDFLARE_IMAGES_ACCOUNT_HASH || '',
  },
};

module.exports = config;
