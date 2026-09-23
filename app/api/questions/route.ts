import { NextResponse } from "next/server";
import { getAuthUser, requireAdmin, supabaseRest } from "@/lib/supabase-rest";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const board = url.searchParams.get("board");
    const subject = url.searchParams.get("subject");
    const chapter = url.searchParams.get("chapter");
    let query = "/rest/v1/questions?select=id,board,subject,subject_slug,chapter,chapter_slug,type,text,published,created_at&published=eq.true&order=created_at.asc";
    if (board) query += `&board=eq.${encodeURIComponent(board)}`;
    if (subject) query += `&subject_slug=eq.${encodeURIComponent(subject)}`;
    if (chapter) query += `&chapter_slug=eq.${encodeURIComponent(chapter)}`;
    const questions = await supabaseRest(query);
    return NextResponse.json({ mode: "database", questions });
  } catch (error) {
    return NextResponse.json({ mode: "unavailable", questions: [], error: error instanceof Error ? error.message : "Database unavailable" }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const { user } = await requireAdmin();
    const body = await request.json();
    if (!body.board || !body.subject || !body.chapter || !body.type || !body.text) return NextResponse.json({ error: "Board, subject, chapter, type and question are required." }, { status: 400 });
    const slugify = (value:string) => value.toLowerCase().trim().replace(/&/g,"and").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
    const rows = await supabaseRest("/rest/v1/questions", { method:"POST", headers:{ Prefer:"return=representation" }, body:JSON.stringify({ board:body.board, subject:body.subject, subject_slug:slugify(body.subject), chapter:body.chapter, chapter_slug:slugify(body.chapter), type:body.type, text:body.text.trim(), published:true, created_by:user.id }) }, true);
    return NextResponse.json({ ok:true, question:Array.isArray(rows) ? rows[0] : rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not publish question.";
    return NextResponse.json({ error: message }, { status: message === "Unauthorized" || message === "Admin access required" ? 403 : 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const u = new URL(request.url);
    const id = u.searchParams.get("id");
    const all = u.searchParams.get("all");
    if (all === "1") { await supabaseRest("/rest/v1/questions?id=not.is.null", { method:"DELETE" }, true); return NextResponse.json({ ok:true }); }
    if (!id) return NextResponse.json({ error:"Question id is required." }, { status:400 });
    await supabaseRest(`/rest/v1/questions?id=eq.${encodeURIComponent(id)}`, { method:"DELETE" }, true);
    return NextResponse.json({ ok:true });
  } catch (error) { return NextResponse.json({ error:error instanceof Error ? error.message : "Could not delete question." }, { status:403 }); }
}
