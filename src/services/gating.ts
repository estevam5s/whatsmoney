import { supabase } from '../lib/supabase';
import { isUnlimited } from './billing';

async function planLimits() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { limits: {} as Record<string, any>, planName: 'Teste grátis' };
  const { data: sub } = await supabase.from('subscriptions').select('plan_slug').eq('user_id', user.id).maybeSingle();
  const slug = (sub as any)?.plan_slug || 'free';
  const { data: plan } = await supabase.from('plans').select('name,limits').eq('slug', slug).maybeSingle();
  return { limits: ((plan as any)?.limits) || {}, planName: (plan as any)?.name || 'Teste grátis' };
}

/** Pode registrar mais uma transação? (limite do plano) */
export async function canAddTransaction(): Promise<{ ok: boolean; message?: string }> {
  const { limits, planName } = await planLimits();
  const limit = limits.transacoes;
  if (isUnlimited(limit)) return { ok: true };
  const { count } = await supabase.from('transactions').select('id', { count: 'exact', head: true });
  if ((count || 0) >= limit) return { ok: false, message: `O ${planName} permite ${limit} transações. Faça upgrade para registrar ilimitado.` };
  return { ok: true };
}

/** Pode criar mais uma meta? */
export async function canAddGoal(): Promise<{ ok: boolean; message?: string }> {
  const { limits, planName } = await planLimits();
  const limit = limits.metas;
  if (isUnlimited(limit)) return { ok: true };
  const { count } = await supabase.from('goals').select('id', { count: 'exact', head: true });
  if ((count || 0) >= limit) return { ok: false, message: `O ${planName} permite ${limit} meta(s). Faça upgrade para metas ilimitadas.` };
  return { ok: true };
}
