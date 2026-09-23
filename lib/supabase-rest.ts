import { cookies } from "next/headers";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function isSupabaseConfigured() {
  return Boolean(url && anonKey && serviceKey);
}

function headers(key: string, extra: Record<string,string> = {}) {
  return { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", ...extra };
}

export async function supabaseRest(path: string, init: RequestInit = {}, useService = false): Promise<any> {
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured.");
  const key = useService ? serviceKey : anonKey;
  if (!key) throw new Error(useService ? "SUPABASE_SERVICE_ROLE_KEY is not configured." : "NEXT_PUBLIC_SUPABASE_ANON_KEY is not configured.");
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: { ...headers(key, init.headers as Record<string,string> | undefined), ...(init.headers || {}) },
    cache: "no-store",
  });
  const text = await response.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (!response.ok) {
    const message = typeof data === "object" && data && "message" in data ? String((data as {message:string}).message) : `Supabase request failed (${response.status})`;
    throw new Error(message);
  }
  return data;
}

export async function getAccessToken() {
  const store = await cookies();
  return store.get("sv_access_token")?.value || null;
}

export async function getAuthUser() {
  const token = await getAccessToken();
  if (!token || !url || !anonKey) return null;
  try {
    const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anonKey, Authorization: `Bearer ${token}` }, cache: "no-store" });
    if (!response.ok) return null;
    return await response.json() as { id:string; email?:string };
  } catch { return null; }
}

export async function getProfile(userId: string) {
  const rows = await supabaseRest(`/rest/v1/profiles?id=eq.${encodeURIComponent(userId)}&select=id,full_name,role`, {}, true) as Array<{id:string;full_name:string|null;role:"student"|"admin"}>;
  return rows[0] || null;
}

export async function requireAdmin() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");
  const profile = await getProfile(user.id);
  if (!profile || profile.role !== "admin") throw new Error("Admin access required");
  return { user, profile };
}
