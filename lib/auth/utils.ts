"use client";

import { signOut } from "next-auth/react";

/**
 * Perform a clean logout by clearing local storage and signing out of NextAuth.
 * @param callbackUrl The URL to redirect to after logout.
 */
export async function handleGlobalLogout(callbackUrl: string) {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("subAccountName");
    localStorage.removeItem("isSubAccount");
  }
  
  await signOut({ callbackUrl });
}
