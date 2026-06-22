import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, MessageCircle, Sparkles, BarChart3, Bell, Target, Brain, ShieldCheck, Menu, X } from 'lucide-react';
import Logo from '../components/Logo';
import Pricing from '../components/Pricing';
import { useAuth } from '../contexts/AuthContext';

const NAV = [['#recursos', 'Recursos'], ['#como', 'Como funciona'], ['#precos', 'Preços'], ['#faq', 'FAQ']];
const FEATURES = [
  { icon: MessageCircle, t: 'Registre no WhatsApp', d: 'Mande "gastei 30 no almoço" e a Lume registra, categoriza e confirma na hora.' },
  { icon: Brain, t: 'IA que entende você', d: 'Linguagem natural: a IA interpreta, categoriza e gera insights automáticos.' },
  { icon: BarChart3, t: 'Dashboard completo', d: 'Gráficos interativos, filtros por período e categoria, relatórios e exportação.' },
  { icon: Bell, t: 'Lembretes inteligentes', d: 'Contas a pagar, datas e horários — a Lume te avisa antes do vencimento.' },
  { icon: Target, t: 'Metas financeiras', d: 'Defina objetivos e acompanhe o progresso com projeções por IA.' },
  { icon: ShieldCheck, t: 'Seguro e privado', d: 'Seus dados isolados por conta, criptografia e backups automáticos.' },
];
const STEPS = [
  { n: '1', t: 'Conecte seu WhatsApp', d: 'Ative em segundos, sem cartão de crédito.' },
  { n: '2', t: 'Converse com a Lume', d: 'Registre gastos, receitas, lembretes e metas só conversando.' },
  { n: '3', t: 'Veja tudo no painel', d: 'Acompanhe saldo, gráficos e relatórios no dashboard web.' },
];
const FAQ = [
  ['Preciso instalar algo?', 'Não. Você usa pelo WhatsApp e acompanha pelo painel web. Sem instalação.'],
  ['Como funciona o teste grátis?', 'São 3 dias com acesso completo e até 10 transações, sem cartão de crédito.'],
  ['A IA entende mensagens normais?', 'Sim. Escreva como fala: "almoço 35", "recebi 2000 de salário", "lembrar de pagar a luz dia 10".'],
  ['Posso cancelar quando quiser?', 'Sim, a qualquer momento pelo portal de cobrança, sem multa.'],
];

export default function Landing() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [faq, setFaq] = useState<number | null>(0);
  useEffect(() => { const h = () => setScrolled(window.scrollY > 8); h(); window.addEventListener('scroll', h); return () => window.removeEventListener('scroll', h); }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className={`sticky top-0 z-50 transition ${scrolled ? 'bg-white/85 backdrop-blur border-b border-ink-100 shadow-sm' : ''}`}>
        <div className="container-page h-16 flex items-center justify-between">
          <Link to="/"><Logo /></Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV.map(([h, l]) => <a key={h} href={h} className="px-3 py-2 rounded-lg text-sm font-medium text-ink-600 hover:text-ink-900 hover:bg-ink-50">{l}</a>)}
          </nav>
          <div className="hidden md:flex items-center gap-2">
            {user ? <Link to="/app" className="btn-primary py-2">Ir para o painel</Link> : (<>
              <Link to="/entrar" className="px-4 py-2 rounded-full text-sm font-medium text-ink-700 hover:bg-ink-100">Entrar</Link>
              <Link to="/entrar?mode=signup" className="btn-primary py-2">Começar grátis <ArrowRight className="w-4 h-4" /></Link>
            </>)}
          </div>
          <button onClick={() => setOpen(!open)} className="md:hidden p-2">{open ? <X /> : <Menu />}</button>
        </div>
        {open && (
          <div className="md:hidden fixed inset-0 top-16 z-40 bg-white px-5 py-6 flex flex-col gap-1">
            {NAV.map(([h, l]) => <a key={h} href={h} onClick={() => setOpen(false)} className="px-3 py-3.5 rounded-xl text-lg font-medium text-ink-800 hover:bg-ink-50">{l}</a>)}
            <div className="mt-3 grid gap-2">
              <Link to="/entrar" onClick={() => setOpen(false)} className="btn-ghost">Entrar</Link>
              <Link to="/entrar?mode=signup" onClick={() => setOpen(false)} className="btn-primary">Começar grátis</Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-50/60 via-white to-white" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[640px] h-[640px] bg-brand-300/20 rounded-full blur-[120px]" />
        <div className="container-page relative py-20 md:py-28 text-center max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 animate-fade-up"><Sparkles className="w-3.5 h-3.5" /> Seu copiloto financeiro por IA no WhatsApp</span>
          <h1 className="mt-6 font-display text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.08] animate-fade-up" style={{ animationDelay: '60ms' }}>
            Controle seu dinheiro <span className="bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">só conversando</span>
          </h1>
          <p className="mt-6 text-lg text-ink-600 max-w-2xl mx-auto animate-fade-up" style={{ animationDelay: '120ms' }}>
            Registre gastos, crie tarefas, receba lembretes e veja resumos completos — apenas conversando com a Lume no WhatsApp.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: '180ms' }}>
            <Link to="/entrar?mode=signup" className="btn-primary px-7 py-3.5">Começar grátis <ArrowRight className="w-5 h-5" /></Link>
            <a href="#precos" className="btn-ghost px-7 py-3.5">Ver planos</a>
          </div>
          <p className="mt-4 text-xs text-ink-400 flex items-center justify-center gap-1.5 animate-fade-up" style={{ animationDelay: '240ms' }}><Check className="w-3.5 h-3.5 text-brand-500" /> 3 dias grátis · Sem cartão de crédito</p>

          {/* chat mock */}
          <div className="mt-14 max-w-md mx-auto text-left animate-fade-up" style={{ animationDelay: '300ms' }}>
            <div className="card p-4 space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-ink-100"><span className="w-8 h-8 rounded-full bg-brand-500 grid place-items-center text-white"><MessageCircle className="w-4 h-4" /></span><div><p className="text-sm font-semibold">Lume</p><p className="text-[11px] text-brand-600">online</p></div></div>
              <div className="flex justify-end"><div className="bg-brand-600 text-white text-sm rounded-2xl rounded-br-sm px-3.5 py-2 max-w-[75%]">gastei 35 no almoço hoje 🍽️</div></div>
              <div className="flex justify-start"><div className="bg-ink-100 text-ink-800 text-sm rounded-2xl rounded-bl-sm px-3.5 py-2 max-w-[80%]">Anotado! <b>R$ 35,00</b> em <b>Alimentação</b>. Você já gastou R$ 320 esse mês com comida 📊</div></div>
            </div>
          </div>
        </div>
      </section>

      {/* Recursos */}
      <section id="recursos" className="container-page py-20 md:py-24">
        <div className="text-center mb-12"><h2 className="font-display text-3xl md:text-4xl font-bold">Tudo o que você precisa para organizar a vida financeira</h2><p className="mt-3 text-ink-500 max-w-2xl mx-auto">Do registro no WhatsApp à inteligência de dados no painel.</p></div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.t} className="card p-6 hover:shadow-glow transition">
              <span className="inline-grid place-items-center w-11 h-11 rounded-xl bg-brand-50 text-brand-600 mb-4"><f.icon className="w-5 h-5" /></span>
              <h3 className="font-semibold mb-1">{f.t}</h3><p className="text-sm text-ink-500">{f.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Como funciona */}
      <section id="como" className="bg-ink-50/60 py-20 md:py-24">
        <div className="container-page">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-center mb-12">Comece em 3 passos</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n} className="card p-6"><span className="grid place-items-center w-10 h-10 rounded-full bg-brand-600 text-white font-bold mb-4">{s.n}</span><h3 className="font-semibold mb-1">{s.t}</h3><p className="text-sm text-ink-500">{s.d}</p></div>
            ))}
          </div>
        </div>
      </section>

      {/* Preços */}
      <section id="precos" className="container-page py-20 md:py-24">
        <div className="text-center mb-10"><span className="inline-block px-3 py-1 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold">Planos</span><h2 className="mt-4 font-display text-3xl md:text-4xl font-bold">Escolha o plano ideal</h2><p className="mt-3 text-ink-500">Comece grátis. Em Reais, cancele quando quiser.</p></div>
        <Pricing />
      </section>

      {/* FAQ */}
      <section id="faq" className="bg-ink-50/60 py-20">
        <div className="container-page max-w-3xl">
          <h2 className="font-display text-3xl font-bold text-center mb-10">Perguntas frequentes</h2>
          <div className="space-y-3">
            {FAQ.map(([q, a], i) => (
              <div key={i} className="card overflow-hidden">
                <button onClick={() => setFaq(faq === i ? null : i)} className="w-full text-left px-5 py-4 font-medium flex items-center justify-between">{q}<span className="text-ink-400">{faq === i ? '−' : '+'}</span></button>
                {faq === i && <div className="px-5 pb-4 text-sm text-ink-500">{a}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container-page py-20">
        <div className="rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 p-10 md:p-14 text-center text-white">
          <h2 className="font-display text-3xl md:text-4xl font-bold">Comece grátis hoje</h2>
          <p className="mt-3 text-white/80">3 dias com acesso completo. Sem cartão de crédito.</p>
          <Link to="/entrar?mode=signup" className="mt-7 inline-flex items-center gap-2 rounded-full bg-white text-brand-700 px-7 py-3.5 font-semibold hover:bg-brand-50">Criar minha conta <ArrowRight className="w-5 h-5" /></Link>
        </div>
      </section>

      <footer className="border-t border-ink-100 py-10">
        <div className="container-page flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo />
          <p className="text-sm text-ink-400">© {new Date().getFullYear()} WhatsMoney · Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
