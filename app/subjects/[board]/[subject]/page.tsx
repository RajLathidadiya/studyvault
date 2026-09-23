"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { getChapters, type Chapter } from "@/lib/content";

type CustomChapter = { id: string; board: "GSEB" | "CBSE"; subject: string; name: string };

type StoredQuestion = {
  id: string;
  board: "GSEB" | "CBSE";
  subject: string;
  chapter: string;
  type: "Important" | "Expected" | "Previous Year";
  text: string;
};

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export default function SubjectPage() {
  const params = useParams<{ board: string; subject: string }>();
  const board = (params.board || "gseb").toUpperCase();
  const subjectSlug = params.subject || "physics";
  const subjectName = subjectSlug.replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  const [stored, setStored] = useState<StoredQuestion[]>([]);
  const [customChapters, setCustomChapters] = useState<CustomChapter[]>([]);

  async function loadContent() {
    try {
      const [questionsRes, chaptersRes] = await Promise.all([
        fetch(`/api/questions?board=${encodeURIComponent(board)}&subject=${encodeURIComponent(subjectSlug)}`, { cache:"no-store" }),
        fetch(`/api/chapters?board=${encodeURIComponent(board)}&subject=${encodeURIComponent(subjectName)}`, { cache:"no-store" }),
      ]);
      const qData = await questionsRes.json();
      const cData = await chaptersRes.json();
      setStored(qData.questions ?? []);
      setCustomChapters((cData.chapters ?? []).map((c:any)=>({ id:c.slug, board:c.board, subject:c.subject, name:c.name })));
    } catch { setStored([]); setCustomChapters([]); }
  }

  useEffect(() => { loadContent(); }, [board, subjectSlug, subjectName]);

  const chapters = useMemo(() => {
    const base = getChapters(subjectSlug).map((chapter) => ({ ...chapter, adminCount: 0 }));
    const custom = customChapters.filter((c) => c.board === board && slugify(c.subject) === subjectSlug);
    for (const c of custom) {
      const id = slugify(c.name);
      if (!base.some((chapter) => chapter.id === id)) base.push({ id, name: c.name, questions: [], adminCount: 0 });
    }
    for (const q of stored) {
      const id = slugify(q.chapter);
      const existing = base.find((c) => c.id === id);
      if (existing) existing.adminCount += 1;
      else base.push({ id, name: q.chapter, questions: [], adminCount: 1 });
    }
    return base;
  }, [board, customChapters, stored, subjectSlug]);

  return (
    <div className="page">
      <div className="container">
        <Link className="back" href={`/${board.toLowerCase()}`}>← {board} Science</Link>
        <span className="eyebrow">{board} • CLASS 12 • {subjectName.toUpperCase()}</span>
        <h1>{subjectName}</h1>
        <p className="lead">Choose a chapter to open important questions and board-focused preparation.</p>

        <div className="subject-grid">
          {chapters.map((chapter, index) => {
            const count = chapter.questions.length + chapter.adminCount;
            return (
              <Link href={`/questions/${board.toLowerCase()}/${subjectSlug}/${chapter.id}`} className="subject-card" key={chapter.id}>
                <span className="number">{String(index + 1).padStart(2, "0")}</span>
                <h2>{chapter.name}</h2>
                <p>{count ? `${count} questions available` : "Questions coming soon"}</p>
                <span className="card-arrow">Open chapter →</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
