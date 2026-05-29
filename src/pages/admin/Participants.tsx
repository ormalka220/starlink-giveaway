import { useEffect, useMemo, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import { ConfirmModal } from '../../components/Modal';
import type { Participant, InterestArea } from '../../types';

const interests: (InterestArea | 'הכל')[] = ['הכל', 'Forti SASE', 'Perception Point', 'Starlink', 'פתרונות סייבר', 'אחר'];

export default function ParticipantsPage() {
  const { push } = useToast();
  const [items, setItems] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [interest, setInterest] = useState<string>('הכל');
  const [noSmsOnly, setNoSmsOnly] = useState(false);
  const [selected, setSelected] = useState<Participant | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Participant | null>(null);

  function refresh() {
    setLoading(true);
    api.listParticipants().then((d) => { setItems(d); setLoading(false); });
  }
  useEffect(refresh, []);

  const filtered = useMemo(() => {
    return items.filter((p) => {
      if (q && ![p.fullName, p.company, p.phone, p.email].some((s) => s.toLowerCase().includes(q.toLowerCase()))) return false;
      if (interest !== 'הכל' && p.interest !== interest) return false;
      if (noSmsOnly && p.smsStatus === 'נשלח') return false;
      return true;
    });
  }, [items, q, interest, noSmsOnly]);

  function exportCsv() {
    const headers = ['Ticket', 'שם', 'חברה', 'תפקיד', 'טלפון', 'אימייל', 'תחום עניין', 'תאריך'];
    const rows = filtered.map((p) => [p.ticketId, p.fullName, p.company, p.role, p.phone, p.email, p.interest, new Date(p.registeredAt).toLocaleString('he-IL')]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `participants_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
    push('CSV יוצא בהצלחה');
  }

  return (
    <AdminLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex justify-between flex-wrap gap-3 items-end">
          <div>
            <h1 className="text-2xl font-bold">משתתפים</h1>
            <p className="text-sm text-forti-mute">{filtered.length} מתוך {items.length} משתתפים</p>
          </div>
          <button onClick={exportCsv} className="btn-ghost">ייצוא CSV</button>
        </div>

        <div className="glass p-4 grid md:grid-cols-3 gap-3">
          <input className="input md:col-span-2" placeholder="חיפוש לפי שם, חברה, טלפון, אימייל..." value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="input" value={interest} onChange={(e) => setInterest(e.target.value)}>
            {interests.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <label className="flex items-center gap-2 px-3 cursor-pointer md:col-span-3">
            <input type="checkbox" className="w-5 h-5 accent-forti-red" checked={noSmsOnly} onChange={(e) => setNoSmsOnly(e.target.checked)} />
            <span className="text-sm">הצג רק נרשמים שלא קיבלו SMS</span>
          </label>
        </div>

        <div className="glass overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-forti-panel2/60 text-forti-mute text-xs uppercase">
                <tr>
                  {['#', 'שם', 'חברה', 'תפקיד', 'טלפון', 'אימייל', 'תחום עניין', 'תאריך', 'SMS', 'סטטוס', 'פעולות'].map((h) => (
                    <th key={h} className="text-right px-4 py-3 font-semibold">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={11} className="text-center py-10 text-forti-mute">טוען...</td></tr>
                )}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={11} className="text-center py-10 text-forti-mute">לא נמצאו משתתפים</td></tr>
                )}
                {filtered.map((p) => (
                  <tr key={p.id} className="table-row">
                    <td className="px-4 py-3 font-mono text-forti-accent">{p.ticketId}</td>
                    <td className="px-4 py-3 font-medium">{p.fullName}</td>
                    <td className="px-4 py-3">{p.company}</td>
                    <td className="px-4 py-3 text-forti-mute">{p.role}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.phone}</td>
                    <td className="px-4 py-3 text-xs text-forti-mute">{p.email}</td>
                    <td className="px-4 py-3"><span className="chip">{p.interest}</span></td>
                    <td className="px-4 py-3 text-forti-mute text-xs">{new Date(p.registeredAt).toLocaleString('he-IL')}</td>
                    <td className="px-4 py-3"><span className={`chip ${p.smsStatus === 'נשלח' ? 'text-forti-green border-forti-green/40' : p.smsStatus === 'נכשל' ? 'text-forti-red border-forti-red/40' : ''}`}>{p.smsStatus}</span></td>
                    <td className="px-4 py-3"><span className={`chip ${p.raffleStatus === 'זכה' ? 'text-forti-red border-forti-red/40' : p.raffleStatus === 'לא תקין' ? 'text-forti-mute' : 'text-forti-accent border-forti-accent/40'}`}>{p.raffleStatus}</span></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setSelected(p)} className="px-2 py-1 text-xs rounded-md bg-forti-panel2 hover:bg-forti-line">פתח</button>
                        <button onClick={() => setConfirmDelete(p)} className="px-2 py-1 text-xs rounded-md bg-forti-panel2 hover:bg-forti-red/30">מחק</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-40 flex" onClick={() => setSelected(null)}>
          <div className="flex-1 bg-black/60 backdrop-blur-sm" />
          <aside className="w-full max-w-md h-full bg-forti-panel border-l border-forti-line p-6 overflow-y-auto animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-xs text-forti-mute font-mono">{selected.ticketId}</div>
                <h3 className="text-xl font-bold">{selected.fullName}</h3>
                <div className="text-sm text-forti-mute">{selected.role} · {selected.company}</div>
              </div>
              <button onClick={() => setSelected(null)} className="text-2xl text-forti-mute hover:text-forti-ink">×</button>
            </div>

            <div className="space-y-3 text-sm">
              <Row label="טלפון" value={selected.phone} />
              <Row label="אימייל" value={selected.email} />
              <Row label="תחום עניין" value={selected.interest} />
              <Row label="אישור דיוור" value={selected.marketingConsent ? 'כן' : 'לא'} />
              <Row label="תאריך הרשמה" value={new Date(selected.registeredAt).toLocaleString('he-IL')} />
              <Row label="סטטוס SMS" value={selected.smsStatus} />
              <Row label="סטטוס הגרלה" value={selected.raffleStatus} />
            </div>

            <div className="mt-6 space-y-2">
              <button onClick={() => { api.sendSms('הודעה אישית', selected.phone, 1).then(() => push('SMS נשלח למשתתף')); }} className="btn-accent w-full">שלח SMS אישי</button>
              <button onClick={() => { api.markInvalid(selected.id).then(() => { push('המשתתף סומן כלא תקין'); refresh(); setSelected(null); }); }} className="btn-ghost w-full">סמן כלא תקין</button>
              <button onClick={() => { api.markInvalid(selected.id).then(() => { push('הוסר מההגרלה'); refresh(); setSelected(null); }); }} className="btn-ghost w-full">הסר מהגרלה</button>
            </div>

            <div className="mt-6 pt-4 border-t border-forti-line">
              <div className="text-sm font-semibold mb-2">היסטוריית הודעות</div>
              <div className="text-xs text-forti-mute">אין הודעות עדיין</div>
            </div>
          </aside>
        </div>
      )}

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (!confirmDelete) return;
          api.deleteParticipant(confirmDelete.id).then(() => { push('המשתתף נמחק'); refresh(); });
        }}
        title="מחיקת משתתף"
        message={`האם למחוק את ${confirmDelete?.fullName}? לא ניתן לבטל פעולה זו.`}
        confirmLabel="מחק"
        danger
      />
    </AdminLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-2 border-b border-forti-line/60">
      <span className="text-forti-mute">{label}</span>
      <span className="font-medium text-left break-all">{value}</span>
    </div>
  );
}
