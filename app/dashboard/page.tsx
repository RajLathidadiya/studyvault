"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Subscription = {
  plan: string;
  status: string;
  starts_at: string;
  ends_at: string;
};

type AuthState = "loading" | "no-auth" | "loaded";

const subjects = [
  { name: "Physics", slug: "physics", icon: "⚡" },
  { name: "Chemistry", slug: "chemistry", icon: "🧪" },
  { name: "Mathematics", slug: "mathematics", icon: "📐" },
  { name: "Biology", slug: "biology", icon: "🌿" },
];

export default function Dashboard() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [userEmail, setUserEmail] = useState("");
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [board, setBoard] = useState("gseb");

  useEffect(() => {
    async function load() {
      try {
        const [authRes, subRes] = await Promise.all([
          fetch("/api/auth/me", { cache: "no-store" }),
          fetch("/api/subscriptions/me", { cache: "no-store" }),
        ]);
        const authData = await authRes.json();
        const subData = await subRes.json();

        if (!authData.authenticated) {
          setAuthState("no-auth");
          return;
        }

        setUserEmail(authData.user?.email || "");
        setSubscription(subData.active ? subData.subscription : null);
        setAuthState("loaded");
      } catch {
        setAuthState("no-auth");
      }
    }
    load();
  }, []);

  if (authState === "loading") {
    return (
      <div className="page">
        <div className="container" style={{ textAlign: "center", padding: "4rem 0" }}>
          <p>Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (authState === "no-auth") {
    return (
      <div className="page">
        <div className="container narrow" style={{ textAlign: "center", padding: "4rem 0" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔐</div>
          <h1>Sign in to continue</h1>
          <p className="lead" style={{ marginBottom: "2rem" }}>Your dashboard is only available to logged-in students.</p>
          <Link href="/login?next=/dashboard" className="btn primary">Sign In</Link>
        </div>
      </div>
    );
  }

  const hasActiveSub = !!subscription;
  const subExpiry = subscription?.ends_at
    ? new Date(subscription.ends_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="page">
      <div className="container">
        <span className="eyebrow">STUDENT DASHBOARD</span>
        <h1>Welcome back{userEmail ? `, ${userEmail.split("@")[0]}` : ""}!</h1>
        <p className="lead">Track your preparation and access your study material.</p>

        {/* Subscription Status */}
        <div className="dashboard-status">
          <div>
            <span>SUBSCRIPTION</span>
            <strong className={hasActiveSub ? "live" : ""} style={{ color: hasActiveSub ? "#22c55e" : "#ef4444" }}>
              {hasActiveSub ? "ACTIVE" : "INACTIVE"}
            </strong>
          </div>
          <div>
            <span>PLAN</span>
            <strong>{hasActiveSub ? subscription!.plan.toUpperCase() : "—"}</strong>
          </div>
          <div>
            <span>EXPIRES</span>
            <strong>{subExpiry ?? "—"}</strong>
          </div>
          <div>
            <span>BOARD</span>
            <strong>
              <select
                value={board}
                onChange={(e) => setBoard(e.target.value)}
                style={{ background: "transparent", border: "none", color: "inherit", fontWeight: 700, fontSize: "inherit", cursor: "pointer" }}
              >
                <option value="gseb">GSEB</option>
                <option value="cbse">CBSE</option>
              </select>
            </strong>
          </div>
        </div>

        {!hasActiveSub && (
          <div style={{
            background: "rgba(234,179,8,0.1)",
            border: "1px solid rgba(234,179,8,0.3)",
            borderRadius: "12px",
            padding: "1.25rem 1.5rem",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
          }}>
            <div>
              <strong style={{ display: "block", marginBottom: "0.25rem" }}>No active subscription</strong>
              <span style={{ fontSize: "0.9rem", opacity: 0.8 }}>Subscribe to access chapter questions and study material.</span>
            </div>
            <Link href="/pricing" className="btn primary" style={{ fontSize: "0.85rem", padding: "0.5rem 1.25rem" }}>
              View Plans →
            </Link>
          </div>
        )}

        {/* Subjects Grid */}
        <div className="progress-grid">
          {subjects.map(({ name, slug, icon }) => (
            <div className="progress-card" key={slug}>
              <div className="progress-top">
                <h3>{icon} {name}</h3>
                <strong style={{ fontSize: "0.85rem", opacity: 0.6 }}>{board.toUpperCase()}</strong>
              </div>
              <div className="progress-bar">
                <span style={{ width: "0%" }} />
              </div>
              {hasActiveSub ? (
                <Link href={`/subjects/${board}/${slug}`}>Open chapters →</Link>
              ) : (
                <Link href="/pricing" style={{ opacity: 0.5 }}>🔒 Subscribe to access</Link>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link href={`/${board}`} className="btn secondary">Browse {board.toUpperCase()} Subjects</Link>
          <Link href="/pricing" className="btn secondary">Manage Subscription</Link>
          <button
            className="btn secondary"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/";
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
