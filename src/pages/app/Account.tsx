import { useEffect, useState } from 'react';
import { User, Phone, Mail, Lock, Save, Loader2, CheckCircle2, AlertCircle, MessageCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

export default function Account() {
  const { user } = useAuth();
  const [fullName, setFullName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [savingP, setSavingP] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [msg, setMsg] = useState<{ t: string; m: string } | null>(null);
  const flash = (t: string, m: string) => { setMsg({ t, m }); setTimeout(() => setMsg(null), 3500); };

  useEffect(() => { if (!user) return; supabase.from('profiles').select('*').eq('id', user.id).maybeSingle().then(({ data }) => { setFullName(data?.full_name || ''); setWhatsapp(data?.whatsapp || ''); }); }, [user]);

  const saveProfile = async () => {
    setSavingP(true);
    await supabase.from('profiles').update({ full_name: fullName, whatsapp }).eq('id', user!.id);
    await supabase.auth.updateUser({ data: { full_name: fullName, whatsapp } });
    setSavingP(false); flash('ok', 'Perfil atualizado!');
  };
  const changePw = async () => {
    if (newPw.length < 6) { flash('err', 'A senha deve ter ao menos 6 caracteres.'); return; }
    if (newPw !== confirmPw) { flash('err', 'As senhas não conferem.'); return; }
    setSavingPw(true); const { error } = await supabase.auth.updateUser({ password: newPw }); setSavingPw(false);
    if (error) flash('err', error.message); else { flash('ok', 'Senha alterada!'); setNewPw(''); setConfirmPw(''); }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div><h1 className="font-display text-2xl font-bold">Conta</h1><p className="text-sm text-ink-500">Seus dados, WhatsApp e senha.</p></div>
      {msg && <div className={`flex items-center gap-2 p-3 rounded-xl text-sm ${msg.t === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{msg.t === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}{msg.m}</div>}

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold">Perfil</h2>
        <div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" /><input className="input pl-10" placeholder="Nome" value={fullName} onChange={(e) => setFullName(e.target.value)} /></div>
        <div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" /><input className="input pl-10" placeholder="WhatsApp" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} /></div>
        <div className="relative"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" /><input className="input pl-10 opacity-60" value={user?.email || ''} disabled /></div>
        <button onClick={saveProfile} disabled={savingP} className="btn-primary">{savingP ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Salvar perfil</button>
      </div>

      <div className="card p-6 space-y-4">
        <h2 className="font-semibold flex items-center gap-2"><Lock className="w-4 h-4" /> Alterar senha</h2>
        <input type="password" className="input" placeholder="Nova senha" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
        <input type="password" className="input" placeholder="Confirmar senha" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
        <button onClick={changePw} disabled={savingPw} className="btn-ghost">{savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />} Alterar senha</button>
      </div>

      <div className="card p-6 flex items-center gap-3">
        <span className="grid place-items-center w-10 h-10 rounded-xl bg-brand-50 text-brand-600"><MessageCircle className="w-5 h-5" /></span>
        <div className="flex-1"><p className="font-semibold text-sm">Conectar o WhatsApp</p><p className="text-xs text-ink-500">Registre gastos e lembretes conversando com a Lume.</p></div>
        <a href="https://wa.me/" target="_blank" rel="noreferrer" className="btn-primary py-2 text-xs">Conectar</a>
      </div>
    </div>
  );
}
