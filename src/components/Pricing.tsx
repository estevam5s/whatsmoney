import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, Star } from 'lucide-react';
import { getPlans, startCheckout, type Plan } from '../services/billing';
import { supabase, brl0, cx } from '../lib/supabase';

export default function Pricing({ currentSlug }: { currentSlug?: string }) {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState('');

  useEffect(() => { getPlans().then(setPlans); }, []);

  const choose = async (p: Plan) => {
    if (p.slug === currentSlug) return;
    if (p.billing_type === 'free') { navigate('/entrar?mode=signup'); return; }
    if (p.slug === 'enterprise') { navigate('/contato'); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { navigate('/entrar?mode=signup'); return; }
    setLoading(p.slug); await startCheckout(p.slug, cycle); setLoading('');
  };

  return (
    <div>
      <div className="flex items-center justify-center gap-2 mb-10">
        <button onClick={() => setCycle('monthly')} className={cx('px-5 py-2 rounded-full text-sm font-semibold transition', cycle === 'monthly' ? 'bg-brand-600 text-white' : 'text-ink-500 hover:bg-ink-100')}>Mensal</button>
        <button onClick={() => setCycle('yearly')} className={cx('px-5 py-2 rounded-full text-sm font-semibold transition flex items-center gap-2', cycle === 'yearly' ? 'bg-brand-600 text-white' : 'text-ink-500 hover:bg-ink-100')}>Anual <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700">−20%</span></button>
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4 items-start">
        {plans.map((p) => {
          const free = p.billing_type === 'free';
          const m = cycle === 'yearly' ? Math.round((p.yearly_price || 0) / 12) : p.monthly_price;
          const current = p.slug === currentSlug;
          return (
            <div key={p.slug} className={cx('relative flex flex-col rounded-2xl border p-6 bg-white', p.highlight ? 'border-brand-500 shadow-glow' : 'border-ink-200 shadow-soft')}>
              {p.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-0.5 text-[11px] font-bold text-white"><Star className="w-3 h-3 fill-current" /> Mais popular</span>}
              <h3 className="font-display text-lg font-bold">{p.name}</h3>
              <p className="text-sm text-ink-500 min-h-[40px] mt-1">{p.description}</p>
              <div className="mt-4 flex items-end gap-1">
                <span className="text-4xl font-extrabold tracking-tight">{free ? 'R$ 0' : brl0(m)}</span>
                {!free && <span className="text-ink-500 mb-1 text-sm">/mês</span>}
              </div>
              {cycle === 'yearly' && !free && <p className="text-[11px] text-brand-600 mt-0.5">{brl0(p.yearly_price)} cobrados no ano</p>}
              <button onClick={() => choose(p)} disabled={loading === p.slug || current} className={cx('mt-5 rounded-xl py-2.5 text-sm font-semibold transition flex items-center justify-center gap-2 disabled:opacity-70', current ? 'bg-ink-100 text-ink-400' : p.highlight ? 'bg-brand-600 text-white hover:bg-brand-700' : 'border border-ink-200 hover:bg-ink-50')}>
                {loading === p.slug && <Loader2 className="w-4 h-4 animate-spin" />} {current ? 'Plano atual' : p.cta}
              </button>
              <ul className="mt-5 space-y-2 flex-1">
                {(p.features || []).map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-[13px] text-ink-600"><Check className="w-3.5 h-3.5 mt-0.5 text-brand-600 shrink-0" /><span>{f}</span></li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
