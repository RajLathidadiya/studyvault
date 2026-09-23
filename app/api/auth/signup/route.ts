import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: Request) {
  try {
    const { email, password, fullName } = await request.json();
    if (!email || !password) return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    if (String(password).length < 6) return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });

    // Use admin API to create user with email pre-confirmed (no email verification needed)
    const createRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
      body: JSON.stringify({
        email: String(email).trim(),
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName || "" },
      }),
    });

    const createData = await createRes.json();

    if (!createRes.ok) {
      const msg = createData.msg || createData.message || createData.error_description || "Could not create account.";
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    // Now sign in to get tokens
    const signInRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: ANON_KEY,
        Authorization: `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ email: String(email).trim(), password }),
    });

    const signInData = await signInRes.json();

    if (signInData.access_token) {
      const response = NextResponse.json({ ok: true, signedIn: true });
      response.cookies.set("sv_access_token", signInData.access_token, {
        httpOnly: true, sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/", maxAge: signInData.expires_in || 3600,
      });
      if (signInData.refresh_token) {
        response.cookies.set("sv_refresh_token", signInData.refresh_token, {
          httpOnly: true, sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/", maxAge: 60 * 60 * 24 * 30,
        });
      }
      return response;
    }

    return NextResponse.json({ ok: true, signedIn: false, message: "Account created! Please sign in." });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create account." }, { status: 400 });
  }
}
