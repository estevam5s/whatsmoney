import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2, Loader2, Check } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

/* ---------- olhos animados que seguem o cursor ---------- */
function useMouse() {
  const [m, setM] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const h = (e: MouseEvent) => setM({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', h);
    return () => window.removeEventListener('mousemove', h);
  }, []);
  return m;
}

type EyeProps = {
  size?: number; pupil?: number; max?: number; color?: string;
  blink?: boolean; lookX?: number; lookY?: number; mouse: { x: number; y: number };
};
function EyeBall({ size = 18, pupil = 7, max = 5, color = '#1e293b', blink = false, lookX, lookY, mouse }: EyeProps) {
  const ref = useRef<HTMLDivElement>(null);
  const pos = (() => {
    if (lookX !== undefined && lookY !== undefined) return { x: lookX, y: lookY };
    if (!ref.current) return { x: 0, y: 0 };
    const r = ref.current.getBoundingClientRect();
    const dx = mouse.x - (r.left + r.width / 2);
    const dy = mouse.y - (r.top + r.height / 2);
    const dist = Math.min(Math.hypot(dx, dy), max);
    const a = Math.atan2(dy, dx);
    return { x: Math.cos(a) * dist, y: Math.sin(a) * dist };
  })();
  return (
    <div ref={ref} className="rounded-full flex items-center justify-center overflow-hidden transition-all duration-150"
      style={{ width: size, height: blink ? 2 : size, backgroundColor: 'white' }}>
      {!blink && <div className="rounded-full" style={{ width: pupil, height: pupil, backgroundColor: color, transform: `translate(${pos.x}px,${pos.y}px)`, transition: 'transform .1s ease-out' }} />}
    </div>
  );
}

function Characters({ typing, hasPwd, showPwd }: { typing: boolean; hasPwd: boolean; showPwd: boolean }) {
  const mouse = useMouse();
  const [blinkA, setBlinkA] = useState(false);
  const [blinkB, setBlinkB] = useState(false);
  const [together, setTogether] = useState(false);
  const [peek, setPeek] = useState(false);
  const aRef = useRef<HTMLDivElement>(null);
  const bRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => { t = setTimeout(() => { setBlinkA(true); setTimeout(() => { setBlinkA(false); loop(); }, 150); }, Math.random() * 4000 + 3000); };
    loop(); return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    const loop = () => { t = setTimeout(() => { setBlinkB(true); setTimeout(() => { setBlinkB(false); loop(); }, 150); }, Math.random() * 4000 + 3500); };
    loop(); return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!typing) { setTogether(false); return; }
    setTogether(true);
    const t = setTimeout(() => setTogether(false), 800);
    return () => clearTimeout(t);
  }, [typing]);
  useEffect(() => {
    if (!(hasPwd && showPwd)) { setPeek(false); return; }
    const t = setTimeout(() => { setPeek(true); setTimeout(() => setPeek(false), 800); }, Math.random() * 3000 + 2000);
    return () => clearTimeout(t);
  }, [hasPwd, showPwd, peek]);

  const lean = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (!ref.current) return 0;
    const r = ref.current.getBoundingClientRect();
    return Math.max(-6, Math.min(6, -(mouse.x - (r.left + r.width / 2)) / 120));
  };
  const hidden = hasPwd && !showPwd;          // escondendo a senha → "fecha os olhos"/cresce
  const watching = hasPwd && showPwd;         // senha visível → espia

  return (
    <div className="relative" style={{ width: 520, height: 380 }}>
      {/* bloco esmeralda (fundo) */}
      <div ref={aRef} className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{ left: 70, width: 170, height: (typing || hidden) ? 410 : 380, background: '#059669', borderRadius: '12px 12px 0 0', zIndex: 1,
          transform: watching ? 'skewX(0deg)' : (typing || hidden) ? `skewX(${lean(aRef) - 10}deg) translateX(36px)` : `skewX(${lean(aRef)}deg)`, transformOrigin: 'bottom center' }}>
        <div className="absolute flex gap-7 transition-all duration-700" style={{ left: watching ? 22 : together ? 52 : 44, top: watching ? 34 : together ? 60 : 40 }}>
          <EyeBall mouse={mouse} blink={blinkA} lookX={watching ? (peek ? 4 : -4) : together ? 3 : undefined} lookY={watching ? (peek ? 5 : -4) : together ? 4 : undefined} />
          <EyeBall mouse={mouse} blink={blinkA} lookX={watching ? (peek ? 4 : -4) : together ? 3 : undefined} lookY={watching ? (peek ? 5 : -4) : together ? 4 : undefined} />
        </div>
      </div>

      {/* bloco escuro (meio) */}
      <div ref={bRef} className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{ left: 230, width: 116, height: 300, background: '#0f172a', borderRadius: '10px 10px 0 0', zIndex: 2,
          transform: watching ? 'skewX(0deg)' : together ? `skewX(${lean(bRef) * 1.5 + 10}deg) translateX(18px)` : `skewX(${lean(bRef) * 1.5}deg)`, transformOrigin: 'bottom center' }}>
        <div className="absolute flex gap-6 transition-all duration-700" style={{ left: watching ? 10 : together ? 30 : 24, top: watching ? 26 : together ? 12 : 30 }}>
          <EyeBall mouse={mouse} size={16} pupil={6} max={4} blink={blinkB} lookX={watching ? -4 : together ? 0 : undefined} lookY={watching ? -4 : together ? -4 : undefined} />
          <EyeBall mouse={mouse} size={16} pupil={6} max={4} blink={blinkB} lookX={watching ? -4 : together ? 0 : undefined} lookY={watching ? -4 : together ? -4 : undefined} />
        </div>
      </div>

      {/* semicírculo âmbar (frente esq.) */}
      <div className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{ left: 0, width: 230, height: 190, background: '#fbbf24', borderRadius: '115px 115px 0 0', zIndex: 3, transform: watching ? 'skewX(0deg)' : 'skewX(0deg)' }}>
        <div className="absolute flex gap-7" style={{ left: 78, top: 86 }}>
          <span className="rounded-full" style={{ width: 12, height: 12, background: '#0f172a' }} />
          <span className="rounded-full" style={{ width: 12, height: 12, background: '#0f172a' }} />
        </div>
      </div>

      {/* bloco teal (frente dir.) com sorriso */}
      <div className="absolute bottom-0 transition-all duration-700 ease-in-out"
        style={{ left: 300, width: 134, height: 220, background: '#2dd4bf', borderRadius: '67px 67px 0 0', zIndex: 4 }}>
        <div className="absolute flex gap-6" style={{ left: 50, top: 40 }}>
          <span className="rounded-full" style={{ width: 12, height: 12, background: '#0f172a' }} />
          <span className="rounded-full" style={{ width: 12, height: 12, background: '#0f172a' }} />
        </div>
        <div className="absolute rounded-full" style={{ left: 38, top: 86, width: 60, height: 4, background: '#0f172a' }} />
      </div>
    </div>
  );
}

/* ---------- página ---------- */
const PERKS = ['3 dias grátis, sem cartão', 'Registre gastos pelo WhatsApp', 'Dashboard, gráficos e relatórios'];

export default function Auth() {
  const [params] = useSearchParams();
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [form, setForm] = useState({ email: '', password: '', fullName: '', whatsapp: '' });
  const [show, setShow] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const isSignup = mode === 'signup';
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, [k]: e.target.value });

  const recover = async () => {
    setError(''); setInfo('');
    if (!form.email) { setError('Digite seu e-mail acima para receber o link de redefinição.'); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo: `${window.location.origin}/entrar` });
    if (error) setError('Não foi possível enviar o e-mail. Tente novamente.');
    else setInfo('Enviamos um link de redefinição de senha para o seu e-mail.');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setInfo(''); setLoading(true);
    if (isSignup) {
      if (!form.fullName || !form.email || !form.password) { setError('Preencha nome, e-mail e senha.'); setLoading(false); return; }
      if (form.password.length < 6) { setError('A senha deve ter ao menos 6 caracteres.'); setLoading(false); return; }
      const r = await signUp(form);
      if (r.error) setError(r.error);
      else if (r.needsConfirm) setInfo('Conta criada! Verifique seu e-mail para confirmar.');
      else navigate('/app');
    } else {
      const r = await signIn(form.email, form.password);
      if (r.error) setError(r.error); else navigate('/app');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-white">
      {/* lado visual */}
      <div className="relative hidden lg:flex flex-col justify-between p-12 overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-800 text-white">
        <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)', backgroundSize: '22px 22px' }} />

        <div className="relative z-10"><Link to="/"><Logo light /></Link></div>

        <div className="relative z-10 flex items-end justify-center">
          <Characters typing={typing} hasPwd={form.password.length > 0} showPwd={show} />
        </div>

        <div className="relative z-10 max-w-sm">
          <h2 className="font-display text-2xl font-bold leading-snug">Seu copiloto financeiro por IA no WhatsApp.</h2>
          <ul className="mt-5 space-y-2.5">
            {PERKS.map((p) => (
              <li key={p} className="flex items-center gap-2.5 text-sm text-white/85">
                <span className="grid place-items-center w-5 h-5 rounded-full bg-white/20"><Check className="w-3 h-3" /></span>{p}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* formulário */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-[400px]">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 mb-8"><ArrowLeft className="w-4 h-4" /> Voltar ao site</Link>
          <div className="lg:hidden mb-8"><Logo /></div>

          <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900">{isSignup ? 'Criar conta' : 'Bem-vindo de volta'}</h1>
          <p className="text-ink-500 text-sm mt-1.5">{isSignup ? 'Comece grátis com 3 dias de teste.' : 'Entre para acessar seu painel.'}</p>

          <div className="grid grid-cols-2 gap-1 p-1 mt-7 mb-6 bg-ink-100 rounded-xl">
            <button type="button" onClick={() => { setMode('login'); setError(''); setInfo(''); }} className={`py-2.5 text-sm font-semibold rounded-lg transition ${!isSignup ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}>Entrar</button>
            <button type="button" onClick={() => { setMode('signup'); setError(''); setInfo(''); }} className={`py-2.5 text-sm font-semibold rounded-lg transition ${isSignup ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}>Criar conta</button>
          </div>

          {error && <div className="mb-5 p-3.5 text-sm rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><span>{error}</span></div>}
          {info && <div className="mb-5 p-3.5 text-sm rounded-xl bg-brand-50 border border-brand-200 text-brand-700 flex items-start gap-2"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" /><span>{info}</span></div>}

          <form onSubmit={submit} className="space-y-4" onFocus={() => setTyping(true)} onBlur={() => setTyping(false)}>
            {isSignup && (<>
              <Field label="Nome completo"><input className="input h-12" placeholder="Seu nome" autoComplete="name" value={form.fullName} onChange={set('fullName')} /></Field>
              <Field label="WhatsApp" hint="opcional"><input className="input h-12" placeholder="(11) 99999-9999" autoComplete="tel" inputMode="tel" value={form.whatsapp} onChange={set('whatsapp')} /></Field>
            </>)}
            <Field label="E-mail"><input type="email" className="input h-12" placeholder="voce@email.com" autoComplete="email" value={form.email} onChange={set('email')} /></Field>
            <Field label="Senha" trailing={isSignup ? undefined : <button type="button" onClick={recover} className="text-xs font-medium text-brand-600 hover:underline">Esqueceu?</button>}>
              <div className="relative">
                <input type={show ? 'text' : 'password'} className="input h-12 pr-11" placeholder="••••••••" autoComplete={isSignup ? 'new-password' : 'current-password'} value={form.password} onChange={set('password')} />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700 transition">{show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}</button>
              </div>
            </Field>
            <button type="submit" disabled={loading} className="btn-primary w-full h-12 text-base">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignup ? 'Criar conta grátis' : 'Entrar')}</button>
          </form>

          <p className="mt-7 text-center text-sm text-ink-500">
            {isSignup ? 'Já tem conta? ' : 'Ainda não tem conta? '}
            <button type="button" onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError(''); setInfo(''); }} className="text-brand-600 font-semibold hover:underline">{isSignup ? 'Entrar' : 'Criar agora'}</button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, trailing, children }: { label: string; hint?: string; trailing?: React.ReactNode; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-ink-700">{label}{hint && <span className="ml-1.5 text-xs font-normal text-ink-400">({hint})</span>}</span>
        {trailing}
      </span>
      {children}
    </label>
  );
}
