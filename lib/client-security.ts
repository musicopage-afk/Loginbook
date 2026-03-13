import { CSRF_COOKIE_NAME } from "@/lib/constants";

export function getCsrfTokenFromDocument() {
  if (typeof document === "undefined") {
    return "";
  }

  return document.cookie
    .split(";")
    .map((chunk) => chunk.trim())
    .find((chunk) => chunk.startsWith(`${CSRF_COOKIE_NAME}=`))
    ?.split("=")[1] ?? "";
}
