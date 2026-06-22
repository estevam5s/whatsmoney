import { supabase } from '../lib/supabase';

export type Tx = { id: string; type: string; amount: number; description: string | null; tx_date: string; category_id: string | null; account_id: string | null; source: string };
export type Category = { id: string; name: string; kind: string; color: string };

export async function listTransactions(filters?: { from?: string; to?: string; type?: string; categoryId?: string }) {
  let q = supabase.from('transactions').select('*').order('tx_date', { ascending: false }).order('created_at', { ascending: false });
  if (filters?.from) q = q.gte('tx_date', filters.from);
  if (filters?.to) q = q.lte('tx_date', filters.to);
  if (filters?.type && filters.type !== 'all') q = q.eq('type', filters.type);
  if (filters?.categoryId && filters.categoryId !== 'all') q = q.eq('category_id', filters.categoryId);
  const { data } = await q;
  return (data as Tx[]) || [];
}
export async function createTransaction(t: Partial<Tx>) {
  const { error } = await supabase.from('transactions').insert(t as any);
  return { error: error?.message };
}
export async function deleteTransaction(id: string) { await supabase.from('transactions').delete().eq('id', id); }

export async function listCategories() { const { data } = await supabase.from('categories').select('*').order('name'); return (data as Category[]) || []; }
export async function listAccounts() { const { data } = await supabase.from('accounts').select('*').order('created_at'); return data || []; }

export async function listReminders() { const { data } = await supabase.from('reminders').select('*').order('due_at', { ascending: true }); return data || []; }
export async function createReminder(r: any) { const { error } = await supabase.from('reminders').insert(r); return { error: error?.message }; }
export async function toggleReminder(id: string, done: boolean) { await supabase.from('reminders').update({ done }).eq('id', id); }
export async function deleteReminder(id: string) { await supabase.from('reminders').delete().eq('id', id); }

export async function listGoals() { const { data } = await supabase.from('goals').select('*').order('created_at', { ascending: false }); return data || []; }
export async function createGoal(g: any) { const { error } = await supabase.from('goals').insert(g); return { error: error?.message }; }
export async function updateGoal(id: string, patch: any) { await supabase.from('goals').update(patch).eq('id', id); }
export async function deleteGoal(id: string) { await supabase.from('goals').delete().eq('id', id); }

// Resumo do mês corrente.
export function summarize(tx: Tx[]) {
  const income = tx.filter((t) => t.type === 'income').reduce((a, t) => a + Number(t.amount), 0);
  const expense = tx.filter((t) => t.type === 'expense').reduce((a, t) => a + Number(t.amount), 0);
  return { income, expense, balance: income - expense, count: tx.length };
}
