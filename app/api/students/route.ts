import { NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET() {
  try {
    // Fetch all profiles with their subscription status
    const [profilesRes, subsRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,full_name,role,created_at&order=created_at.desc`, {
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
      }),
      fetch(`${SUPABASE_URL}/rest/v1/subscriptions?select=user_id,plan,status,ends_at`, {
        headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
      }),
    ]);

    const profiles = await profilesRes.json();
    const subs = await subsRes.json();

    // Also get emails from auth.users via admin API
    const usersRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    });
    const usersData = await usersRes.json();
    const emailMap: Record<string, string> = {};
    (usersData.users || []).forEach((u: any) => { emailMap[u.id] = u.email; });

    const subMap: Record<string, any> = {};
    (Array.isArray(subs) ? subs : []).forEach((s: any) => { subMap[s.user_id] = s; });

    const students = (Array.isArray(profiles) ? profiles : [])
      .filter((p: any) => p.role === "student")
      .map((p: any) => ({
        id: p.id,
        full_name: p.full_name || "—",
        email: emailMap[p.id] || "—",
        role: p.role,
        created_at: p.created_at,
        subscription: subMap[p.id] ?? null,
      }));

    return NextResponse.json({ students, total: students.length });
  } catch {
    return NextResponse.json({ error: "Could not load students." }, { status: 500 });
  }
}
