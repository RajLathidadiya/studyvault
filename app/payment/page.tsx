"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const PLANS: Record<string, { name: string; price: string; amount: number }> = {
  monthly: { name: "Monthly", price: "₹99", amount: 99 },
  yearly: { name: "Yearly", price: "₹499", amount: 499 },
};

function PaymentContent() {
  const params = useSearchParams();
  const planKey = params.get("plan") || "monthly";
  const plan = PLANS[planKey] ?? PLANS.monthly;

  const upiId = "9265121020@upi";
  const upiLink = `upi://pay?pa=${upiId}&pn=StudyVault&am=${plan.amount}&cu=INR`;

  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (r) => {
        const data = await r.json();
        if (!data.authenticated) {
          const next = encodeURIComponent(`/payment?plan=${planKey}`);
          window.location.href = `/login?next=${next}`;
        } else {
          setAuthChecked(true);
        }
      })
      .catch(() => {
        const next = encodeURIComponent(`/payment?plan=${planKey}`);
        window.location.href = `/login?next=${next}`;
      });
  }, [planKey]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!utr.trim()) return;
    setBusy(true);
    setMessage("");
    setIsError(false);
    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: plan.name, amount: plan.amount, utr: utr.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setIsError(true);
        setMessage(data.error || "Could not submit payment.");
      } else {
        setSubmitted(true);
        setMessage("Payment submitted! Admin will verify and activate your access within a few hours.");
      }
    } catch {
      setIsError(true);
      setMessage("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!authChecked) {
    return (
      <div className="page">
        <div className="container narrow" style={{ textAlign: "center", padding: "4rem 0" }}>
          <p>Checking your account…</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="page">
        <div className="container narrow">
          <div className="payment-card" style={{ textAlign: "center" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>✅</div>
            <h2>Payment Submitted!</h2>
            <p style={{ marginBottom: "1.5rem" }}>
              Your UTR <strong>{utr}</strong> has been received. Admin will verify and activate your
              <strong> {plan.name}</strong> plan access within a few hours.
            </p>
            <Link href="/dashboard" className="btn primary full">Go to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="container narrow">
        <Link className="back" href="/pricing">← Back to Plans</Link>
        <span className="eyebrow">DIRECT UPI • {plan.name.toUpperCase()} PLAN</span>
        <h1>Complete your payment.</h1>
        <p className="lead">
          Pay <strong>{plan.price}</strong> via UPI, then submit your UTR / transaction ID for admin verification.
        </p>

        <div className="payment-card">
          <div className="qr-placeholder">UPI<br />QR</div>

          <h3>Pay via UPI</h3>
          <p className="upi">{upiId}</p>
          <p style={{ marginBottom: "1rem", fontSize: "0.9rem", opacity: 0.7 }}>
            Amount: <strong>{plan.price}</strong> — {plan.name} Plan
          </p>

          <a className="btn primary full" href={upiLink}>
            Open UPI App
          </a>

          <form onSubmit={handleSubmit} style={{ marginTop: "1.5rem" }}>
            <div className="form-field">
              <label>UTR / Transaction ID</label>
              <input
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                placeholder="Enter your 12-digit UTR number"
                required
                minLength={6}
                disabled={busy}
              />
            </div>

            <button
              className="btn secondary full"
              type="submit"
              disabled={busy || !utr.trim()}
              style={{ marginTop: "0.75rem" }}
            >
              {busy ? "Submitting…" : "Submit Payment for Verification"}
            </button>
          </form>

          {message && (
            <p
              style={{
                marginTop: "1rem",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                background: isError ? "rgba(239,68,68,0.1)" : "rgba(34,197,94,0.1)",
                color: isError ? "#ef4444" : "#22c55e",
                fontSize: "0.9rem",
              }}
            >
              {isError ? "✗" : "✓"} {message}
            </p>
          )}

          <small style={{ display: "block", marginTop: "1rem", opacity: 0.6 }}>
            After payment, enter the UTR. Admin approval will activate your StudyVault subscription.
          </small>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={<div className="page"><div className="container narrow" style={{ textAlign: "center", padding: "4rem 0" }}><p>Loading payment…</p></div></div>}>
      <PaymentContent />
    </Suspense>
  );
}
