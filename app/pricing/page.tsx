import Link from "next/link";

const plans = [
  { key: "monthly", name: "Monthly", price: "₹99", period: "/ month", note: "Good for focused revision." },
  { key: "yearly", name: "Yearly", price: "₹499", period: "/ year", note: "Full-year access. Best value." },
];

export default function Pricing() {
  return (
    <div className="page">
      <div className="container narrow">
        <span className="eyebrow">STUDYVAULT PLANS</span>
        <h1>Choose your access.</h1>
        <p className="lead">Pay via UPI directly. Submit your UTR and admin will activate your account within a few hours.</p>
        <div className="pricing-grid">
          {plans.map((plan) => (
            <div className="price-card" key={plan.name}>
              <span className="eyebrow">{plan.name}</span>
              <div className="price">{plan.price}<small>{plan.period}</small></div>
              <p>{plan.note}</p>
              <ul><li>Important Questions</li><li>Question Papers</li><li>Chapter-wise access</li><li>Protected viewer</li></ul>
              <Link href={`/payment?plan=${plan.key}`} className="btn primary full">Choose {plan.name}</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}