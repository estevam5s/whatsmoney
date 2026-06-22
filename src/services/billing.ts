import { supabase } from '../lib/supabase';

export type Plan = {
  slug: string; name: string; description: string; billing_type: string;
  monthly_price: number; yearly_price: number; highlight: boolean; cta: string;
  features: string[]; limits: Record<string, any>; sort_order: number;
};
export const isUnlimited = (v: any) => v === -1 || v === null || v === undefined;

export async function getPlans(): Promise<Plan[]> {
  const { data } = await supabase.from('plans').select('*').order('sort_order');
  return (data as any) || [];
}
export async function getMySubscription() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const res = await fetch('/api/subscription', { headers: { Authorization: `Bearer ${session.access_token}` } });
  return res.ok ? res.json() : null;
}
export async function startCheckout(planSlug: string, cycle: 'monthly' | 'yearly' = 'monthly') {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) { window.location.href = '/entrar?mode=signup'; return; }
  const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ plan_slug: planSlug, cycle }) });
  const d = await res.json();
  if (d.url) window.location.href = d.url; else alert(d.error || 'Não foi possível iniciar o checkout.');
}
export async function openPortal() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  const res = await fetch('/api/portal', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } });
  const d = await res.json();
  if (d.url) window.location.href = d.url; else alert(d.error || 'Sem assinatura ativa.');
}
