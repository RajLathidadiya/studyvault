import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function headers() {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
  };
}

// GET — list all uploaded papers
export async function GET() {
  try {
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/list/papers`, {
      method: "POST",
      headers: { ...headers(), "Content-Type": "application/json" },
      body: JSON.stringify({ limit: 100, offset: 0, sortBy: { column: "created_at", order: "desc" } }),
    });
    const data = await r.json();
    if (!r.ok) return NextResponse.json({ error: "Could not list papers." }, { status: 500 });
    const papers = (data || []).map((f: any) => ({
      name: f.name,
      size: f.metadata?.size ?? 0,
      created_at: f.created_at,
      url: `${SUPABASE_URL}/storage/v1/object/public/papers/${f.name}`,
    }));
    return NextResponse.json({ papers });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}

// POST — upload a PDF
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const label = (formData.get("label") as string) || file?.name || "paper.pdf";
    if (!file) return NextResponse.json({ error: "No file provided." }, { status: 400 });
    if (!file.type.includes("pdf")) return NextResponse.json({ error: "Only PDF files allowed." }, { status: 400 });
    if (file.size > 50 * 1024 * 1024) return NextResponse.json({ error: "File too large (max 50MB)." }, { status: 400 });

    const safeName = label.replace(/[^a-zA-Z0-9.\-_ ]/g, "").replace(/\s+/g, "_");
    const fileName = `${Date.now()}_${safeName}${safeName.endsWith(".pdf") ? "" : ".pdf"}`;

    const bytes = await file.arrayBuffer();
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/papers/${fileName}`, {
      method: "POST",
      headers: {
        ...headers(),
        "Content-Type": "application/pdf",
        "x-upsert": "true",
      },
      body: bytes,
    });
    const data = await r.json();
    if (!r.ok) return NextResponse.json({ error: data.error || "Upload failed." }, { status: 500 });

    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/papers/${fileName}`;
    return NextResponse.json({ ok: true, url: publicUrl, name: fileName });
  } catch {
    return NextResponse.json({ error: "Upload failed." }, { status: 500 });
  }
}

// DELETE — remove a paper
export async function DELETE(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: "No file name." }, { status: 400 });
    const r = await fetch(`${SUPABASE_URL}/storage/v1/object/papers/${name}`, {
      method: "DELETE",
      headers: headers(),
    });
    if (!r.ok) return NextResponse.json({ error: "Could not delete file." }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed." }, { status: 500 });
  }
}
