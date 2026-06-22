import { useEffect, useState } from 'react';
import { Crown, ExternalLink, Loader2 } from 'lucide-react';
import { getMySubscription, openPortal } from '../../services/billing';
import { brl, fmtDate } from '../../lib/supabase';
import Pricing from '../../components/Pricing';

export default function Billing() {
  const [data, setData] = useState<any>(null);
  const [opening, setOpening] = useState(false);
  useEffect(() => { getMySubscription().then(setData); }, []);
  if (!data) return <div className="h-64 grid place-items-center text-ink-400"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  const sub = data.subscription, plan = data.plan;
  const status = sub?.status || 'active';
  const label: Record<string, string> = { trialing: 'Em teste', active: 'Ativo', past_due: 'Pagamento pendente', canceled: 'Cancelado' };

  return (
    <div className="space-y-7">
      <div><h1 className="font-display text-2xl font-bold">Meu plano</h1><p className="text-sm text-ink-500">Gerencie sua assinatura e veja seu plano atual.</p></div>

      <div className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-gradient-to-r from-brand-50 to-white border-b border-ink-100">
          <div className="flex items-center gap-4">
            <span className="grid place-items-center w-12 h-12 rounded-xl bg-brand-600/10 text-brand-600"><Crown className="w-6 h-6" /></span>
            <div><div className="flex items-center gap-2"><p className="text-xl font-bold">{plan?.name || 'Teste grátis'}</p><span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${status === 'active' || status === 'trialing' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{label[status] || status}</span></div><p className="text-sm text-ink-500">{Number(plan?.monthly_price) > 0 ? `${brl(plan.monthly_price)}/mês` : 'Gratuito'}{status === 'trialing' && sub?.trial_end ? ` · teste até ${fmtDate(sub.trial_end)}` : ''}</p></div>
          </div>
          {sub?.stripe_subscription_id && <button onClick={() => { setOpening(true); openPortal(); }} disabled={opening} className="btn-ghost py-2">{opening ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />} Gerenciar assinatura</button>}
        </div>
      </div>

      <div><h2 className="font-display text-lg font-bold mb-1">Mudar de plano</h2><p className="text-sm text-ink-500 mb-6">Faça upgrade para liberar mais recursos.</p><Pricing currentSlug={sub?.plan_slug || 'free'} /></div>
    </div>
  );
}
