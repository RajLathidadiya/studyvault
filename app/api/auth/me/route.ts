import { NextResponse } from "next/server";
import { getAuthUser, getProfile } from "@/lib/supabase-rest";
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ authenticated: false });
  const profile = await getProfile(user.id);
  return NextResponse.json({ authenticated: true, user: { id:user.id, email:user.email }, profile });
}
