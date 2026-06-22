import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, ArrowLeftRight, Bell, Target, CreditCard, Settings, ShieldCheck, Globe, LogOut, Menu, X, Sparkles, ArrowUpRight } from 'lucide-react';
import Logo from './Logo';
import { useAuth } from '../contexts/AuthContext';
import { supabase, isAdminEmail, cx } from '../lib/supabase';

type NavItem = { to: string; icon: typeof LayoutDashboard; label: string; end?: boolean; admin?: boolean };
const NAV: NavItem[] = [
  { to: '/app', icon: LayoutDashboard, label: 'Visão geral', end: true },
  { to: '/app/transacoes', icon: ArrowLeftRight, label: 'Transações' },
  { to: '/app/lembretes', icon: Bell, label: 'Lembretes' },
  { to: '/app/metas', icon: Target, label: 'Metas' },
  { to: '/app/billing', icon: CreditCard, label: 'Meu plano' },
  { to: '/app/conta', icon: Settings, label: 'Conta' },
];

function TrialBanner() {
  const [sub, setSub] = useState<any>(null);
  const { user } = useAuth();
  useEffect(() => { if (!user) return; supabase.from('subscriptions').select('status,trial_end,stripe_subscription_id').eq('user_id', user.id).maybeSingle().then(({ data }) => setSub(data)); }, [user]);
  if (!sub || sub.status !== 'trialing' || sub.stripe_subscription_id) return null;
  const left = sub.trial_end ? Math.max(0, Math.ceil((new Date(sub.trial_end).getTime() - Date.now()) / 86400000)) : null;
  return (
    <Link to="/app/billing" className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3">
      <span className="flex items-center gap-2 text-sm text-brand-800"><Sparkles className="w-4 h-4" /> {left === 0 ? 'Seu teste termina hoje.' : `Você tem ${left} dia(s) grátis restante(s).`} Assine para continuar.</span>
      <span className="text-sm font-semibold text-brand-700 inline-flex items-center gap-1 shrink-0">Ver planos <ArrowUpRight className="w-4 h-4" /></span>
    </Link>
  );
}

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const admin = isAdminEmail(user?.email);
  const items: NavItem[] = [...NAV, ...(admin ? [{ to: '/app/admin', icon: ShieldCheck, label: 'Painel Admin', admin: true }] : [])];
  const initial = (user?.user_metadata?.full_name || user?.email || 'U').charAt(0).toUpperCase();

  const Side = (
    <div className="flex flex-col h-full">
      <div className="px-5 py-5"><Link to="/"><Logo /></Link></div>
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {items.map((it) => {
          const active = it.end ? loc.pathname === it.to : loc.pathname.startsWith(it.to);
          return (
            <Link key={it.to} to={it.to} onClick={() => setOpen(false)}
              className={cx('flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition', active ? ((it as any).admin ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700') : 'text-ink-600 hover:bg-ink-50')}>
              <it.icon className="w-[18px] h-[18px]" /> {it.label}
            </Link>
          );
        })}
      </nav>
      <div className="p-3 border-t border-ink-100 space-y-1">
        <a href="/" className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm text-ink-600 hover:bg-ink-50"><Globe className="w-[18px] h-[18px]" /> Voltar ao site</a>
        <div className="flex items-center gap-2.5 px-2 py-2">
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 text-white text-sm font-semibold grid place-items-center">{initial}</span>
          <div className="min-w-0 flex-1"><p className="text-sm font-medium truncate">{user?.user_metadata?.full_name || 'Você'}</p><p className="text-[11px] text-ink-400 truncate">{user?.email}</p></div>
          <button onClick={async () => { await signOut(); navigate('/'); }} className="p-1.5 text-ink-400 hover:text-red-500" title="Sair"><LogOut className="w-[18px] h-[18px]" /></button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-ink-50 flex">
      <button onClick={() => setOpen(!open)} className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white border border-ink-200 shadow-sm">{open ? <X /> : <Menu />}</button>
      <aside className="hidden lg:block w-64 shrink-0 bg-white border-r border-ink-200">{Side}</aside>
      {open && (<><div className="lg:hidden fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} /><aside className="lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-white">{Side}</aside></>)}
      <main className="flex-1 min-w-0">
        <div className="container-page py-6 lg:py-8 pt-16 lg:pt-8">
          <TrialBanner />
          <Outlet />
        </div>
      </main>
    </div>
  );
}
