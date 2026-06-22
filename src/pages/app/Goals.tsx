import { useEffect, useState } from 'react';
import { Plus, Trash2, Target, X, Loader2 } from 'lucide-react';
import { listGoals, createGoal, updateGoal, deleteGoal } from '../../services/data';
import { canAddGoal } from '../../services/gating';
import { brl } from '../../lib/supabase';

export default function Goals() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', target_amount: '', current_amount: '', deadline: '' });
  const [msg, setMsg] = useState('');

  const load = async () => { setLoading(true); setItems(await listGoals()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMsg(''); if (!form.title || !form.target_amount) { setMsg('Informe título e valor da meta.'); return; }
    const gate = await canAddGoal(); if (!gate.ok) { setMsg(gate.message || 'Limite atingido.'); return; }
    setSaving(true);
    await createGoal({ title: form.title, target_amount: Number(form.target_amount), current_amount: Number(form.current_amount || 0), deadline: form.deadline || null });
    setSaving(false); setOpen(false); setForm({ title: '', target_amount: '', current_amount: '', deadline: '' }); load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3"><div><h1 className="font-display text-2xl font-bold">Metas</h1><p className="text-sm text-ink-500">Defina objetivos e acompanhe o progresso.</p></div><button onClick={() => { setOpen(true); setMsg(''); }} className="btn-primary py-2"><Plus className="w-4 h-4" /> Nova meta</button></div>

      {loading ? <p className="py-16 text-center text-ink-400">Carregando…</p> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((g) => {
            const pct = g.target_amount > 0 ? Math.min(100, (g.current_amount / g.target_amount) * 100) : 0;
            return (
              <div key={g.id} className="card p-5 group">
                <div className="flex items-start justify-between"><span className="grid place-items-center w-10 h-10 rounded-xl bg-brand-50 text-brand-600"><Target className="w-5 h-5" /></span><button onClick={() => deleteGoal(g.id).then(load)} className="opacity-0 group-hover:opacity-100 p-1.5 text-ink-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button></div>
                <h3 className="font-semibold mt-3">{g.title}</h3>
                <p className="text-sm text-ink-500">{brl(g.current_amount)} de {brl(g.target_amount)}</p>
                <div className="mt-3 h-2 rounded-full bg-ink-100 overflow-hidden"><div className="h-full bg-brand-500" style={{ width: `${pct}%` }} /></div>
                <div className="mt-3 flex items-center justify-between text-xs text-ink-400"><span>{Math.round(pct)}%</span>{g.deadline && <span>até {new Date(g.deadline).toLocaleDateString('pt-BR')}</span>}</div>
                <button onClick={() => { const v = prompt('Adicionar à meta (R$):'); if (v) updateGoal(g.id, { current_amount: Number(g.current_amount) + Number(v) }).then(load); }} className="mt-3 w-full btn-ghost py-2 text-xs">+ Adicionar valor</button>
              </div>
            );
          })}
          {items.length === 0 && <div className="card p-12 text-center sm:col-span-2 xl:col-span-3"><Target className="w-10 h-10 mx-auto text-ink-200 mb-2" /><p className="text-sm text-ink-400">Nenhuma meta ainda. Crie sua primeira meta financeira.</p></div>}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/40 sm:p-4" onClick={() => setOpen(false)}>
          <div className="w-full sm:max-w-md card p-6 rounded-b-none sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="font-display text-lg font-bold">Nova meta</h2><button onClick={() => setOpen(false)}><X className="w-5 h-5 text-ink-400" /></button></div>
            {msg && <div className="mb-4 p-3 text-sm rounded-xl bg-red-50 border border-red-200 text-red-700">{msg}</div>}
            <form onSubmit={submit} className="space-y-3">
              <input className="input" placeholder="Título (ex.: Viagem)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <input type="number" step="0.01" className="input" placeholder="Valor da meta (R$)" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} />
              <input type="number" step="0.01" className="input" placeholder="Já guardado (opcional)" value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: e.target.value })} />
              <input type="date" className="input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              <button disabled={saving} className="btn-primary w-full">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar meta'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
