import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabase-rest";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    const data = await supabaseRest("/auth/v1/token?grant_type=password", { method: "POST", body: JSON.stringify({ email: String(email).trim(), password }) });
    const response = NextResponse.json({ ok: true, user: { email: data.user?.email } });
    response.cookies.set("sv_access_token", data.access_token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: data.expires_in || 3600 });
    response.cookies.set("sv_refresh_token", data.refresh_token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
    return response;
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Invalid email or password." }, { status: 401 });
  }
}
