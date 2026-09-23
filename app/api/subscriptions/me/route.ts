import { NextResponse } from "next/server";
import { getAuthUser, supabaseRest } from "@/lib/supabase-rest";

// GET /api/subscriptions/me — returns current user's active subscription (if any)
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ active: false, subscription: null });

    const now = new Date().toISOString();
    const rows = await supabaseRest(
      `/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(user.id)}&status=eq.active&ends_at=gte.${encodeURIComponent(now)}&order=ends_at.desc&limit=1`,
      {},
      true
    ) as Array<{ id: string; plan: string; status: string; starts_at: string; ends_at: string }>;

    if (!rows || rows.length === 0) {
      return NextResponse.json({ active: false, subscription: null });
    }

    return NextResponse.json({ active: true, subscription: rows[0] });
  } catch {
    // If Supabase not configured or error — treat as no subscription
    return NextResponse.json({ active: false, subscription: null });
  }
}
