// Compatibility shim — Clerk now provides the modal sign-in. Component kept for callers.
import { SignInButton } from "@clerk/clerk-react";
import { useEffect, useRef } from "react";

export const SignInDialog = ({ open, onOpenChange, onSignedIn }: { open: boolean; onOpenChange: (b: boolean) => void; onSignedIn?: () => void }) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open && btnRef.current) {
      btnRef.current.click();
      onOpenChange(false);
      onSignedIn?.();
    }
  }, [open, onOpenChange, onSignedIn]);
  return (
    <SignInButton mode="modal">
      <button ref={btnRef} className="hidden" />
    </SignInButton>
  );
};
