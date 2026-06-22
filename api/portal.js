import { stripe, admin, getUser, siteUrl } from "./_lib/server.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  const { data: sub } = await admin().from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
  if (!sub?.stripe_customer_id) return res.status(400).json({ error: "sem assinatura ativa" });
  const session = await stripe().billingPortal.sessions.create({ customer: sub.stripe_customer_id, return_url: `${siteUrl()}/app/billing` });
  res.status(200).json({ url: session.url });
}
