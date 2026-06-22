import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

let _stripe = null;
export function stripe() {
  if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2024-06-20" });
  return _stripe;
}
let _admin = null;
export function admin() {
  if (!_admin) _admin = createClient(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE || "", { auth: { autoRefreshToken: false, persistSession: false } });
  return _admin;
}
export const siteUrl = () => process.env.NEXT_PUBLIC_APP_URL || "https://whatsmoney.vercel.app";
export const TRIAL_DAYS = Number(process.env.TRIAL_DAYS || 3);
export const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "contato@estevamsouza.com.br").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);

export async function getUser(req) {
  const auth = req.headers.authorization || req.headers.Authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
  if (!token) return null;
  const { data, error } = await admin().auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}
export async function requireAdmin(req) {
  const user = await getUser(req);
  if (!user) return { user: null, status: 401 };
  if (!ADMIN_EMAILS.includes((user.email || "").toLowerCase())) return { user: null, status: 403 };
  return { user, status: 200 };
}
export function clientIp(req) { return (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.headers["x-real-ip"] || "desconhecido"; }
export function readJson(req) {
  return new Promise((resolve) => {
    if (req.body && typeof req.body === "object") return resolve(req.body);
    let raw = ""; req.on("data", (c) => (raw += c)); req.on("end", () => { try { resolve(JSON.parse(raw || "{}")); } catch { resolve({}); } });
  });
}
