import { createContext, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type Ctx = {
  user: User | null; session: Session | null; loading: boolean;
  signIn: (e: string, p: string) => Promise<{ error?: string }>;
  signUp: (p: { email: string; password: string; fullName?: string; whatsapp?: string }) => Promise<{ error?: string; needsConfirm?: boolean }>;
  signOut: () => Promise<void>;
};
const AuthCtx = createContext<Ctx>({} as Ctx);
export const useAuth = () => useContext(AuthCtx);

function tr(m = '') {
  const x = m.toLowerCase();
  if (x.includes('invalid login')) return 'E-mail ou senha incorretos.';
  if (x.includes('already registered') || x.includes('already been registered')) return 'Este e-mail já está cadastrado.';
  if (x.includes('weak') || (x.includes('password') && x.includes('6'))) return 'A senha deve ter ao menos 6 caracteres.';
  return m || 'Não foi possível concluir.';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setUser(data.session?.user ?? null); setLoading(false); });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => { setSession(s); setUser(s?.user ?? null); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
    return error ? { error: tr(error.message) } : {};
  };
  const signUp = async ({ email, password, fullName, whatsapp }: any) => {
    const { data, error } = await supabase.auth.signUp({ email: email.trim().toLowerCase(), password, options: { data: { full_name: fullName || '', whatsapp: whatsapp || '' } } });
    if (error) return { error: tr(error.message) };
    return { needsConfirm: !data.session };
  };
  const signOut = async () => { await supabase.auth.signOut(); };

  return <AuthCtx.Provider value={{ user, session, loading, signIn, signUp, signOut }}>{children}</AuthCtx.Provider>;
}
