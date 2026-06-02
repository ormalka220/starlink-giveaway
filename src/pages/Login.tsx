import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/Brand';
import { authApi } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail]       = useState('admin@spotnet.co.il');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token } = await authApi.login(email, password);
      localStorage.setItem('auth', token);
      navigate('/admin');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'שגיאת התחברות');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-full grid place-items-center px-4 py-16 relative overflow-hidden">
      <div className="ambient-orange" style={{ top: '-200px', left: '50%', transform: 'translateX(-50%)' }} />
      <div className="relative w-full max-w-md animate-fade-in">
        <div className="flex justify-center mb-8"><BrandMark size={44} /></div>
        <form onSubmit={onSubmit} className="glass p-8 md:p-10">
          <h1
            className="text-3xl font-semibold mb-1 headline-gradient-h"
            style={{ letterSpacing: '-0.02em' }}
          >
            התחברות
          </h1>
          <p className="text-sm mb-7" style={{ color: 'rgba(255,255,255,0.55)' }}>כניסה לפאנל הניהול</p>

          {error && (
            <div
              className="mb-4 p-3 rounded-xl text-sm"
              style={{
                background: 'rgba(239,68,68,0.10)',
                border: '1px solid rgba(239,68,68,0.35)',
                color: '#FCA5A5',
              }}
            >
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="label">אימייל</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">סיסמה</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            disabled={loading}
            className="btn-primary w-full mt-7"
          >
            {loading ? 'מתחבר...' : 'התחברות'}
          </button>
          <p className="mt-5 text-xs text-center" style={{ color: 'rgba(255,255,255,0.45)' }}>
            גישה למורשים בלבד · SpotNet
          </p>
        </form>
      </div>
    </div>
  );
}
