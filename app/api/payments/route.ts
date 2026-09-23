import { NextResponse } from "next/server";
import { getAuthUser, requireAdmin, supabaseRest } from "@/lib/supabase-rest";

// POST /api/payments — student submits UTR after UPI payment
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: "You must be logged in to submit a payment." }, { status: 401 });

    const body = await request.json();
    const { plan, amount, utr } = body;

    if (!plan || !utr) return NextResponse.json({ error: "Plan and UTR are required." }, { status: 400 });
    if (typeof utr !== "string" || utr.trim().length < 6) {
      return NextResponse.json({ error: "Please enter a valid UTR / transaction ID." }, { status: 400 });
    }

    const rows = await supabaseRest(
      "/rest/v1/payments",
      {
        method: "POST",
        headers: { Prefer: "return=representation" },
        body: JSON.stringify({
          user_id: user.id,
          plan: String(plan),
          amount: Number(amount) || 0,
          utr: utr.trim(),
          status: "pending",
        }),
      },
      true
    );

    return NextResponse.json({ ok: true, payment: Array.isArray(rows) ? rows[0] : rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not submit payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// GET /api/payments — admin fetches all payments with user info
export async function GET() {
  try {
    await requireAdmin();
    const payments = await supabaseRest(
      "/rest/v1/payments?select=id,user_id,plan,amount,utr,status,created_at,reviewed_at,profiles(full_name,id)&order=created_at.desc",
      {},
      true
    );
    return NextResponse.json({ payments: Array.isArray(payments) ? payments : [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not fetch payments.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

// PATCH /api/payments — admin approves or rejects a payment
export async function PATCH(request: Request) {
  try {
    const { user } = await requireAdmin();
    const body = await request.json();
    const { id, status } = body;

    if (!id || !["approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Payment id and valid status (approved/rejected) are required." }, { status: 400 });
    }

    // Fetch the payment to get user_id and plan
    const payments = await supabaseRest(
      `/rest/v1/payments?id=eq.${encodeURIComponent(id)}&select=id,user_id,plan`,
      {},
      true
    ) as Array<{ id: string; user_id: string; plan: string }>;

    if (!payments || payments.length === 0) {
      return NextResponse.json({ error: "Payment not found." }, { status: 404 });
    }
    const payment = payments[0];

    // Update payment status
    await supabaseRest(
      `/rest/v1/payments?id=eq.${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify({ status, reviewed_by: user.id, reviewed_at: new Date().toISOString() }),
      },
      true
    );

    // If approved, create a subscription
    if (status === "approved") {
      const isYearly = payment.plan.toLowerCase().includes("yearly");
      const endsAt = new Date();
      endsAt.setFullYear(endsAt.getFullYear() + (isYearly ? 1 : 0));
      if (!isYearly) endsAt.setMonth(endsAt.getMonth() + 1);

      await supabaseRest(
        "/rest/v1/subscriptions",
        {
          method: "POST",
          headers: { Prefer: "return=minimal" },
          body: JSON.stringify({
            user_id: payment.user_id,
            plan: payment.plan,
            status: "active",
            starts_at: new Date().toISOString(),
            ends_at: endsAt.toISOString(),
          }),
        },
        true
      );
    }

    return NextResponse.json({ ok: true, status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not update payment.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
