import { useEffect, useState } from 'react';
import { Plus, Trash2, Bell, Check, X, Loader2 } from 'lucide-react';
import { listReminders, createReminder, toggleReminder, deleteReminder } from '../../services/data';
import { brl, cx } from '../../lib/supabase';

export default function Reminders() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', notes: '', due_at: '', amount: '' });

  const load = async () => { setLoading(true); setItems(await listReminders()); setLoading(false); };
  useEffect(() => { load(); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!form.title) return; setSaving(true);
    await createReminder({ title: form.title, notes: form.notes || null, due_at: form.due_at || null, amount: form.amount ? Number(form.amount) : null });
    setSaving(false); setOpen(false); setForm({ title: '', notes: '', due_at: '', amount: '' }); load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between gap-3"><div><h1 className="font-display text-2xl font-bold">Lembretes</h1><p className="text-sm text-ink-500">Contas a pagar e tarefas com data e horário.</p></div><button onClick={() => setOpen(true)} className="btn-primary py-2"><Plus className="w-4 h-4" /> Novo lembrete</button></div>

      <div className="card overflow-hidden">
        {loading ? <p className="py-16 text-center text-ink-400">Carregando…</p> : (
          <div className="divide-y divide-ink-100">
            {items.map((r) => (
              <div key={r.id} className="group flex items-center gap-3 px-5 py-3.5">
                <button onClick={() => toggleReminder(r.id, !r.done).then(load)} className={cx('w-6 h-6 rounded-full border grid place-items-center shrink-0', r.done ? 'bg-brand-600 border-brand-600 text-white' : 'border-ink-300')}>{r.done && <Check className="w-3.5 h-3.5" />}</button>
                <div className="flex-1 min-w-0"><p className={cx('text-sm font-medium', r.done && 'line-through text-ink-400')}>{r.title}</p><p className="text-xs text-ink-400">{r.due_at ? new Date(r.due_at).toLocaleString('pt-BR') : 'Sem data'}{r.amount ? ` · ${brl(r.amount)}` : ''}{r.notes ? ` · ${r.notes}` : ''}</p></div>
                <button onClick={() => deleteReminder(r.id).then(load)} className="opacity-0 group-hover:opacity-100 p-1.5 text-ink-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {items.length === 0 && <div className="px-5 py-12 text-center"><Bell className="w-10 h-10 mx-auto text-ink-200 mb-2" /><p className="text-sm text-ink-400">Nenhum lembrete. Crie um ou peça à Lume no WhatsApp.</p></div>}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 grid place-items-end sm:place-items-center bg-black/40 sm:p-4" onClick={() => setOpen(false)}>
          <div className="w-full sm:max-w-md card p-6 rounded-b-none sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="font-display text-lg font-bold">Novo lembrete</h2><button onClick={() => setOpen(false)}><X className="w-5 h-5 text-ink-400" /></button></div>
            <form onSubmit={submit} className="space-y-3">
              <input className="input" placeholder="Título (ex.: Pagar a luz)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <input type="datetime-local" className="input" value={form.due_at} onChange={(e) => setForm({ ...form, due_at: e.target.value })} />
              <input type="number" step="0.01" className="input" placeholder="Valor (opcional)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              <input className="input" placeholder="Observações (opcional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              <button disabled={saving} className="btn-primary w-full">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
