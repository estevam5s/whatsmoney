import { useEffect, useState } from 'react';
import { Plus, Download, Trash2, TrendingUp, TrendingDown, X, Loader2 } from 'lucide-react';
import { listTransactions, listCategories, listAccounts, createTransaction, deleteTransaction, type Tx, type Category } from '../../services/data';
import { canAddTransaction } from '../../services/gating';
import { brl, cx } from '../../lib/supabase';

export default function Transactions() {
  const [tx, setTx] = useState<Tx[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: 'all', from: '', to: '' });
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ type: 'expense', amount: '', description: '', category_id: '', account_id: '', tx_date: new Date().toISOString().slice(0, 10) });
  const [msg, setMsg] = useState('');

  const load = async () => { setLoading(true); setTx(await listTransactions(filter)); setLoading(false); };
  useEffect(() => { (async () => { const [c, a] = await Promise.all([listCategories(), listAccounts()]); setCats(c); setAccounts(a); })(); }, []);
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [filter]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg('');
    if (!form.amount) { setMsg('Informe o valor.'); return; }
    const gate = await canAddTransaction();
    if (!gate.ok) { setMsg(gate.message || 'Limite atingido.'); return; }
    setSaving(true);
    const { error } = await createTransaction({
      type: form.type, amount: Number(form.amount), description: form.description || null,
      category_id: form.category_id || null, account_id: form.account_id || accounts[0]?.id || null, tx_date: form.tx_date, source: 'web',
    } as any);
    setSaving(false);
    if (error) { setMsg(error); return; }
    setOpen(false); setForm({ ...form, amount: '', description: '', category_id: '' }); load();
  };

  const exportCsv = () => {
    const rows = ['tipo,data,descricao,categoria,valor', ...tx.map((t) => `${t.type},${t.tx_date},"${(t.description || '').replace(/"/g, '')}",${cats.find((c) => c.id === t.category_id)?.name || ''},${t.amount}`)];
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'transacoes.csv'; a.click();
  };

  const catName = (id: string | null) => cats.find((c) => c.id === id)?.name || '—';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><h1 className="font-display text-2xl font-bold">Transações</h1><p className="text-sm text-ink-500">Gastos e entradas. Registre aqui ou pelo WhatsApp.</p></div>
        <div className="flex gap-2"><button onClick={exportCsv} className="btn-ghost py-2"><Download className="w-4 h-4" /> CSV</button><button onClick={() => { setOpen(true); setMsg(''); }} className="btn-primary py-2"><Plus className="w-4 h-4" /> Nova transação</button></div>
      </div>

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <select className="input max-w-[160px]" value={filter.type} onChange={(e) => setFilter({ ...filter, type: e.target.value })}><option value="all">Todos os tipos</option><option value="expense">Saídas</option><option value="income">Entradas</option></select>
        <input type="date" className="input max-w-[170px]" value={filter.from} onChange={(e) => setFilter({ ...filter, from: e.target.value })} />
        <input type="date" className="input max-w-[170px]" value={filter.to} onChange={(e) => setFilter({ ...filter, to: e.target.value })} />
        {(filter.from || filter.to || filter.type !== 'all') && <button onClick={() => setFilter({ type: 'all', from: '', to: '' })} className="text-sm text-ink-500 hover:text-ink-800">Limpar</button>}
      </div>

      <div className="card overflow-hidden">
        {loading ? <p className="py-16 text-center text-ink-400">Carregando…</p> : (
          <div className="divide-y divide-ink-100">
            {tx.map((t) => (
              <div key={t.id} className="group flex items-center justify-between px-5 py-3.5">
                <div className="flex items-center gap-3"><span className={cx('grid place-items-center w-9 h-9 rounded-full', t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600')}>{t.type === 'income' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}</span><div><p className="text-sm font-medium">{t.description || catName(t.category_id)}</p><p className="text-xs text-ink-400">{new Date(t.tx_date).toLocaleDateString('pt-BR')} · {catName(t.category_id)}{t.source === 'whatsapp' ? ' · WhatsApp' : ''}</p></div></div>
                <div className="flex items-center gap-3"><p className={cx('font-semibold', t.type === 'income' ? 'text-emerald-600' : 'text-red-600')}>{t.type === 'income' ? '+' : '−'}{brl(t.amount)}</p><button onClick={() => { deleteTransaction(t.id).then(load); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-ink-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></div>
              </div>
            ))}
            {tx.length === 0 && <p className="px-5 py-12 text-center text-sm text-ink-400">Nenhuma transação no filtro.</p>}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/40 p-0 sm:p-4" onClick={() => setOpen(false)}>
          <div className="w-full sm:max-w-md card p-6 rounded-b-none sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="font-display text-lg font-bold">Nova transação</h2><button onClick={() => setOpen(false)}><X className="w-5 h-5 text-ink-400" /></button></div>
            {msg && <div className="mb-4 p-3 text-sm rounded-xl bg-red-50 border border-red-200 text-red-700">{msg}</div>}
            <form onSubmit={submit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => setForm({ ...form, type: 'expense' })} className={cx('py-2.5 rounded-xl text-sm font-semibold border', form.type === 'expense' ? 'border-red-300 bg-red-50 text-red-600' : 'border-ink-200')}>Saída</button>
                <button type="button" onClick={() => setForm({ ...form, type: 'income' })} className={cx('py-2.5 rounded-xl text-sm font-semibold border', form.type === 'income' ? 'border-emerald-300 bg-emerald-50 text-emerald-600' : 'border-ink-200')}>Entrada</button>
              </div>
              <input type="number" step="0.01" className="input" placeholder="Valor (R$)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <input className="input" placeholder="Descrição" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}><option value="">Categoria</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
              <input type="date" className="input" value={form.tx_date} onChange={(e) => setForm({ ...form, tx_date: e.target.value })} />
              <button disabled={saving} className="btn-primary w-full">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
