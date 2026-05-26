import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import type { RaffleSettings } from '../../types';

export default function SettingsPage() {
  const { push } = useToast();
  const [s, setS] = useState<RaffleSettings | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { api.getSettings().then(setS); }, []);
  if (!s) return <AdminLayout><div className="text-forti-mute">טוען...</div></AdminLayout>;

  const upd = (patch: Partial<RaffleSettings>) => setS({ ...s, ...patch });

  async function save() {
    setSaving(true);
    await api.updateSettings(s!);
    setSaving(false);
    push('ההגדרות נשמרו');
  }

  return (
    <AdminLayout>
      <div className="space-y-5 max-w-4xl animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">הגדרות מערכת</h1>
          <p className="text-sm text-forti-mute">ניהול ההגרלה והאירוע</p>
        </div>

        <div className="glass p-6 space-y-4">
          <h3 className="card-title">פרטי האירוע</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">שם האירוע</label>
              <input className="input" value={s.eventName} onChange={(e) => upd({ eventName: e.target.value })} />
            </div>
            <div>
              <label className="label">מספר זוכים</label>
              <input type="number" min={1} className="input" value={s.winnersCount} onChange={(e) => upd({ winnersCount: +e.target.value })} />
            </div>
            <div>
              <label className="label">סטטוס הרשמה</label>
              <div className="flex gap-2">
                {[{ k: true, v: 'פתוחה' }, { k: false, v: 'סגורה' }].map((o) => (
                  <button key={o.v} onClick={() => upd({ registrationOpen: o.k })} className={`flex-1 px-4 py-3 rounded-xl border font-medium ${s.registrationOpen === o.k ? (o.k ? 'border-forti-green bg-forti-green/15' : 'border-forti-red bg-forti-red/15') : 'border-forti-line bg-forti-panel2'}`}>{o.v}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">צבע ראשי</label>
              <div className="flex gap-3 items-center">
                <input type="color" value={s.primaryColor} onChange={(e) => upd({ primaryColor: e.target.value })} className="w-14 h-12 rounded-lg bg-forti-panel2 border border-forti-line cursor-pointer" />
                <input className="input flex-1" value={s.primaryColor} onChange={(e) => upd({ primaryColor: e.target.value })} />
              </div>
            </div>
          </div>
        </div>

        <div className="glass p-6 space-y-4">
          <h3 className="card-title">חוקי הרשמה</h3>
          <Toggle label="מנע הרשמה כפולה לפי טלפון" value={s.preventDuplicatePhone} onChange={(v) => upd({ preventDuplicatePhone: v })} />
          <Toggle label="מנע הרשמה כפולה לפי אימייל" value={s.preventDuplicateEmail} onChange={(v) => upd({ preventDuplicateEmail: v })} />
        </div>

        <div className="glass p-6 space-y-4">
          <h3 className="card-title">הודעות אוטומטיות</h3>
          <Toggle label="הפעל SMS אוטומטי לאחר הרשמה" value={s.autoSmsEnabled} onChange={(v) => upd({ autoSmsEnabled: v })} />
          <div>
            <label className="label">תבנית SMS אוטומטית</label>
            <textarea className="input min-h-[100px]" value={s.autoSmsTemplate} onChange={(e) => upd({ autoSmsTemplate: e.target.value })} />
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            <ToggleCard label="SMS לזוכה" desc="נשלח אוטומטית עם בחירת הזוכה" defaultOn />
            <ToggleCard label="תזכורת לפני הגרלה" desc="15 דקות לפני תחילת ההגרלה" defaultOn />
            <ToggleCard label="הודעה לכל המשתתפים" desc="אחרי סיום ההגרלה" defaultOn={false} />
          </div>
        </div>

        <div className="glass p-6 space-y-4">
          <h3 className="card-title">תקנון</h3>
          <textarea className="input min-h-[120px]" value={s.termsText} onChange={(e) => upd({ termsText: e.target.value })} />
        </div>

        <div className="glass p-6 grid md:grid-cols-2 gap-4">
          <div>
            <label className="label">לוגו SpotNet</label>
            <div className="border border-dashed border-forti-line rounded-xl p-6 text-center text-forti-mute text-sm">העלאת לוגו · placeholder</div>
          </div>
          <div>
            <label className="label">לוגו Fortinet</label>
            <div className="border border-dashed border-forti-line rounded-xl p-6 text-center text-forti-mute text-sm">העלאת לוגו · placeholder</div>
          </div>
        </div>

        <div className="sticky bottom-0 py-3 flex justify-start">
          <button disabled={saving} onClick={save} className="btn-primary px-8">{saving ? 'שומר...' : 'שמור שינויים'}</button>
        </div>
      </div>
    </AdminLayout>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center justify-between glass-2 px-4 py-3 cursor-pointer">
      <span>{label}</span>
      <button type="button" onClick={() => onChange(!value)} className={`w-12 h-7 rounded-full border transition relative ${value ? 'bg-forti-red/30 border-forti-red' : 'bg-forti-panel border-forti-line'}`}>
        <span className={`absolute top-0.5 w-6 h-6 rounded-full bg-white transition-all ${value ? 'right-0.5' : 'right-[22px]'}`} />
      </button>
    </label>
  );
}

function ToggleCard({ label, desc, defaultOn }: { label: string; desc: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="glass-2 p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          <div className="font-semibold">{label}</div>
          <div className="text-xs text-forti-mute mt-0.5">{desc}</div>
        </div>
        <button onClick={() => setOn(!on)} className={`w-11 h-6 rounded-full border relative transition ${on ? 'bg-forti-green/30 border-forti-green' : 'bg-forti-panel border-forti-line'}`}>
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${on ? 'right-0.5' : 'right-[20px]'}`} />
        </button>
      </div>
    </div>
  );
}
