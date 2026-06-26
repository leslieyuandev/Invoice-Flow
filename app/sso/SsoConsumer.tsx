"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

/**
 * Consumes the SSO token handed over by the main app and starts a local session
 * using the "sso" credentials provider (same client sign-in flow as the login form),
 * then lands the user on the Maps Extractor — no second password entry.
 */
export function SsoConsumer() {
  const params = useSearchParams();
  const started = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const token = params.get("token");
    if (!token) {
      window.location.replace("/login");
      return;
    }

    signIn("sso", { ssoToken: token, redirect: false }).then((res) => {
      if (res?.error) {
        setFailed(true);
        // Token invalid/expired — fall back to a normal login.
        setTimeout(() => window.location.replace("/login"), 1500);
      } else {
        window.location.replace("/maps-extractor");
      }
    });
  }, [params]);

  return (
    <div style={{ minHeight: "60vh", display: "grid", placeItems: "center", textAlign: "center", color: "#475569" }}>
      <div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>
          {failed ? "Couldn't sign you in automatically…" : "Signing you in…"}
        </div>
        <div style={{ marginTop: 8, fontSize: 14 }}>
          {failed ? "Redirecting to login." : "One moment while we open the Maps Extractor."}
        </div>
      </div>
    </div>
  );
}
