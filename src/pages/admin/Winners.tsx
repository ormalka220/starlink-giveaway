import { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';
import type { Winner } from '../../types';

export default function WinnersPage() {
  const { push } = useToast();
  const [winners, setWinners] = useState<Winner[]>([]);

  function refresh() { api.listWinners().then(setWinners); }
  useEffect(refresh, []);

  function update(id: string, patch: Partial<Winner>, msg: string) {
    api.updateWinner(id, patch).then(() => { push(msg); refresh(); });
  }

  function exportCsv() {
    const rows = [['שם', 'חברה', 'טלפון', 'אימייל', 'תאריך', 'אישור', 'SMS', 'נמסר']];
    winners.forEach((w) => rows.push([w.fullName, w.company, w.phone, w.email, new Date(w.wonAt).toLocaleString('he-IL'), w.confirmed ? 'כן' : 'לא', w.smsSent ? 'כן' : 'לא', w.prizeDelivered ? 'כן' : 'לא']));
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    a.download = `winners_${Date.now()}.csv`; a.click();
  }

  return (
    <AdminLayout>
      <div className="space-y-5 animate-fade-in">
        <div className="flex justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">זוכים</h1>
            <p className="text-sm text-forti-mute">{winners.length} זוכים</p>
          </div>
          <button onClick={exportCsv} className="btn-ghost">ייצוא CSV</button>
        </div>

        {winners.length === 0 ? (
          <div className="glass p-12 text-center text-forti-mute">
            עדיין אין זוכים. הריצו הגרלה כדי לבחור זוכה.
          </div>
        ) : (
          <div className="glass overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-forti-panel2/60 text-xs text-forti-mute uppercase">
                <tr>{['שם', 'חברה', 'טלפון', 'אימייל', 'תאריך', 'אישור', 'SMS', 'הערות', 'פעולות'].map((h) => <th key={h} className="text-right px-4 py-3">{h}</th>)}</tr>
              </thead>
              <tbody>
                {winners.map((w) => (
                  <tr key={w.id} className="table-row">
                    <td className="px-4 py-3 font-semibold">{w.fullName}</td>
                    <td className="px-4 py-3">{w.company}</td>
                    <td className="px-4 py-3 font-mono text-xs">{w.phone}</td>
                    <td className="px-4 py-3 text-xs text-forti-mute">{w.email}</td>
                    <td className="px-4 py-3 text-xs">{new Date(w.wonAt).toLocaleString('he-IL')}</td>
                    <td className="px-4 py-3"><span className={`chip ${w.confirmed ? 'text-forti-green border-forti-green/40' : ''}`}>{w.confirmed ? 'מאושר' : 'ממתין'}</span></td>
                    <td className="px-4 py-3"><span className={`chip ${w.smsSent ? 'text-forti-green border-forti-green/40' : ''}`}>{w.smsSent ? 'נשלח' : 'לא נשלח'}</span></td>
                    <td className="px-4 py-3 text-xs text-forti-mute max-w-[12rem] truncate">{w.notes ?? '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        <button onClick={() => update(w.id, { smsSent: true }, 'SMS נשלח')} className="px-2 py-1 text-xs rounded-md bg-forti-panel2 hover:bg-forti-line">שלח SMS</button>
                        <button onClick={() => update(w.id, { contacted: true }, 'סומן כיצר קשר')} className="px-2 py-1 text-xs rounded-md bg-forti-panel2 hover:bg-forti-line">יצר קשר</button>
                        <button onClick={() => update(w.id, { prizeDelivered: true }, 'הפרס סומן כנמסר')} className="px-2 py-1 text-xs rounded-md bg-forti-panel2 hover:bg-forti-green/30">פרס נמסר</button>
                        <button onClick={() => update(w.id, { confirmed: false }, 'הזכייה בוטלה')} className="px-2 py-1 text-xs rounded-md bg-forti-panel2 hover:bg-forti-red/30">בטל</button>
                      </div>
                    </td>
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
