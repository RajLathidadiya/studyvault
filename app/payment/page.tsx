"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const PLANS: Record<string, { name: string; price: string; amount: number }> = {
  monthly: { name: "Monthly", price: "₹99", amount: 99 },
  yearly: { name: "Yearly", price: "₹499", amount: 499 },
};

const UPI_ID = "9265121020@upi";
const UPI_NAME = "StudyVault";

const UPI_APPS = [
  { name: "GPay", emoji: "🟢", scheme: "gpay://upi/pay" },
  { name: "PhonePe", emoji: "🟣", scheme: "phonepe://pay" },
  { name: "Paytm", emoji: "🔵", scheme: "paytmmp://pay" },
  { name: "BHIM", emoji: "🇮🇳", scheme: "upi://pay" },
];

function PaymentContent() {
  const params = useSearchParams();
  const planKey = params.get("plan") || "monthly";
  const plan = PLANS[planKey] ?? PLANS.monthly;

  const upiLink = `upi://pay?pa=${UPI_ID}&pn=${UPI_NAME}&am=${plan.amount}&cu=INR`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(upiLink)}&bgcolor=ffffff&color=0b1020&qzone=1&format=png`;

  const [utr, setUtr] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAppTip, setShowAppTip] = useState(false);
  const [step, setStep] = useState<"pay" | "utr">("pay");

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
      }
    } catch {
      setIsError(true);
      setMessage("Could not reach the server. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  function openUpiApp(scheme: string) {
    setShowAppTip(true);
    const link = `${scheme}?pa=${UPI_ID}&pn=${UPI_NAME}&am=${plan.amount}&cu=INR`;
    window.location.href = link;
    setTimeout(() => setStep("utr"), 1500);
  }

  if (!authChecked) {
    return (
      <div className="pay-page">
        <div style={{ textAlign: "center", padding: "6rem 0", color: "#667085" }}>Checking account…</div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="pay-page">
        <div className="pay-success-card">
          <div className="pay-success-icon">✅</div>
          <h2>Payment Submitted!</h2>
          <p>Your UTR <strong>{utr}</strong> has been received.</p>
          <p style={{ marginTop: "0.5rem", opacity: 0.7, fontSize: "0.9rem" }}>
            Admin will verify and activate your <strong>{plan.name}</strong> plan within a few hours.
          </p>
          <Link href="/dashboard" className="btn primary full" style={{ marginTop: "1.5rem", display: "flex" }}>
            Go to Dashboard →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pay-page">
      {/* Header */}
      <div className="pay-header">
        <Link className="back" href="/pricing">← Back to Plans</Link>
        <span className="eyebrow" style={{ color: "var(--brand)" }}>UPI PAYMENT • {plan.name.toUpperCase()} PLAN</span>
        <h1 style={{ fontSize: "clamp(28px, 5vw, 46px)", letterSpacing: "-1.5px", margin: "10px 0 6px" }}>
          Complete your payment.
        </h1>
        <p style={{ color: "var(--muted)", fontSize: "1rem" }}>
          Pay <strong style={{ color: "var(--ink)" }}>{plan.price}</strong> via UPI, then submit your UTR number below.
        </p>
      </div>

      {/* Step indicator */}
      <div className="pay-steps">
        <div className={`pay-step ${step === "pay" ? "active" : "done"}`}>
          <span>{step === "pay" ? "1" : "✓"}</span> Pay via UPI
        </div>
        <div className="pay-step-line" />
        <div className={`pay-step ${step === "utr" ? "active" : ""}`}>
          <span>2</span> Submit UTR
        </div>
      </div>

      <div className="pay-grid">
        {/* Left — QR + UPI */}
        <div className="pay-card">
          <div className="pay-card-header">
            <h2>Scan & Pay</h2>
            <p>Scan the QR code with any UPI app, or open your UPI app directly.</p>
          </div>

          {/* QR Code */}
          <div className="pay-qr-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="UPI QR Code"
              width={200}
              height={200}
              className="pay-qr-img"
            />
            <div className="pay-qr-label">Scan with any UPI app</div>
          </div>

          {/* UPI ID */}
          <div className="pay-upi-row">
            <div>
              <div style={{ fontSize: "0.75rem", color: "var(--muted)", fontWeight: 700, marginBottom: "3px" }}>UPI ID</div>
              <div className="pay-upi-id">{UPI_ID}</div>
            </div>
            <button
              className="pay-copy-btn"
              onClick={() => {
                navigator.clipboard.writeText(UPI_ID);
                setMessage("UPI ID copied!");
                setIsError(false);
                setTimeout(() => setMessage(""), 2000);
              }}
            >
              Copy
            </button>
          </div>

          {/* Amount pill */}
          <div className="pay-amount-pill">
            Amount: <strong>{plan.price}</strong> — {plan.name} Plan
          </div>

          {/* App tip */}
          {showAppTip && (
            <div className="pay-tip">
              📸 <strong>Take a screenshot</strong> of the QR or <strong>note the UTR</strong> after payment to fill in Step 2!
            </div>
          )}

          {/* Open App buttons */}
          <div style={{ marginTop: "1.25rem" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: 800, color: "var(--muted)", marginBottom: "0.6rem", letterSpacing: "0.05em" }}>
              OPEN UPI APP
            </div>
            <div className="pay-app-grid">
              {UPI_APPS.map((app) => (
                <button
                  key={app.name}
                  className="pay-app-btn"
                  onClick={() => openUpiApp(app.scheme)}
                >
                  <span>{app.emoji}</span>
                  {app.name}
                </button>
              ))}
            </div>
          </div>

          <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "1rem", lineHeight: 1.5 }}>
            💡 After paying, come back here and enter the 12-digit UTR / Transaction ID to confirm your payment.
          </p>
        </div>

        {/* Right — UTR Submit */}
        <div className="pay-card pay-utr-card">
          <div className="pay-card-header">
            <h2>Submit UTR Number</h2>
            <p>After paying, enter the UTR / Transaction ID from your UPI app's payment receipt.</p>
          </div>

          <div className="pay-utr-steps">
            <div className="pay-utr-step">
              <span>1</span>
              <p>Open GPay / PhonePe / any UPI app and complete the payment of <strong>{plan.price}</strong>.</p>
            </div>
            <div className="pay-utr-step">
              <span>2</span>
              <p>Go to <strong>Payment History</strong> → Copy the <strong>12-digit UTR / Transaction ID</strong>.</p>
            </div>
            <div className="pay-utr-step">
              <span>3</span>
              <p>Paste it below and click <strong>Submit for Verification</strong>.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ marginTop: "1.5rem" }}>
            <label className="pay-label">UTR / Transaction ID</label>
            <input
              className="pay-input"
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="e.g. 426123456789"
              required
              minLength={6}
              maxLength={22}
              disabled={busy}
            />
            <p style={{ fontSize: "0.78rem", color: "var(--muted)", margin: "0.4rem 0 1.25rem" }}>
              Find this in your UPI app under Transactions / Payment History
            </p>

            {message && (
              <div style={{
                padding: "0.75rem 1rem",
                borderRadius: "10px",
                background: isError ? "rgba(239,68,68,0.08)" : "rgba(34,197,94,0.1)",
                color: isError ? "#d92d20" : "#16a36a",
                fontSize: "0.875rem",
                marginBottom: "1rem",
                fontWeight: 600,
              }}>
                {isError ? "✗" : "✓"} {message}
              </div>
            )}

            <button
              className="pay-submit-btn"
              type="submit"
              disabled={busy || !utr.trim()}
            >
              {busy ? "Submitting…" : "✓ Submit Payment for Verification"}
            </button>
          </form>

          <div className="pay-guarantee">
            <span>🔒</span>
            <p>Your payment is verified by admin within <strong>a few hours</strong>. You&apos;ll get instant access once approved.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <Suspense fallback={
      <div className="pay-page">
        <div style={{ textAlign: "center", padding: "6rem 0", color: "#667085" }}>Loading payment…</div>
      </div>
    }>
      <PaymentContent />
    </Suspense>
  );
}
