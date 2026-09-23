"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  if (pathname.startsWith("/admin")) return null;

  const close = () => setOpen(false);
  return (
    <header className="header">
      <div className="container nav">
        <Link href="/" className="logo" onClick={close}><span>Study</span>Vault</Link>
        <nav>
          <Link href="/gseb">GSEB</Link>
          <Link href="/cbse">CBSE</Link>
          <Link href="/pricing">Pricing</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/login" className="login-link">Login</Link>
        </nav>
        <button className="mobile-nav-btn" onClick={() => setOpen(!open)} aria-label="Open menu">{open ? "×" : "☰"}</button>
      </div>
      {open && <div className="mobile-menu">
        <Link href="/gseb" onClick={close}>GSEB</Link>
        <Link href="/cbse" onClick={close}>CBSE</Link>
        <Link href="/pricing" onClick={close}>Pricing</Link>
        <Link href="/dashboard" onClick={close}>Dashboard</Link>
        <Link href="/login" onClick={close}>Login</Link>
      </div>}
    </header>
  );
}
