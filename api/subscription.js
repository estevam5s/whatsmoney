import { admin, getUser, ADMIN_EMAILS } from "./_lib/server.js";

export default async function handler(req, res) {
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: "unauthorized" });
  const [{ data: sub }, { data: plans }] = await Promise.all([
    admin().from("subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
    admin().from("plans").select("*").order("sort_order"),
  ]);
  const isAdmin = ADMIN_EMAILS.includes((user.email || "").toLowerCase());
  const slug = isAdmin ? "enterprise" : (sub?.plan_slug || "free");
  const plan = (plans || []).find((p) => p.slug === slug) || null;
  res.status(200).json({
    is_admin: isAdmin,
    subscription: isAdmin ? { plan_slug: "enterprise", status: "active", billing_cycle: "yearly" } : (sub || { plan_slug: "free", status: "trialing", billing_cycle: "trial" }),
    plan, plans: plans || [],
  });
}
