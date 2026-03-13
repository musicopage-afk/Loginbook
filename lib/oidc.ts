import { env } from "@/lib/env";

export function getOidcConfig() {
  return {
    enabled: Boolean(env.oidc.issuer && env.oidc.clientId && env.oidc.redirectUri),
    issuer: env.oidc.issuer,
    clientId: env.oidc.clientId,
    redirectUri: env.oidc.redirectUri
  };
}
