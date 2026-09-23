"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { getChapters } from "@/lib/content";

type CustomChapter = { id: string; board: "GSEB" | "CBSE"; subject: string; name: string };

type Question = {
  id: string;
  board: "GSEB" | "CBSE";
  subject: string;
  chapter: string;
  type: "Important" | "Expected" | "Previous Year";
  text: string;
};

type Payment = {
  id: string;
  user_id: string;
  plan: string;
  amount: number;
  utr: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
  profiles: { full_name: string | null; id: string } | null;
};

export default function AdminPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [board, setBoard] = useState<Question["board"]>("GSEB");
  const [subject, setSubject] = useState("Physics");
  const [chapter, setChapter] = useState("Current Electricity");
  const [customChapters, setCustomChapters] = useState<CustomChapter[]>([]);
  const [newChapter, setNewChapter] = useState("");
  const [chapterMessage, setChapterMessage] = useState("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoaded, setPaymentsLoaded] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState("");

  const chapterOptions = useMemo(() => {
    const base = getChapters(subject).map((item) => ({ id: item.id, name: item.name }));
    const custom = customChapters
      .filter((item) => item.board === board && item.subject.toLowerCase() === subject.toLowerCase())
      .map((item) => ({ id: item.id, name: item.name }));
    const seen = new Set<string>();
    return [...base, ...custom].filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [board, subject, customChapters]);
  const [type, setType] = useState<Question["type"]>("Important");
  const [text, setText] = useState("");
  const [active, setActive] = useState("Questions");
  const [message, setMessage] = useState("");
  const [authChecked, setAuthChecked] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  async function loadQuestions() {
    try {
      const response = await fetch("/api/questions", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error || "Database unavailable."); setQuestions([]); }
      else setQuestions(data.questions ?? []);
    } catch { setQuestions([]); setMessage("Could not reach the database."); }
    setLoaded(true);
  }

  async function loadCustomChapters() {
    try {
      const response = await fetch("/api/chapters", { cache: "no-store" });
      const data = await response.json();
      if (response.ok) setCustomChapters((data.chapters ?? []).map((item: any) => ({ id: item.slug, board: item.board, subject: item.subject, name: item.name })));
    } catch {}
  }

  async function loadPayments() {
    try {
      const response = await fetch("/api/payments", { cache: "no-store" });
      const data = await response.json();
      if (response.ok) setPayments(data.payments ?? []);
    } catch {}
    setPaymentsLoaded(true);
  }

  async function reviewPayment(id: string, status: "approved" | "rejected") {
    try {
      const response = await fetch("/api/payments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status }),
      });
      const data = await response.json();
      if (!response.ok) { setPaymentMessage(data.error || "Could not update payment."); return; }
      setPaymentMessage(status === "approved" ? "Payment approved — subscription activated!" : "Payment rejected.");
      await loadPayments();
      setTimeout(() => setPaymentMessage(""), 3000);
    } catch { setPaymentMessage("Could not reach the server."); }
  }

  useEffect(() => {
    fetch("/api/auth/me", { cache:"no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!data.authenticated || data.profile?.role !== "admin") { window.location.href = "/admin/login"; return; }
        setAuthChecked(true);
        loadQuestions();
        loadCustomChapters();
        loadPayments();
      })
      .catch(() => { window.location.href = "/admin/login"; });
    const load = () => loadQuestions();
    window.addEventListener("storage", load);
    window.addEventListener("studyvault-content-updated", load);
    return () => { window.removeEventListener("storage", load); window.removeEventListener("studyvault-content-updated", load); };
  }, []);

  async function addQuestion(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    const payload = { board, subject, chapter, type, text: text.trim() };
    try {
      const response = await fetch("/api/questions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error || "Could not publish question."); return; }
      setText(""); setMessage("Published to the database."); await loadQuestions(); setTimeout(() => setMessage(""), 2200);
    } catch { setMessage("Could not reach the database."); }
  }

  const counts = useMemo(() => ({
    total: questions.length,
    gseb: questions.filter((q) => q.board === "GSEB").length,
    cbse: questions.filter((q) => q.board === "CBSE").length,
  }), [questions]);

  async function removeQuestion(id: string) {
    try {
      const response = await fetch(`/api/questions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) { setMessage(data.error || "Could not delete question."); return; }
      await loadQuestions();
    } catch { setMessage("Could not reach the database."); }
  }

  async function clearAll() {
    if (!confirm("Delete all published questions from the database?")) return;
    const response = await fetch("/api/questions?all=1", { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) { setMessage(data.error || "Could not clear questions."); return; }
    await loadQuestions();
  }

  return (
    <div className={`admin-shell ${mobileMenu ? "admin-menu-open" : ""}`}>
      <div className="admin-mobile-bar">
        <button className="admin-menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Toggle admin menu">☰</button>
        <strong>StudyVault <span>ADMIN</span></strong>
        <a href="/">↗</a>
      </div>
      <div className="admin-sidebar-backdrop" onClick={() => setMobileMenu(false)} />
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <div className="admin-logo">SV</div>
          <div>
            <strong>StudyVault</strong>
            <span>ADMIN CONSOLE</span>
          </div>
        </div>

        <div className="admin-nav-label">CONTENT</div>
        {["Questions", "Question Papers", "Subjects"].map((item) => (
          <button
            key={item}
            className={`admin-nav-item ${active === item ? "active" : ""}`}
            onClick={() => { setActive(item); setMobileMenu(false); }}
          >
            <span>{item === "Questions" ? "▤" : item === "Question Papers" ? "▥" : "◈"}</span>
            {item}
          </button>
        ))}

        <div className="admin-nav-label">MANAGEMENT</div>
        {["Payments", "Students"].map((item) => (
          <button
            key={item}
            className={`admin-nav-item ${active === item ? "active" : ""}`}
            onClick={() => { setActive(item); setMobileMenu(false); }}
          >
            <span>{item === "Payments" ? "₹" : "◎"}</span>
            {item}
          </button>
        ))}

        <div className="admin-sidebar-bottom">
          <a href="/">← View website</a>
          <div className="admin-user">
            <div className="admin-avatar">A</div>
            <div><strong>Administrator</strong><span>Admin access</span></div>
          </div>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-breadcrumb">ADMIN / {active.toUpperCase()}</span>
            <h1>{active}</h1>
          </div>
          <div className="admin-top-actions"><a className="admin-site-link" href="/">Open StudyVault ↗</a><button className="admin-logout" onClick={() => { fetch("/api/auth/logout",{method:"POST"}).finally(()=>{window.location.href="/admin/login"}); }}>Sign out</button></div>
        </header>

        {!authChecked || !loaded ? (
          <div className="admin-loading">Loading content...</div>
        ) : active === "Questions" ? (
          <>
            <section className="admin-stats">
              <div><span>Total Questions</span><strong>{counts.total}</strong></div>
              <div><span>GSEB</span><strong>{counts.gseb}</strong></div>
              <div><span>CBSE</span><strong>{counts.cbse}</strong></div>
              <div><span>Access</span><strong className="live">LIVE</strong></div>
            </section>

            <div className="admin-grid">
              <form className="admin-panel" onSubmit={addQuestion}>
                <div className="panel-heading">
                  <div><span className="panel-icon">+</span><div><h2>Add question</h2><p>Publish new study content</p></div></div>
                </div>

                <div className="admin-fields">
                  <label>Board
                    <select value={board} onChange={(e) => {
                        const nextBoard = e.target.value as Question["board"];
                        setBoard(nextBoard);
                        const base = getChapters(subject);
                        const custom = customChapters.filter((item) => item.board === nextBoard && item.subject.toLowerCase() === subject.toLowerCase());
                        setChapter(base[0]?.name ?? custom[0]?.name ?? "");
                      }}>
                      <option>GSEB</option><option>CBSE</option>
                    </select>
                  </label>

                  <label>Subject
                    <select
                      value={subject}
                      onChange={(e) => {
                        const nextSubject = e.target.value;
                        setSubject(nextSubject);
                        const nextChapters = getChapters(nextSubject);
                        const custom = customChapters.filter((item) => item.board === board && item.subject.toLowerCase() === nextSubject.toLowerCase());
                        setChapter(nextChapters[0]?.name ?? custom[0]?.name ?? "");
                      }}
                    >
                      <option>Physics</option><option>Chemistry</option><option>Mathematics</option><option>Biology</option>
                    </select>
                  </label>

                  <label>Chapter
                    <div className="chapter-select-row">
                      <select value={chapter} onChange={(e) => setChapter(e.target.value)} disabled={chapterOptions.length === 0}>
                        {chapterOptions.length === 0 ? (
                          <option value="">No chapters available</option>
                        ) : (
                          chapterOptions.map((item) => (
                            <option key={item.id} value={item.name}>{item.name}</option>
                          ))
                        )}
                      </select>
                      <button type="button" className="add-chapter-mini" onClick={() => setActive("Subjects")}>+ Add</button>
                    </div>
                  </label>

                  <label>Question type
                    <select value={type} onChange={(e) => setType(e.target.value as Question["type"])}>
                      <option>Important</option><option>Expected</option><option>Previous Year</option>
                    </select>
                  </label>

                  <label className="full-field">Question
                    <textarea value={text} onChange={(e) => setText(e.target.value)} rows={7} placeholder="Write the question exactly as students should see it..." required />
                  </label>
                </div>

                <div className="panel-footer">
                  <span>Select a subject to see its chapters.</span>
                  <button className="admin-primary" type="submit">Publish question</button>
                </div>
                {message && <div className="publish-success">✓ {message}</div>}
              </form>

              <section className="admin-panel">
                <div className="panel-heading list-heading">
                  <div><h2>Published questions</h2><p>Manage your current question library</p></div>
                  <button className="clear-btn" onClick={clearAll}>Clear all</button>
                </div>

                <div className="published-list">
                  {questions.length === 0 && <div className="admin-empty">No questions published yet.</div>}
                  {questions.map((q, index) => (
                    <article className="published-item" key={q.id}>
                      <div className="published-top">
                        <span className="q-number">Q{String(index + 1).padStart(2, "0")}</span>
                        <span className="content-path">{q.board} / {q.subject} / {q.chapter}</span>
                        <span className="admin-tag">{q.type}</span>
                      </div>
                      <p>{q.text}</p>
                      <button className="remove-btn" onClick={() => removeQuestion(q.id)}>Remove</button>
                    </article>
                  ))}
                </div>
              </section>
            </div>
          </>
        ) : active === "Subjects" ? (
          <section className="admin-panel subjects-manager">
            <div className="panel-heading">
              <div><h2>Manage chapters</h2><p>Add your own chapters to the subject dropdown. They will also appear on the student website.</p></div>
            </div>
            <form className="chapter-add-form" onSubmit={(e) => {
              e.preventDefault();
              const name = newChapter.trim();
              if (!name) return;
              const id = name.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
              const exists = chapterOptions.some((item) => item.id === id);
              if (exists) { setChapterMessage("This chapter already exists for the selected subject."); return; }
              fetch("/api/chapters", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({board,subject,name}) })
                .then(async (response) => { const data=await response.json(); if(!response.ok) throw new Error(data.error || "Could not add chapter."); setNewChapter(""); setChapter(name); setChapterMessage("Chapter added to the database."); await loadCustomChapters(); setTimeout(()=>setChapterMessage(""),2200); })
                .catch((error)=>setChapterMessage(error.message));
            }}>
              <label>Board<select value={board} onChange={(e) => setBoard(e.target.value as Question["board"])}><option>GSEB</option><option>CBSE</option></select></label>
              <label>Subject<select value={subject} onChange={(e) => setSubject(e.target.value)}><option>Physics</option><option>Chemistry</option><option>Mathematics</option><option>Biology</option></select></label>
              <label className="chapter-name-field">New chapter name<input value={newChapter} onChange={(e) => setNewChapter(e.target.value)} placeholder="e.g. Ray Optics and Optical Instruments" required /></label>
              <button className="admin-primary" type="submit">+ Add chapter</button>
            </form>
            {chapterMessage && <div className="publish-success">✓ {chapterMessage}</div>}
            <div className="chapter-manager-list">
              <h3>Available chapters — {board} / {subject}</h3>
              {chapterOptions.map((item, index) => {
                const custom = customChapters.some((c) => c.id === item.id && c.board === board && c.subject.toLowerCase() === subject.toLowerCase());
                return <div className="chapter-manager-row" key={item.id}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.name}</strong>{custom ? <button type="button" className="remove-btn" onClick={async () => { const chapterRow = customChapters.find((c) => c.id === item.id && c.board === board && c.subject.toLowerCase() === subject.toLowerCase()); if(!chapterRow)return; const response=await fetch(`/api/chapters?slug=${encodeURIComponent(chapterRow.id)}&board=${encodeURIComponent(board)}&subject=${encodeURIComponent(subject)}`,{method:"DELETE"}); const data=await response.json(); if(response.ok) await loadCustomChapters(); else setChapterMessage(data.error || "Could not remove chapter."); }}>Remove</button> : <em>Default</em>}</div>;
              })}
            </div>
          </section>
        ) : active === "Payments" ? (
          <section className="admin-panel">
            <div className="panel-heading list-heading">
              <div><h2>Payment Submissions</h2><p>Review and approve student UPI payment requests</p></div>
              <button className="admin-primary" onClick={loadPayments}>Refresh</button>
            </div>
            {paymentMessage && <div className="publish-success">✓ {paymentMessage}</div>}
            {!paymentsLoaded ? (
              <div className="admin-loading">Loading payments…</div>
            ) : payments.length === 0 ? (
              <div className="admin-empty">No payment submissions yet.</div>
            ) : (
              <div className="published-list">
                {payments.map((p) => (
                  <article className="published-item" key={p.id}>
                    <div className="published-top">
                      <span className="q-number">{p.plan}</span>
                      <span className="content-path">UTR: {p.utr}</span>
                      <span className={`admin-tag ${p.status === "approved" ? "live" : p.status === "rejected" ? "" : ""}`}
                        style={{
                          background: p.status === "approved" ? "rgba(34,197,94,0.15)" : p.status === "rejected" ? "rgba(239,68,68,0.15)" : "rgba(234,179,8,0.15)",
                          color: p.status === "approved" ? "#22c55e" : p.status === "rejected" ? "#ef4444" : "#ca8a04",
                        }}
                      >
                        {p.status.toUpperCase()}
                      </span>
                    </div>
                    <p style={{ margin: "0.25rem 0", fontSize: "0.9rem", opacity: 0.8 }}>
                      Amount: ₹{p.amount} &nbsp;•&nbsp; Submitted: {new Date(p.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                    {p.status === "pending" && (
                      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.75rem" }}>
                        <button
                          className="admin-primary"
                          style={{ fontSize: "0.8rem", padding: "0.4rem 1rem" }}
                          onClick={() => reviewPayment(p.id, "approved")}
                        >
                          ✓ Approve
                        </button>
                        <button
                          className="remove-btn"
                          onClick={() => reviewPayment(p.id, "rejected")}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}
                    {p.status !== "pending" && p.reviewed_at && (
                      <p style={{ fontSize: "0.8rem", opacity: 0.5, marginTop: "0.25rem" }}>
                        Reviewed: {new Date(p.reviewed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section className="coming-panel">
            <span className="coming-icon">◌</span>
            <h2>{active} module</h2>
            <p>This module is reserved for the next development phase. The navigation and admin shell are ready.</p>
          </section>
        )}
      </main>
    </div>
  );
}