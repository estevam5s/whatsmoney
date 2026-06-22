import { stripe, admin, getUser, siteUrl, readJson } from "./_lib/server.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  const { plan_slug, cycle = "monthly" } = await readJson(req);
  const { data: plan } = await admin().from("plans").select("*").eq("slug", plan_slug).maybeSingle();
  if (!plan || plan.billing_type === "free") return res.status(400).json({ error: "plano inválido" });
  const price = cycle === "yearly" ? plan.stripe_price_yearly : plan.stripe_price_monthly;
  if (!price) return res.status(400).json({ error: "preço não configurado" });

  const { data: sub } = await admin().from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  let customer = sub?.stripe_customer_id;
  if (!customer) {
    const c = await stripe().customers.create({ email: user.email, metadata: { user_id: user.id } });
    customer = c.id;
    await admin().from("subscriptions").upsert({ user_id: user.id, stripe_customer_id: customer }, { onConflict: "user_id" });
  }
  const session = await stripe().checkout.sessions.create({
    mode: "subscription", customer, line_items: [{ price, quantity: 1 }], allow_promotion_codes: true,
    subscription_data: { metadata: { user_id: user.id, plan_slug } },
    success_url: `${siteUrl()}/app/billing?success=1`,
    cancel_url: `${siteUrl()}/precos?canceled=1`,
    metadata: { user_id: user.id, plan_slug, cycle },
  });
  res.status(200).json({ url: session.url });
}
