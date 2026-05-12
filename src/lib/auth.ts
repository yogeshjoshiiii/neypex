// Thin wrapper around Clerk for non-React code paths. Prefer useUser() in components.
import { useUser } from "@clerk/clerk-react";

export type AppUser = { id: string; email: string; name?: string };

export function useAppUser(): AppUser | null {
  const { isSignedIn, user } = useUser();
  if (!isSignedIn || !user) return null;
  return {
    id: user.id,
    email: user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress || "",
    name: user.fullName || user.firstName || undefined,
  };
}
