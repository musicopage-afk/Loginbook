import { jsonOk, jsonError } from "@/lib/api";
import { issueCsrfToken } from "@/lib/security";

export async function GET() {
  try {
    const token = await issueCsrfToken();
    return jsonOk({ token });
  } catch (error) {
    return jsonError(error);
  }
}
