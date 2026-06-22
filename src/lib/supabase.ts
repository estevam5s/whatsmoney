import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL as string;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anon, {
  auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true },
});

export const ADMIN_EMAILS = ((import.meta.env.VITE_ADMIN_EMAILS as string) || 'contato@estevamsouza.com.br')
  .split(',').map((s) => s.trim().toLowerCase());
export const isAdminEmail = (email?: string | null) => !!email && ADMIN_EMAILS.includes(email.toLowerCase());

export const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(v) || 0);
export const brl0 = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(Number(v) || 0);
export const fmtDate = (d?: string | null) => (d ? new Date(d).toLocaleDateString('pt-BR') : '—');
export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(' ');
