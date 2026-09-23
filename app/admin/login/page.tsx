"use client";
import { FormEvent, useState } from "react";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || "Invalid credentials.");
      const me = await fetch("/api/auth/me", { cache: "no-store" }).then(x => x.json());
      if (me.profile?.role !== "admin") {
        await fetch("/api/auth/logout", { method: "POST" });
        throw new Error("This account does not have administrator access.");
      }
      window.location.href = "/admin";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0a0a0f 0%, #0f0f1a 50%, #0a0a0f 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1.5rem",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Background grid */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 0,
        backgroundImage: "linear-gradient(rgba(99,102,241,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.03) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
        pointerEvents: "none",
      }} />

      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: "420px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{
            width: "56px", height: "56px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            borderRadius: "16px",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "1.4rem", fontWeight: 800, color: "#fff",
            margin: "0 auto 1rem",
            boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
          }}>SV</div>
          <h1 style={{ color: "#fff", fontSize: "0.75rem", letterSpacing: "0.2em", fontWeight: 600, opacity: 0.5, textTransform: "uppercase", margin: 0 }}>
            StudyVault Admin Console
          </h1>
        </div>

        {/* Card */}
        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: "20px",
          padding: "2.5rem",
          backdropFilter: "blur(20px)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}>
          <h2 style={{ color: "#fff", fontSize: "1.6rem", fontWeight: 700, margin: "0 0 0.4rem" }}>
            Sign in
          </h2>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.9rem", margin: "0 0 2rem" }}>
            Authorized administrators only.
          </p>

          {error && (
            <div style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "10px",
              padding: "0.75rem 1rem",
              color: "#f87171",
              fontSize: "0.875rem",
              marginBottom: "1.5rem",
            }}>
              ✗ {error}
            </div>
          )}

          <form onSubmit={submit}>
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                Admin Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@yourdomain.com"
                autoComplete="username"
                required
                style={{
                  width: "100%", padding: "0.85rem 1rem",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  color: "#fff", fontSize: "0.95rem",
                  outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>

            <div style={{ marginBottom: "1.75rem" }}>
              <label style={{ display: "block", color: "rgba(255,255,255,0.6)", fontSize: "0.8rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                style={{
                  width: "100%", padding: "0.85rem 1rem",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "10px",
                  color: "#fff", fontSize: "0.95rem",
                  outline: "none", boxSizing: "border-box",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(99,102,241,0.6)"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              style={{
                width: "100%", padding: "0.9rem",
                background: busy ? "rgba(99,102,241,0.4)" : "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none", borderRadius: "10px",
                color: "#fff", fontSize: "0.95rem", fontWeight: 700,
                cursor: busy ? "not-allowed" : "pointer",
                boxShadow: busy ? "none" : "0 4px 20px rgba(99,102,241,0.4)",
                transition: "all 0.2s",
                letterSpacing: "0.02em",
              }}
            >
              {busy ? "Signing in…" : "Sign in to Admin Console →"}
            </button>
          </form>
        </div>

        <p style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <a href="/" style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.85rem", textDecoration: "none" }}>
            ← Back to StudyVault
          </a>
        </p>
      </div>
    </main>
  );
}
