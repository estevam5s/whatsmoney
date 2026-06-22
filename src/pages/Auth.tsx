import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, Lock, User, Phone, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import Logo from '../components/Logo';
import { useAuth } from '../contexts/AuthContext';

export default function Auth() {
  const [params] = useSearchParams();
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>(params.get('mode') === 'signup' ? 'signup' : 'login');
  const [form, setForm] = useState({ email: '', password: '', fullName: '', whatsapp: '' });
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const isSignup = mode === 'signup';

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
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* lado visual */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 text-white relative overflow-hidden">
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <Logo light />
        <div className="relative">
          <h2 className="font-display text-3xl font-bold leading-snug max-w-sm">Seu copiloto financeiro por IA no WhatsApp.</h2>
          <p className="mt-3 text-white/75 max-w-sm">Registre gastos, crie lembretes e veja resumos completos só conversando com a Lume.</p>
        </div>
        <p className="relative text-white/60 text-sm">© {new Date().getFullYear()} WhatsMoney</p>
      </div>

      {/* formulário */}
      <div className="flex items-center justify-center p-6 sm:p-10 bg-white">
        <div className="w-full max-w-[400px]">
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-800 mb-8"><ArrowLeft className="w-4 h-4" /> Voltar ao site</Link>
          <div className="lg:hidden mb-8"><Logo /></div>
          <h1 className="font-display text-3xl font-bold">{isSignup ? 'Criar conta' : 'Bem-vindo de volta'}</h1>
          <p className="text-ink-500 text-sm mt-1">{isSignup ? 'Comece grátis com 3 dias de teste.' : 'Entre para acessar seu painel.'}</p>

          <div className="grid grid-cols-2 gap-1 p-1 mt-6 mb-6 bg-ink-100 rounded-xl">
            <button onClick={() => { setMode('login'); setError(''); setInfo(''); }} className={`py-2 text-sm font-medium rounded-lg transition ${!isSignup ? 'bg-white text-brand-600 shadow-sm' : 'text-ink-500'}`}>Entrar</button>
            <button onClick={() => { setMode('signup'); setError(''); setInfo(''); }} className={`py-2 text-sm font-medium rounded-lg transition ${isSignup ? 'bg-white text-brand-600 shadow-sm' : 'text-ink-500'}`}>Criar conta</button>
          </div>

          {error && <div className="mb-5 p-3 text-sm rounded-xl bg-red-50 border border-red-200 text-red-700 flex items-start gap-2"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />{error}</div>}
          {info && <div className="mb-5 p-3 text-sm rounded-xl bg-brand-50 border border-brand-200 text-brand-700 flex items-start gap-2"><CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />{info}</div>}

          <form onSubmit={submit} className="space-y-4">
            {isSignup && (<>
              <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-400" /><input className="input pl-10" placeholder="Seu nome" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
              <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-400" /><input className="input pl-10" placeholder="WhatsApp (opcional)" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></div>
            </>)}
            <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-400" /><input type="email" className="input pl-10" placeholder="seu@email.com" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-ink-400" />
              <input type={show ? 'text' : 'password'} className="input pl-10 pr-10" placeholder="Senha" autoComplete={isSignup ? 'new-password' : 'current-password'} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">{show ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}</button>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isSignup ? 'Criar conta grátis' : 'Entrar')}</button>
          </form>

          <p className="mt-6 text-center text-sm text-ink-500">
            {isSignup ? 'Já tem conta? ' : 'Ainda não tem conta? '}
            <button onClick={() => { setMode(isSignup ? 'login' : 'signup'); setError(''); setInfo(''); }} className="text-brand-600 font-medium hover:underline">{isSignup ? 'Entrar' : 'Criar agora'}</button>
          </p>
        </div>
      </div>
    </div>
  );
}
