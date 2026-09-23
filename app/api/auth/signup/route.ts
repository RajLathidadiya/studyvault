import { NextResponse } from "next/server";
import { supabaseRest } from "@/lib/supabase-rest";

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();
    if (!email || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    if (String(password).length < 6) return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    const data = await supabaseRest("/auth/v1/signup", { method: "POST", body: JSON.stringify({ email: String(email).trim(), password, data: { full_name: fullName || "" } }) });
    if (data.access_token) {
      const response = NextResponse.json({ ok: true, signedIn: true });
      response.cookies.set("sv_access_token", data.access_token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: data.expires_in || 3600 });
      if (data.refresh_token) response.cookies.set("sv_refresh_token", data.refresh_token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 30 });
      return response;
    }
    return NextResponse.json({ ok: true, signedIn: false, message: "Account created. Check your email if confirmation is enabled, then sign in." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create account." }, { status: 400 });
  }
}
