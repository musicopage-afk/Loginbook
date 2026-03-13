import crypto from "node:crypto";

const runtimeSecrets = new Map<string, string>();

function runtimeSecret(name: string) {
  const configured = process.env[name];
  if (configured) {
    return configured;
  }

  const existing = runtimeSecrets.get(name);
  if (existing) {
    return existing;
  }

  const generated = crypto.randomBytes(32).toString("hex");
  runtimeSecrets.set(name, generated);
  console.warn(`${name} is not set; generated an ephemeral runtime secret. Configure a stable value for production.`);
  return generated;
}

export const env = {
  get appUrl() {
    return process.env.APP_URL ?? "";
  },
  get sessionSecret() {
    return runtimeSecret("SESSION_SECRET");
  },
  get csrfSecret() {
    return runtimeSecret("CSRF_SECRET");
  },
  oidc: {
    get issuer() {
      return process.env.OIDC_ISSUER ?? "";
    },
    get clientId() {
      return process.env.OIDC_CLIENT_ID ?? "";
    },
    get clientSecret() {
      return process.env.OIDC_CLIENT_SECRET ?? "";
    },
    get redirectUri() {
      return process.env.OIDC_REDIRECT_URI ?? "";
    }
  },
  storage: {
    get driver() {
      return process.env.STORAGE_DRIVER ?? "local";
    },
    get localUploadDir() {
      return process.env.LOCAL_UPLOAD_DIR ?? "./uploads";
    },
    get s3Endpoint() {
      return process.env.S3_ENDPOINT ?? "";
    },
    get s3Region() {
      return process.env.S3_REGION ?? "";
    },
    get s3Bucket() {
      return process.env.S3_BUCKET ?? "";
    },
    get s3AccessKeyId() {
      return process.env.S3_ACCESS_KEY_ID ?? "";
    },
    get s3SecretAccessKey() {
      return process.env.S3_SECRET_ACCESS_KEY ?? "";
    }
  },
  get rateLimitWindowMs() {
    return Number(process.env.RATE_LIMIT_WINDOW_MS ?? "900000");
  },
  get rateLimitMaxAttempts() {
    return Number(process.env.RATE_LIMIT_MAX_ATTEMPTS ?? "5");
  }
};
