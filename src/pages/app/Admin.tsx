import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Wallet, Ticket, ScrollText, Activity, Loader2, ShieldAlert, Plus, Trash2, Power, RefreshCw, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { supabase, isAdminEmail, brl, cx } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

async function token() { return (await supabase.auth.getSession()).data.session?.access_token; }
async function aGet(m: string) { const t = await token(); const r = await fetch(`/api/admin?module=${m}`, { headers: { Authorization: `Bearer ${t}` }, cache: 'no-store' }); if (!r.ok) throw new Error(String(r.status)); return r.json(); }
async function aPost(m: string, p: any) { const t = await token(); const r = await fetch(`/api/admin?module=${m}`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` }, body: JSON.stringify(p) }); return r.json(); }

const TABS = [['overview', 'Visão geral', LayoutDashboard], ['users', 'Usuários', Users], ['finance', 'Financeiro', Wallet], ['promotions', 'Promoções', Ticket], ['logs', 'Logs', ScrollText], ['health', 'Monitoramento', Activity]] as const;

export default function Admin() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('overview');
  const [cache, setCache] = useState<Record<string, any>>({});
  const [busy, setBusy] = useState(false);

  const load = async (m: string, f = false) => { if (cache[m] && !f) return; try { const r = await aGet(m); setCache((c) => ({ ...c, [m]: r })); } catch { /**/ } };
  useEffect(() => { if (isAdminEmail(user?.email)) load(tab, tab === 'health'); /* eslint-disable-next-line */ }, [tab, user]);
  const post = async (m: string, p: any, rl = m) => { setBusy(true); const d = await aPost(m, p); setBusy(false); if (d.ok) { await load(rl, true); } else alert(d.error || 'Erro'); return d; };

  if (loading) return <div className="h-64 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  if (!isAdminEmail(user?.email)) return <div className="h-[60vh] grid place-items-center"><div className="text-center"><ShieldAlert className="w-10 h-10 text-red-500 mx-auto mb-3" /><p className="font-semibold">Acesso restrito ao administrador</p><button onClick={() => navigate('/app')} className="btn-ghost mt-3">Voltar</button></div></div>;

  const d = cache[tab];
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between"><div><h1 className="font-display text-2xl font-bold">Painel Admin</h1><p className="text-sm text-ink-500">Gestão do WhatsMoney.</p></div><Link to="/app" className="btn-ghost py-2"><ArrowLeft className="w-4 h-4" /> Painel</Link></div>
      <div className="flex flex-wrap gap-1 border-b border-ink-200">
        {TABS.map(([id, label, Icon]) => <button key={id} onClick={() => setTab(id)} className={cx('flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium', tab === id ? 'border-b-2 border-brand-600 text-brand-600' : 'text-ink-500 hover:text-ink-900')}><Icon className="w-4 h-4" /> {label}</button>)}
      </div>
      {!d && tab !== 'health' ? <div className="h-40 grid place-items-center text-ink-400"><Loader2 className="w-6 h-6 animate-spin" /></div> : (<>
        {tab === 'overview' && d && <Overview d={d} />}
        {tab === 'users' && d && <UsersTab d={d} post={post} />}
        {tab === 'finance' && d && <Finance d={d} post={post} busy={busy} />}
        {tab === 'promotions' && d && <Promotions d={d} post={post} busy={busy} />}
        {tab === 'logs' && d && <Logs d={d} reload={() => load('logs', true)} />}
        {tab === 'health' && <Health d={d} reload={() => load('health', true)} />}
      </>)}
    </div>
  );
}

const Stat = ({ label, value, color = '' }: any) => <div className="card p-4"><p className={`text-2xl font-bold ${color}`}>{value}</p><p className="text-[11px] uppercase tracking-wide text-ink-400">{label}</p></div>;

function Overview({ d }: any) {
  const t = d.totals;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <Stat label="Usuários" value={t.users} /><Stat label="Pagantes" value={t.paying} color="text-emerald-600" /><Stat label="Em teste" value={t.trialing} color="text-brand-600" />
        <Stat label="MRR" value={brl(t.mrr)} color="text-emerald-600" /><Stat label="ARR" value={brl(t.arr)} color="text-emerald-600" /><Stat label="ARPU" value={brl(t.arpu)} />
        <Stat label="LTV" value={brl(t.ltv)} /><Stat label="Conversão" value={`${t.conversao}%`} /><Stat label="Churn" value={`${t.churn}%`} color="text-amber-600" />
        <Stat label="Transações" value={t.transactions} /><Stat label="Cancelados" value={t.canceled} color="text-red-500" /><Stat label="Lucro" value={brl(t.lucro)} color={t.lucro >= 0 ? 'text-emerald-600' : 'text-red-500'} />
      </div>
      <div className="card p-5"><h3 className="font-semibold mb-3">Assinantes por plano</h3><ResponsiveContainer width="100%" height={240}><BarChart data={d.byPlan}><XAxis dataKey="name" tick={{ fontSize: 12 }} /><YAxis allowDecimals={false} tick={{ fontSize: 12 }} /><Tooltip /><Bar dataKey="n" radius={[6, 6, 0, 0]} fill="#10b981" /></BarChart></ResponsiveContainer></div>
    </div>
  );
}
function UsersTab({ d, post }: any) {
  const slugs = (d.plans || []).map((p: any) => p.slug);
  return (
    <div className="card overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-xs uppercase text-ink-400"><tr><th className="p-3">Usuário</th><th>Plano</th><th>Status</th><th></th></tr></thead>
      <tbody>{(d.users || []).map((u: any) => (<tr key={u.id} className="border-t border-ink-100"><td className="p-3"><div className="font-medium">{u.full_name || '—'}</div><div className="text-xs text-ink-400">{u.email}</div></td><td><select value={u.sub?.plan_slug || 'free'} onChange={(e) => post('users', { action: 'set_plan', userId: u.id, plan_slug: e.target.value }, 'users')} className="rounded border border-ink-200 bg-transparent px-2 py-1 text-xs">{slugs.map((s: string) => <option key={s} value={s}>{s}</option>)}</select></td><td><span className={u.sub?.status === 'active' || u.sub?.status === 'trialing' ? 'text-emerald-600' : 'text-ink-400'}>{u.sub?.status || '—'}</span></td><td className="pr-3 text-right"><button onClick={() => { if (confirm(`Excluir ${u.email}?`)) post('users', { action: 'delete_user', userId: u.id }, 'users'); }} className="p-1.5 text-ink-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td></tr>))}
        {(d.users || []).length === 0 && <tr><td colSpan={4} className="p-6 text-center text-ink-400">Nenhum usuário.</td></tr>}</tbody></table></div>
  );
}
function Finance({ d, post, busy }: any) {
  const [f, setF] = useState({ type: 'receita', category: '', description: '', amount: '', entry_date: '' });
  const s = d.summary;
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3"><Stat label="Receita" value={brl(s.receita)} color="text-emerald-600" /><Stat label="Despesas" value={brl(s.despesa)} color="text-red-500" /><Stat label="Custos" value={brl(s.custo)} color="text-amber-600" /><Stat label="Investim." value={brl(s.investimento)} color="text-brand-600" /><Stat label="Lucro" value={brl(s.lucro)} color={s.lucro >= 0 ? 'text-emerald-600' : 'text-red-500'} /><Stat label="MRR" value={brl(s.mrr)} color="text-emerald-600" /></div>
      <div className="card p-5"><h3 className="font-semibold mb-3">Lançar movimentação</h3><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><select className="input" value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}><option value="receita">Receita</option><option value="despesa">Despesa</option><option value="custo">Custo</option><option value="investimento">Investimento</option></select><input className="input" placeholder="Categoria" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} /><input className="input" placeholder="Descrição" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /><input className="input" type="number" placeholder="Valor" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /><input className="input" type="date" value={f.entry_date} onChange={(e) => setF({ ...f, entry_date: e.target.value })} /></div><button className="btn-primary mt-3 py-2" disabled={busy || !f.amount} onClick={() => post('finance', { action: 'add', ...f }).then(() => setF({ ...f, category: '', description: '', amount: '' }))}><Plus className="w-4 h-4" /> Lançar</button></div>
      <div className="card overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-xs uppercase text-ink-400"><tr><th className="p-3">Data</th><th>Tipo</th><th>Categoria</th><th className="text-right">Valor</th><th></th></tr></thead><tbody>{(d.entries || []).map((e: any) => (<tr key={e.id} className="border-t border-ink-100"><td className="p-3 text-ink-500">{e.entry_date}</td><td>{e.type}</td><td className="text-ink-500">{e.category || '—'}</td><td className={`text-right font-medium ${e.type === 'receita' ? 'text-emerald-600' : 'text-red-500'}`}>{brl(e.amount)}</td><td className="pr-3 text-right"><button onClick={() => post('finance', { action: 'delete', id: e.id })} className="p-1.5 text-ink-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></td></tr>))}{(d.entries || []).length === 0 && <tr><td colSpan={5} className="p-6 text-center text-ink-400">Nenhuma movimentação.</td></tr>}</tbody></table></div>
    </div>
  );
}
function Promotions({ d, post, busy }: any) {
  const [f, setF] = useState({ code: '', name: '', discount_type: 'percent', discount_value: '', expires_at: '' });
  return (
    <div className="space-y-5">
      <div className="card p-5"><h3 className="font-semibold mb-1">Novo cupom (Stripe)</h3><p className="text-xs text-ink-400 mb-3">Vale automaticamente no checkout.</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><input className="input" placeholder="CÓDIGO" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value.toUpperCase() })} /><input className="input" placeholder="Nome" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /><select className="input" value={f.discount_type} onChange={(e) => setF({ ...f, discount_type: e.target.value })}><option value="percent">% percentual</option><option value="amount">R$ fixo</option></select><input className="input" type="number" placeholder="Valor" value={f.discount_value} onChange={(e) => setF({ ...f, discount_value: e.target.value })} /><input className="input" type="date" value={f.expires_at} onChange={(e) => setF({ ...f, expires_at: e.target.value })} /></div><button className="btn-primary mt-3 py-2" disabled={busy || !f.code || !f.discount_value} onClick={() => post('promotions', { action: 'create', ...f }).then(() => setF({ code: '', name: '', discount_type: 'percent', discount_value: '', expires_at: '' }))}><Plus className="w-4 h-4" /> Criar cupom</button></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{(d.promotions || []).map((p: any) => (<div key={p.id} className={cx('card p-4', !p.active && 'opacity-60')}><div className="flex items-start justify-between"><div><p className="font-mono text-lg font-bold">{p.code}</p><p className="text-xs text-ink-400">{p.name}</p></div><span className="rounded-full bg-emerald-50 text-emerald-600 px-2 py-0.5 text-sm font-semibold">{p.discount_type === 'percent' ? `${p.discount_value}%` : brl(p.discount_value)}</span></div><div className="mt-3 flex gap-2"><button onClick={() => post('promotions', { action: 'toggle', id: p.id })} className="btn-ghost py-1.5 text-xs"><Power className="w-3 h-3" /> {p.active ? 'Desativar' : 'Ativar'}</button><button onClick={() => { if (confirm(`Remover ${p.code}?`)) post('promotions', { action: 'delete', id: p.id }); }} className="btn-ghost py-1.5 text-xs"><Trash2 className="w-3 h-3" /> Remover</button></div></div>))}{(d.promotions || []).length === 0 && <p className="text-sm text-ink-400">Nenhuma promoção.</p>}</div>
    </div>
  );
}
function Logs({ d, reload }: any) {
  return (<div className="space-y-4"><div className="grid grid-cols-3 gap-3"><Stat label="Eventos" value={d.counts.total} /><Stat label="Alertas" value={d.counts.warn} color="text-amber-600" /><Stat label="Erros" value={d.counts.error} color="text-red-500" /></div><div className="flex justify-end"><button onClick={reload} className="btn-ghost py-1.5 text-xs"><RefreshCw className="w-3 h-3" /> Atualizar</button></div><div className="card overflow-x-auto"><table className="w-full text-sm"><thead className="text-left text-xs uppercase text-ink-400"><tr><th className="p-3">Quando</th><th>Nível</th><th>Ação</th><th>Por</th><th>IP</th></tr></thead><tbody>{(d.logs || []).map((l: any) => (<tr key={l.id} className="border-t border-ink-100"><td className="p-3 text-ink-500">{new Date(l.created_at).toLocaleString('pt-BR')}</td><td>{l.level}</td><td className="font-medium">{l.action}</td><td className="text-ink-500">{l.actor_email || '—'}</td><td className="font-mono text-xs text-ink-400">{l.ip || '—'}</td></tr>))}{(d.logs || []).length === 0 && <tr><td colSpan={5} className="p-6 text-center text-ink-400">Nenhum log.</td></tr>}</tbody></table></div></div>);
}
function Health({ d, reload }: any) {
  if (!d) return <div className="h-40 grid place-items-center"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  return (<div className="space-y-4"><div className="flex items-center justify-between"><span className={cx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold', d.overall === 'operacional' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600')}>{d.overall === 'operacional' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} {d.overall}</span><button onClick={reload} className="btn-ghost py-1.5 text-xs"><RefreshCw className="w-3 h-3" /> Verificar</button></div><div className="grid gap-3 sm:grid-cols-3">{d.services.map((s: any) => (<div key={s.key} className={cx('card p-4', s.status !== 'ok' && 'border-red-300')}><div className="flex items-center justify-between"><p className="font-medium">{s.label}</p><span className={cx('text-sm font-semibold', s.status === 'ok' ? 'text-emerald-600' : 'text-red-500')}>{s.status === 'ok' ? 'OK' : 'Fora'}</span></div><p className="mt-1 text-xs text-ink-400">{s.latency}ms{s.error ? ` · ${s.error}` : ''}</p></div>))}</div></div>);
}
