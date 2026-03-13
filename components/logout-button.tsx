"use client";

import { useRouter } from "next/navigation";
import { getCsrfTokenFromDocument } from "@/lib/client-security";

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "x-csrf-token": getCsrfTokenFromDocument()
      }
    });
    router.push("/login");
    router.refresh();
  }

  return (
    <button className="logout-button" onClick={logout}>
      Logout
    </button>
  );
}
