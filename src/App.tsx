import { useState, useEffect, lazy, Suspense } from 'react';
import { AuthGate } from './components/AuthGate';
import { authService } from './services/authService';
import { ShieldAlert } from 'lucide-react';

const AuthenticatedDashboard = lazy(() =>
  import('./components/AuthenticatedDashboard').then((m) => ({ default: m.AuthenticatedDashboard }))
);

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // Validate active session token on startup
  useEffect(() => {
    let mounted = true;
    authService.validateCurrentSession().then((res) => {
      if (mounted) {
        if (res.authenticated && res.email) {
          setIsAuthenticated(true);
          setAdminEmail(res.email);
        } else {
          setIsAuthenticated(false);
          setAdminEmail('');
        }
        setIsAuthChecking(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setAdminEmail('');
  };

  if (isAuthChecking) {
    return (
      <div className="h-screen w-screen bg-[#F2F4F8] flex items-center justify-center font-['Plus_Jakarta_Sans',sans-serif]">
        <div className="flex flex-col items-center gap-3">
          <div className="size-12 rounded-[16px] bg-[#0066FF] flex items-center justify-center text-white shadow-lg shadow-blue-500/25 animate-pulse">
            <ShieldAlert className="size-6 stroke-[2.2]" />
          </div>
          <div className="text-xs font-bold text-[#64748B]">Verifying Cryptographic Session Vault...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <AuthGate
        onAuthenticated={(email) => {
          setAdminEmail(email);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen bg-[#F2F4F8] flex items-center justify-center font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="flex flex-col items-center gap-3">
            <div className="size-12 rounded-[16px] bg-[#0066FF] flex items-center justify-center text-white shadow-lg shadow-blue-500/25 animate-pulse">
              <ShieldAlert className="size-6 stroke-[2.2]" />
            </div>
            <div className="text-xs font-bold text-[#64748B]">Loading Authenticated Environment...</div>
          </div>
        </div>
      }
    >
      <AuthenticatedDashboard adminEmail={adminEmail} onLogout={handleLogout} />
    </Suspense>
  );
}

export default App;
