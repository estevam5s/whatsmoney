import { stripe, admin } from "./_lib/server.js";
export const config = { api: { bodyParser: false } };

function rawBody(req) { return new Promise((r) => { const c = []; req.on("data", (x) => c.push(x)); req.on("end", () => r(Buffer.concat(c))); }); }
async function priceToSlug(priceId) {
  if (!priceId) return null;
  const { data } = await admin().from("plans").select("slug").or(`stripe_price_monthly.eq.${priceId},stripe_price_yearly.eq.${priceId}`).maybeSingle();
  return data?.slug || null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  let event;
  try { event = stripe().webhooks.constructEvent(await rawBody(req), req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET || ""); }
  catch (e) { return res.status(400).json({ error: `assinatura inválida: ${e.message}` }); }

  const { error: dup } = await admin().from("payment_events").insert({ id: event.id, type: event.type });
  if (dup) return res.status(200).json({ received: true, duplicate: true });

  try {
    const obj = event.data.object;
    if (event.type === "checkout.session.completed" || event.type.startsWith("customer.subscription.")) {
      const { data: row } = await admin().from("subscriptions").select("user_id").eq("stripe_customer_id", obj.customer).maybeSingle();
      if (row) {
        let s = obj;
        if (event.type === "checkout.session.completed" && obj.subscription) s = await stripe().subscriptions.retrieve(obj.subscription);
        const priceId = s.items?.data?.[0]?.price?.id;
        const slug = (await priceToSlug(priceId)) || s.metadata?.plan_slug;
        const interval = s.items?.data?.[0]?.price?.recurring?.interval;
        const patch = { status: s.status || "active", stripe_subscription_id: s.id, billing_cycle: interval === "year" ? "yearly" : "monthly",
          current_period_end: s.current_period_end ? new Date(s.current_period_end * 1000).toISOString() : null,
          trial_end: s.trial_end ? new Date(s.trial_end * 1000).toISOString() : null };
        if (slug) patch.plan_slug = slug;
        if (event.type === "customer.subscription.deleted") { patch.status = "canceled"; patch.plan_slug = "free"; }
        await admin().from("subscriptions").update(patch).eq("user_id", row.user_id);
      }
    }
    res.status(200).json({ received: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
}
