import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/app/Dashboard';
import Transactions from './pages/app/Transactions';
import Reminders from './pages/app/Reminders';
import Goals from './pages/app/Goals';
import Billing from './pages/app/Billing';
import Account from './pages/app/Account';
import Admin from './pages/app/Admin';

function Loader() { return <div className="min-h-screen grid place-items-center bg-ink-50"><div className="w-10 h-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>; }

function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  if (!user) return <Navigate to="/entrar" replace />;
  return <>{children}</>;
}
function AuthGate() {
  const { user, loading } = useAuth();
  if (loading) return <Loader />;
  return user ? <Navigate to="/app" replace /> : <Auth />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/precos" element={<Landing />} />
          <Route path="/contato" element={<Landing />} />
          <Route path="/entrar" element={<AuthGate />} />
          <Route path="/login" element={<Navigate to="/entrar" replace />} />
          <Route path="/app" element={<Protected><AppLayout /></Protected>}>
            <Route index element={<Dashboard />} />
            <Route path="transacoes" element={<Transactions />} />
            <Route path="lembretes" element={<Reminders />} />
            <Route path="metas" element={<Goals />} />
            <Route path="billing" element={<Billing />} />
            <Route path="conta" element={<Account />} />
            <Route path="admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
