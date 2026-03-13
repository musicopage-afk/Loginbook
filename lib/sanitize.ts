const controlChars = /[\u0000-\u001f\u007f]/g;

export function sanitizeAuditText(value: string) {
  return value.replace(controlChars, " ").trim();
}

export function sanitizeObject<T>(input: T): T {
  if (input instanceof Date) {
    return input.toISOString() as T;
  }

  if (typeof input === "string") {
    return sanitizeAuditText(input) as T;
  }

  if (Array.isArray(input)) {
    return input.map((item) => sanitizeObject(item)) as T;
  }

  if (input && typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [key, sanitizeObject(value)])
    ) as T;
  }

  return input;
}
