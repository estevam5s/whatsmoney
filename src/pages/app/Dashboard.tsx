import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Wallet, ArrowLeftRight, MessageCircle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from 'recharts';
import { listTransactions, listCategories, summarize, type Tx, type Category } from '../../services/data';
import { brl, brl0 } from '../../lib/supabase';

const COLORS = ['#ef4444', '#f59e0b', '#8b5cf6', '#ec4899', '#10b981', '#06b6d4', '#64748b'];

export default function Dashboard() {
  const [tx, setTx] = useState<Tx[] | null>(null);
  const [cats, setCats] = useState<Category[]>([]);

  useEffect(() => { (async () => { setCats(await listCategories()); setTx(await listTransactions()); })(); }, []);
  if (!tx) return <div className="h-64 grid place-items-center text-ink-400">Carregando…</div>;

  const now = new Date();
  const monthTx = tx.filter((t) => { const d = new Date(t.tx_date); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
  const s = summarize(monthTx);

  // série diária do mês
  const days: Record<string, number> = {};
  monthTx.forEach((t) => { const d = t.tx_date.slice(8, 10); days[d] = (days[d] || 0) + (t.type === 'expense' ? -Number(t.amount) : Number(t.amount)); });
  let acc = 0;
  const series = Object.keys(days).sort().map((d) => { acc += days[d]; return { dia: d, saldo: Math.round(acc) }; });

  // despesas por categoria
  const catName: Record<string, { name: string; color: string }> = {};
  cats.forEach((c) => (catName[c.id] = { name: c.name, color: c.color }));
  const byCat: Record<string, number> = {};
  monthTx.filter((t) => t.type === 'expense').forEach((t) => { const k = t.category_id || 'sem'; byCat[k] = (byCat[k] || 0) + Number(t.amount); });
  const pie = Object.entries(byCat).map(([k, v]) => ({ name: catName[k]?.name || 'Outros', value: Math.round(v) })).sort((a, b) => b.value - a.value).slice(0, 6);

  const Stat = ({ icon: Icon, label, value, tone }: any) => (
    <div className="card p-5"><div className="flex items-center justify-between"><span className={`grid place-items-center w-10 h-10 rounded-xl ${tone}`}><Icon className="w-5 h-5" /></span></div><p className="mt-3 text-2xl font-extrabold tracking-tight">{value}</p><p className="text-xs text-ink-400 uppercase tracking-wide mt-0.5">{label}</p></div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-2xl font-bold">Visão geral</h1><p className="text-sm text-ink-500">Resumo do mês de {now.toLocaleDateString('pt-BR', { month: 'long' })}.</p></div>
        <a href="https://wa.me/" target="_blank" rel="noreferrer" className="btn-ghost py-2"><MessageCircle className="w-4 h-4 text-brand-600" /> Registrar pelo WhatsApp</a>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Wallet} label="Saldo do mês" value={brl(s.balance)} tone="bg-brand-50 text-brand-600" />
        <Stat icon={TrendingUp} label="Entradas" value={brl(s.income)} tone="bg-emerald-50 text-emerald-600" />
        <Stat icon={TrendingDown} label="Saídas" value={brl(s.expense)} tone="bg-red-50 text-red-600" />
        <Stat icon={ArrowLeftRight} label="Transações" value={s.count} tone="bg-ink-100 text-ink-600" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-semibold mb-3">Evolução do saldo</h3>
          {series.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={series}><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="100%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                <XAxis dataKey="dia" tick={{ fontSize: 12 }} /><YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => brl0(v)} width={70} /><Tooltip formatter={(v: any) => brl(v)} /><Area type="monotone" dataKey="saldo" stroke="#10b981" strokeWidth={3} fill="url(#g)" /></AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-ink-400 py-16 text-center">Sem transações este mês ainda.</p>}
        </div>
        <div className="card p-5">
          <h3 className="font-semibold mb-3">Gastos por categoria</h3>
          {pie.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart><Pie data={pie} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={85} paddingAngle={2}>{pie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v: any) => brl(v)} /></PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-ink-400 py-16 text-center">Sem despesas este mês.</p>}
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-3.5 border-b border-ink-100 font-semibold">Últimas transações</div>
        <div className="divide-y divide-ink-100">
          {tx.slice(0, 8).map((t) => (
            <div key={t.id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-3"><span className={`grid place-items-center w-9 h-9 rounded-full ${t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{t.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}</span><div><p className="text-sm font-medium">{t.description || (catName[t.category_id || '']?.name) || 'Transação'}</p><p className="text-xs text-ink-400">{new Date(t.tx_date).toLocaleDateString('pt-BR')} · {t.source === 'whatsapp' ? 'WhatsApp' : 'Web'}</p></div></div>
              <p className={`font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>{t.type === 'income' ? '+' : '−'}{brl(t.amount)}</p>
            </div>
          ))}
          {tx.length === 0 && <p className="px-5 py-10 text-center text-sm text-ink-400">Nenhuma transação ainda. Registre pelo WhatsApp ou na aba Transações.</p>}
        </div>
      </div>
    </div>
  );
}
