import crypto from "node:crypto";
import { cookies, headers } from "next/headers";
import { NextRequest } from "next/server";
import { CSRF_COOKIE_NAME, SESSION_COOKIE_NAME } from "@/lib/constants";
import { env } from "@/lib/env";

export function sha256(value: string | Buffer) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function randomToken(size = 32) {
  return crypto.randomBytes(size).toString("hex");
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0)
  });
}

export async function issueCsrfToken() {
  const token = randomToken(16);
  const signed = `${token}.${sha256(`${token}:${env.csrfSecret}`)}`;
  const cookieStore = await cookies();

  cookieStore.set(CSRF_COOKIE_NAME, signed, {
    httpOnly: false,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/"
  });

  return signed;
}

export async function getCsrfTokenFromCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(CSRF_COOKIE_NAME)?.value ?? null;
}

export function validateSignedCsrf(token: string | null | undefined) {
  if (!token) {
    return false;
  }

  const [raw, signature] = token.split(".");
  if (!raw || !signature) {
    return false;
  }

  return sha256(`${raw}:${env.csrfSecret}`) === signature;
}

export function validateOrigin(request: Request | NextRequest) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  if (env.appUrl) {
    return origin === env.appUrl;
  }

  return origin === new URL(request.url).origin;
}

export function getClientIp(request: Request | NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";
}

export function getUserAgent(request: Request | NextRequest) {
  return request.headers.get("user-agent") ?? "unknown";
}

export async function getRequestSessionToken() {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getRequestHeaders() {
  const requestHeaders = await headers();
  return requestHeaders;
}
