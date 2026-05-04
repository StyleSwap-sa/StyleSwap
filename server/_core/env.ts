export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  oAuthPortalUrl: process.env.VITE_OAUTH_PORTAL_URL ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  fitroomApiKey: process.env.FITROOM_API_KEY ?? "",
  yocoSecretKey: process.env.YOCO_SECRET_KEY ?? process.env.YOKO_SECRET_KEY ?? "",
  yocoPublicKey: process.env.YOCO_PUBLIC_KEY ?? process.env.YOKO_PUBLIC_KEY ?? "",
  yocoApiBaseUrl: process.env.YOCO_API_BASE_URL ?? process.env.YOKO_API_BASE_URL ?? "https://payments.yoco.com/api",
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? "",
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  awsRegion: process.env.AWS_REGION ?? "us-east-1",
  awsS3Bucket: process.env.AWS_S3_BUCKET ?? "",
};

console.log("[ENV Debug] AWS_ACCESS_KEY_ID from process.env:", !!process.env.AWS_ACCESS_KEY_ID);
console.log("[ENV Debug] AWS_SECRET_ACCESS_KEY from process.env:", !!process.env.AWS_SECRET_ACCESS_KEY);
console.log("[ENV Debug] AWS_ACCESS_KEY_ID from ENV object:", !!ENV.awsAccessKeyId);
console.log("[ENV Debug] AWS_SECRET_ACCESS_KEY from ENV object:", !!ENV.awsSecretAccessKey);
