import { admin, stripe, requireAdmin, readJson, clientIp } from "./_lib/server.js";
export const config = { api: { bodyParser: false } };
const num = (v) => Number(v) || 0;
async function log({ actor_email, action, target, level = "info", meta, req }) { try { await admin().from("audit_logs").insert({ actor_email, action, target: target || null, level, ip: req ? clientIp(req) : null, meta: meta || null }); } catch { /**/ } }
function tally(arr, key) { const m = {}; arr.forEach((r) => { const k = r[key] || "—"; m[k] = (m[k] || 0) + 1; }); return Object.entries(m).map(([name, n]) => ({ name, n })).sort((a, b) => b.n - a.n); }

export default async function handler(req, res) {
  const mod = new URL(req.url, "http://x").searchParams.get("module") || "overview";
  const gate = await requireAdmin(req);
  if (!gate.user) return res.status(gate.status).json({ error: "unauthorized" });
  const me = gate.user.email;
  const body = req.method === "POST" ? await readJson(req) : {};
  try {
    switch (mod) {
      case "overview": return await overview(res);
      case "users": return req.method === "POST" ? await usersPost(res, body, me, req) : await users(res);
      case "finance": return req.method === "POST" ? await finPost(res, body, me, req) : await fin(res);
      case "promotions": return req.method === "POST" ? await promoPost(res, body, me, req) : await promo(res);
      case "logs": return await logs(res);
      case "health": return await health(res);
      default: return res.status(400).json({ error: "module inválido" });
    }
  } catch (e) { return res.status(500).json({ error: e.message }); }
}

async function overview(res) {
  const [{ data: profiles }, { data: subs }, { data: plans }, { count: tx }, { data: fe }] = await Promise.all([
    admin().from("profiles").select("id,email,full_name,created_at").order("created_at", { ascending: false }),
    admin().from("subscriptions").select("user_id,plan_slug,status,stripe_subscription_id"),
    admin().from("plans").select("slug,name,monthly_price"),
    admin().from("transactions").select("id", { count: "exact", head: true }),
    admin().from("finance_entries").select("type,amount"),
  ]);
  const price = {}; (plans || []).forEach((p) => (price[p.slug] = num(p.monthly_price)));
  let mrr = 0, paying = 0, trialing = 0, canceled = 0;
  (subs || []).forEach((s) => { if (s.status === "active" && s.stripe_subscription_id) { mrr += price[s.plan_slug] || 0; paying++; } if (s.status === "trialing") trialing++; if (s.status === "canceled") canceled++; });
  const usersN = (profiles || []).length, conv = usersN ? (paying / usersN) * 100 : 0, churn = (paying + canceled) ? (canceled / (paying + canceled)) * 100 : 0, arpu = paying ? mrr / paying : 0;
  const sum = (t) => (fe || []).filter((e) => e.type === t).reduce((a, e) => a + num(e.amount), 0);
  return res.status(200).json({
    totals: { users: usersN, paying, trialing, canceled, mrr, arr: mrr * 12, arpu: Math.round(arpu * 100) / 100, ltv: churn > 0 ? Math.round(arpu / (churn / 100)) : Math.round(arpu * 24), conversao: Math.round(conv * 10) / 10, churn: Math.round(churn * 10) / 10, transactions: tx || 0, lucro: sum("receita") - sum("despesa") - sum("custo") },
    byPlan: (plans || []).map((p) => ({ name: p.name, n: (subs || []).filter((s) => s.plan_slug === p.slug).length })),
    recent: (profiles || []).slice(0, 10),
  });
}
async function users(res) {
  const [{ data: profiles }, { data: subs }, { data: plans }] = await Promise.all([
    admin().from("profiles").select("*").order("created_at", { ascending: false }),
    admin().from("subscriptions").select("*"), admin().from("plans").select("slug,name"),
  ]);
  const by = {}; (subs || []).forEach((s) => (by[s.user_id] = s));
  return res.status(200).json({ users: (profiles || []).map((p) => ({ ...p, sub: by[p.id] || null })), plans: plans || [] });
}
async function usersPost(res, body, me, req) {
  if (body.action === "set_plan" && body.userId && body.plan_slug) {
    await admin().from("subscriptions").update({ plan_slug: body.plan_slug, status: "active" }).eq("user_id", body.userId);
    const { data: ex } = await admin().from("subscriptions").select("user_id").eq("user_id", body.userId).maybeSingle();
    if (!ex) await admin().from("subscriptions").insert({ user_id: body.userId, plan_slug: body.plan_slug, status: "active", billing_cycle: "manual" });
    await log({ actor_email: me, action: "trocar_plano", target: body.userId, meta: { plan: body.plan_slug }, req });
    return res.status(200).json({ ok: true });
  }
  if (body.action === "delete_user" && body.userId) {
    await admin().from("subscriptions").delete().eq("user_id", body.userId);
    await admin().from("profiles").delete().eq("id", body.userId);
    await admin().auth.admin.deleteUser(body.userId).catch(() => {});
    await log({ actor_email: me, action: "excluir_usuario", target: body.userId, level: "warn", req });
    return res.status(200).json({ ok: true });
  }
  return res.status(400).json({ error: "invalid_action" });
}
async function fin(res) {
  const { data: entries } = await admin().from("finance_entries").select("*").order("entry_date", { ascending: false }).limit(500);
  const sum = (t) => (entries || []).filter((e) => e.type === t).reduce((a, e) => a + num(e.amount), 0);
  const { data: subs } = await admin().from("subscriptions").select("plan_slug,status,stripe_subscription_id");
  const { data: plans } = await admin().from("plans").select("slug,monthly_price");
  const price = {}; (plans || []).forEach((p) => (price[p.slug] = num(p.monthly_price)));
  const mrr = (subs || []).filter((s) => s.status === "active" && s.stripe_subscription_id).reduce((a, s) => a + (price[s.plan_slug] || 0), 0);
  return res.status(200).json({ entries: entries || [], summary: { receita: sum("receita"), despesa: sum("despesa"), investimento: sum("investimento"), custo: sum("custo"), lucro: sum("receita") - sum("despesa") - sum("custo"), mrr, arr: mrr * 12 } });
}
async function finPost(res, body, me, req) {
  if (body.action === "add") { if (!["receita", "despesa", "investimento", "custo"].includes(body.type)) return res.status(400).json({ error: "tipo inválido" }); await admin().from("finance_entries").insert({ type: body.type, category: body.category || null, description: body.description || null, amount: num(body.amount), entry_date: body.entry_date || new Date().toISOString().slice(0, 10) }); await log({ actor_email: me, action: "fin_add", target: body.type, req }); return res.status(200).json({ ok: true }); }
  if (body.action === "delete" && body.id) { await admin().from("finance_entries").delete().eq("id", body.id); return res.status(200).json({ ok: true }); }
  return res.status(400).json({ error: "invalid_action" });
}
async function promo(res) { const { data } = await admin().from("promotions").select("*").order("created_at", { ascending: false }); return res.status(200).json({ promotions: data || [] }); }
async function promoPost(res, body, me, req) {
  if (body.action === "create") {
    const { code, name, discount_type, discount_value, expires_at } = body;
    if (!code || !discount_value) return res.status(400).json({ error: "código e valor obrigatórios" });
    const cp = { name: name || code, duration: "once" };
    if (discount_type === "percent") cp.percent_off = Number(discount_value); else { cp.amount_off = Math.round(Number(discount_value) * 100); cp.currency = "brl"; }
    const coupon = await stripe().coupons.create(cp);
    const pp = { coupon: coupon.id, code: String(code).toUpperCase() }; if (expires_at) pp.expires_at = Math.floor(new Date(expires_at).getTime() / 1000);
    const pc = await stripe().promotionCodes.create(pp);
    await admin().from("promotions").insert({ code: String(code).toUpperCase(), name: name || code, discount_type, discount_value: Number(discount_value), stripe_coupon_id: coupon.id, stripe_promo_id: pc.id, active: true, expires_at: expires_at || null });
    await log({ actor_email: me, action: "promo_create", target: code, req });
    return res.status(200).json({ ok: true });
  }
  if (body.action === "toggle" && body.id) { const { data: r } = await admin().from("promotions").select("*").eq("id", body.id).single(); const n = !r.active; if (r.stripe_promo_id) await stripe().promotionCodes.update(r.stripe_promo_id, { active: n }).catch(() => {}); await admin().from("promotions").update({ active: n }).eq("id", body.id); return res.status(200).json({ ok: true }); }
  if (body.action === "delete" && body.id) { const { data: r } = await admin().from("promotions").select("*").eq("id", body.id).single(); if (r?.stripe_promo_id) await stripe().promotionCodes.update(r.stripe_promo_id, { active: false }).catch(() => {}); if (r?.stripe_coupon_id) await stripe().coupons.del(r.stripe_coupon_id).catch(() => {}); await admin().from("promotions").delete().eq("id", body.id); return res.status(200).json({ ok: true }); }
  return res.status(400).json({ error: "invalid_action" });
}
async function logs(res) { const { data } = await admin().from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200); return res.status(200).json({ logs: data || [], counts: { total: (data || []).length, warn: (data || []).filter((l) => l.level === "warn").length, error: (data || []).filter((l) => l.level === "error").length } }); }
async function timed(fn) { const t = Date.now(); try { await fn(); return { status: "ok", latency: Date.now() - t }; } catch (e) { return { status: "down", latency: Date.now() - t, error: e.message }; } }
async function health(res) {
  const [db, au, st] = await Promise.all([
    timed(async () => { const r = await admin().from("plans").select("slug").limit(1); if (r.error) throw new Error(r.error.message); }),
    timed(async () => { const r = await admin().auth.admin.listUsers({ page: 1, perPage: 1 }); if (r.error) throw new Error(r.error.message); }),
    timed(async () => { await stripe().balance.retrieve(); }),
  ]);
  const services = [{ key: "db", label: "Banco (Supabase)", ...db }, { key: "auth", label: "Auth (Supabase)", ...au }, { key: "stripe", label: "Pagamentos (Stripe)", ...st }];
  return res.status(200).json({ overall: services.every((s) => s.status === "ok") ? "operacional" : "degradado", services });
}
