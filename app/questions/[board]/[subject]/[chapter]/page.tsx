"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getChapter } from "@/lib/content";

type Question = {
  id: string;
  question: string;
  type: "Important" | "Expected" | "Previous Year";
};

type StoredQuestion = {
  id: string;
  board: "GSEB" | "CBSE";
  subject: string;
  chapter: string;
  type: Question["type"];
  text: string;
};

type AccessState = "loading" | "no-auth" | "no-sub" | "granted";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function QuestionsPage() {
  const params = useParams<{ board: string; subject: string; chapter: string }>();
  const board = (params.board || "gseb").toUpperCase();
  const subject = params.subject || "physics";
  const chapterId = params.chapter || "current-electricity";
  const [stored, setStored] = useState<StoredQuestion[]>([]);
  const [access, setAccess] = useState<AccessState>("loading");

  const currentUrl = `/questions/${params.board}/${subject}/${chapterId}`;

  useEffect(() => {
    async function checkAccessAndLoad() {
      try {
        // Step 1: check authentication
        const authRes = await fetch("/api/auth/me", { cache: "no-store" });
        const authData = await authRes.json();

        if (!authData.authenticated) {
          setAccess("no-auth");
          return;
        }

        // Step 2: check active subscription
        const subRes = await fetch("/api/subscriptions/me", { cache: "no-store" });
        const subData = await subRes.json();

        if (!subData.active) {
          setAccess("no-sub");
          return;
        }

        // Step 3: user has access — load questions
        setAccess("granted");
        const qRes = await fetch(
          `/api/questions?board=${encodeURIComponent(board)}&subject=${encodeURIComponent(subject)}&chapter=${encodeURIComponent(chapterId)}`,
          { cache: "no-store" }
        );
        const qData = await qRes.json();
        setStored(qData.questions ?? []);
      } catch {
        setAccess("no-auth");
      }
    }

    checkAccessAndLoad();
  }, [board, subject, chapterId]);

  const chapter = getChapter(subject, chapterId);
  const chapterName = chapter?.name || chapterId.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

  const questions = useMemo<Question[]>(() => {
    const defaults = chapter?.questions ?? [];
    const dbQuestions = stored.map((q) => ({ id: q.id, question: q.text, type: q.type }));
    const ids = new Set(dbQuestions.map((q) => q.id));
    return [...dbQuestions, ...defaults.filter((q) => !ids.has(q.id))];
  }, [chapter, stored]);

  // Loading state
  if (access === "loading") {
    return (
      <div className="page">
        <div className="container narrow" style={{ textAlign: "center", padding: "4rem 0" }}>
          <p>Checking access…</p>
        </div>
      </div>
    );
  }

  // Not logged in
  if (access === "no-auth") {
    return (
      <div className="page">
        <div className="container narrow">
          <Link className="back" href={`/subjects/${board.toLowerCase()}/${subject}`}>
            ← Back to {subject.replace(/-/g, " ")}
          </Link>
          <div style={{ textAlign: "center", padding: "3rem 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔐</div>
            <h1 style={{ marginBottom: "0.5rem" }}>{chapterName}</h1>
            <p className="lead" style={{ marginBottom: "2rem" }}>
              This content is protected. Please sign in to your StudyVault account to continue.
            </p>
            <Link
              href={`/login?next=${encodeURIComponent(currentUrl)}`}
              className="btn primary"
              style={{ marginRight: "1rem" }}
            >
              Sign In
            </Link>
            <Link href="/login?mode=signup" className="btn secondary">
              Create Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Logged in but no active subscription
  if (access === "no-sub") {
    return (
      <div className="page">
        <div className="container narrow">
          <Link className="back" href={`/subjects/${board.toLowerCase()}/${subject}`}>
            ← Back to {subject.replace(/-/g, " ")}
          </Link>
          <div style={{ textAlign: "center", padding: "3rem 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📦</div>
            <h1 style={{ marginBottom: "0.5rem" }}>{chapterName}</h1>
            <p className="lead" style={{ marginBottom: "0.5rem" }}>
              You need an active StudyVault subscription to access this content.
            </p>
            <p style={{ opacity: 0.7, marginBottom: "2rem", fontSize: "0.95rem" }}>
              Choose a plan — Monthly at ₹99 or Yearly at ₹499.
            </p>
            <Link href="/pricing" className="btn primary" style={{ marginRight: "1rem" }}>
              View Plans
            </Link>
            <Link href="/dashboard" className="btn secondary">
              My Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Access granted — show questions
  return (
    <div className="page">
      <div className="container narrow">
        <Link className="back" href={`/subjects/${board.toLowerCase()}/${subject}`}>
          ← Back to {subject.replace(/-/g, " ")}
        </Link>
        <span className="eyebrow">{board} • PROTECTED VIEWER</span>
        <h1>{chapterName}</h1>
        <p className="lead">Questions published from the StudyVault content manager appear here.</p>

        <div className="protected-banner">🔒 StudyVault Protected Content <span>Class 12 • {subject}</span></div>

        <div className="question-list">
          {questions.length === 0 && <div className="empty-state">No questions published for this chapter yet.</div>}
          {questions.map((q, index) => (
            <article className="question-card" key={q.id}>
              <div className="question-top"><span>Q{index + 1}</span><strong>{q.type}</strong></div>
              <h3>{q.question}</h3>
              <small>STUDYVAULT • LICENSED CONTENT</small>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
