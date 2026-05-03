import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App.tsx";
import "./index.css";

const PUBLISHABLE_KEY = "pk_test_c3RpcnJlZC1zd2FuLTMxLmNsZXJrLmFjY291bnRzLmRldiQ";

const Root = () => {
  if (!PUBLISHABLE_KEY) {
    return (
      <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0a0a0a", color: "#fff", fontFamily: "system-ui", padding: 24 }}>
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <h1 style={{ fontSize: 28, marginBottom: 12 }}>NEYPEX setup</h1>
          <p style={{ opacity: 0.8, marginBottom: 16 }}>
            Add your Clerk publishable key to <code>.env.local</code> as
            <br /><code>VITE_CLERK_PUBLISHABLE_KEY=pk_test_…</code>
          </p>
          <p style={{ opacity: 0.6, fontSize: 13 }}>Then refresh this preview.</p>
        </div>
      </div>
    );
  }
  return (
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  );
};

createRoot(document.getElementById("root")!).render(<Root />);
