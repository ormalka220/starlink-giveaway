import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { api } from '../../services/api';
import { smsTemplates } from '../../data/mock';
import { useToast } from '../../components/Toast';
import type { SmsMessage } from '../../types';

const tabs = ['הודעה לכל המשתתפים', 'הודעה לפי סינון', 'הודעה אישית', 'תבניות הודעה', 'היסטוריית שליחה'] as const;
type Tab = typeof tabs[number];

export default function Messages() {
  const { push } = useToast();
  const [tab, setTab] = useState<Tab>(tabs[0]);
  const [content, setContent] = useState(smsTemplates[0]);
  const [audience, setAudience] = useState('כל המשתתפים');
  const [recipients, setRecipients] = useState(42);
  const [filter, setFilter] = useState('הכל');
  const [phone, setPhone] = useState('');
  const [history, setHistory] = useState<SmsMessage[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => { api.listSms().then(setHistory); }, []);

  async function send(test = false) {
    if (!content.trim()) { push('יש להזין תוכן הודעה', 'error'); return; }
    setSending(true);
    const finalAudience = tab === 'הודעה אישית' ? phone : audience;
    const finalCount = test ? 1 : tab === 'הודעה אישית' ? 1 : recipients;
    await api.sendSms(content, finalAudience, finalCount);
    setSending(false);
    push(test ? 'הודעת בדיקה נשלחה' : `ההודעה נשלחה ל-${finalCount} נמענים`);
    api.listSms().then(setHistory);
  }

  return (
    <AdminLayout>
      <div className="space-y-5 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold">שליחת הודעות SMS</h1>
          <p className="text-sm text-forti-mute">שליחה מרוכזת, מסוננת, אישית ותבניות</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl border transition ${t === tab ? 'border-forti-red bg-forti-red/15' : 'border-forti-line bg-forti-panel hover:bg-forti-panel2'}`}>
              {t}
            </button>
          ))}
        </div>

        {tab !== 'תבניות הודעה' && tab !== 'היסטוריית שליחה' && (
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="glass p-5 lg:col-span-2">
              <label className="label">תוכן הודעה</label>
              <textarea className="input min-h-[160px] resize-none" maxLength={480} value={content} onChange={(e) => setContent(e.target.value)} />
              <div className="flex justify-between items-center mt-3 text-xs text-forti-mute">
                <span>{content.length} / 480 תווים</span>
                <span>~{Math.ceil(content.length / 70)} מקטעי SMS</span>
              </div>
              <div className="flex gap-2 mt-4">
                <button disabled={sending} onClick={() => send(false)} className="btn-primary">{sending ? 'שולח...' : 'שלח הודעה'}</button>
                <button disabled={sending} onClick={() => send(true)} className="btn-ghost">שלח בדיקה</button>
              </div>
            </div>

            <div className="glass p-5">
              <h4 className="font-semibold mb-3">קהל יעד</h4>
              {tab === 'הודעה לכל המשתתפים' && (
                <>
                  <div className="text-sm text-forti-mute mb-2">כל המשתתפים הפעילים</div>
                  <div className="text-3xl font-extrabold text-forti-accent">{recipients}</div>
                  <div className="text-xs text-forti-mute mt-1">נמענים משוערים</div>
                </>
              )}
              {tab === 'הודעה לפי סינון' && (
                <>
                  <label className="label">סינון</label>
                  <select className="input" value={filter} onChange={(e) => { setFilter(e.target.value); setAudience(e.target.value); setRecipients(e.target.value === 'לקוחות עסקיים' ? 28 : 14); }}>
                    <option>הכל</option><option>לקוחות עסקיים</option><option>Forti SASE</option><option>Starlink</option><option>Perception Point</option>
                  </select>
                  <div className="mt-4 text-3xl font-extrabold text-forti-accent">{recipients}</div>
                  <div className="text-xs text-forti-mute">נמענים משוערים</div>
                </>
              )}
              {tab === 'הודעה אישית' && (
                <>
                  <label className="label">מספר טלפון</label>
                  <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="050-0000000" />
                </>
              )}
            </div>
          </div>
        )}

        {tab === 'תבניות הודעה' && (
          <div className="grid md:grid-cols-3 gap-4">
            {smsTemplates.map((t, i) => (
              <div key={i} className="glass p-5">
                <div className="text-xs text-forti-mute mb-2">תבנית {i + 1}</div>
                <p className="text-sm leading-relaxed min-h-[96px]">{t}</p>
                <button className="btn-ghost mt-4 w-full" onClick={() => { setContent(t); setTab('הודעה לכל המשתתפים'); push('התבנית נטענה'); }}>
                  השתמש בתבנית
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'היסטוריית שליחה' && (
          <div className="glass overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-forti-panel2/60 text-xs text-forti-mute uppercase">
                <tr>{['תאריך', 'קהל יעד', 'תוכן', 'נמענים', 'סטטוס'].map((h) => <th key={h} className="text-right px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody>
                {history.map((m) => (
                  <tr key={m.id} className="table-row">
                    <td className="px-4 py-3 text-xs text-forti-mute">{new Date(m.sentAt).toLocaleString('he-IL')}</td>
                    <td className="px-4 py-3">{m.audience}</td>
                    <td className="px-4 py-3 text-forti-mute max-w-xl truncate">{m.content}</td>
                    <td className="px-4 py-3 font-mono">{m.recipientsCount}</td>
                    <td className="px-4 py-3"><span className="chip text-forti-green border-forti-green/40">{m.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
