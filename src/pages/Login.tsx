import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/Brand';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('admin@spotnet.co.il');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('auth', '1');
      navigate('/admin');
    }, 500);
  }

  return (
    <div className="min-h-full grid place-items-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-cyber [background-size:48px_48px] opacity-30" />
      <div className="relative w-full max-w-md animate-fade-in">
        <div className="flex justify-center mb-6"><BrandMark size={40} /></div>
        <form onSubmit={onSubmit} className="glass p-8">
          <h1 className="text-2xl font-bold mb-1">התחברות</h1>
          <p className="text-forti-mute text-sm mb-6">כניסה לפאנל הניהול</p>
          <div className="space-y-4">
            <div>
              <label className="label">אימייל</label>
              <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="label">סיסמה</label>
              <input type="password" className="input" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
            </div>
          </div>
          <button disabled={loading} className="btn-primary w-full mt-6 py-3 disabled:opacity-60">
            {loading ? 'מתחבר...' : 'התחברות'}
          </button>
          <p className="mt-4 text-xs text-forti-mute text-center">גישה למורשים בלבד · SpotNet</p>
        </form>
      </div>
    </div>
  );
}
