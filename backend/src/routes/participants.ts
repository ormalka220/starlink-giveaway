import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, toParticipant } from '../db';
import { authenticate } from '../middleware/auth';

export const participantsRouter = Router();

// ---------------------------------------------------------------------------
// GET /api/participants  (admin only)
// ---------------------------------------------------------------------------
participantsRouter.get('/', authenticate, (_req, res) => {
  const rows = db.prepare('SELECT * FROM participants ORDER BY registeredAt DESC').all() as Record<string, unknown>[];
  return res.json(rows.map(toParticipant));
});

// ---------------------------------------------------------------------------
// GET /api/participants/eligible  (admin only – for the draw)
// ---------------------------------------------------------------------------
participantsRouter.get('/eligible', authenticate, (_req, res) => {
  const rows = db.prepare("SELECT * FROM participants WHERE raffleStatus = 'פעיל'").all() as Record<string, unknown>[];
  return res.json(rows.map(toParticipant));
});

// ---------------------------------------------------------------------------
// POST /api/participants  (public – registration form)
// ---------------------------------------------------------------------------
participantsRouter.post('/', (req, res) => {
  const { fullName, company, role, phone, email, isBusinessCustomer, interest, marketingConsent, source } = req.body as {
    fullName?: string;
    company?: string;
    role?: string;
    phone?: string;
    email?: string;
    isBusinessCustomer?: boolean;
    interest?: string;
    marketingConsent?: boolean;
    source?: string;
  };

  if (!fullName || !phone || !email) {
    return res.status(400).json({ error: 'שם, טלפון ואימייל הם שדות חובה' });
  }

  // Fetch settings for duplicate checks
  const settingsRow = db.prepare("SELECT value FROM settings WHERE key = 'all'").get() as { value: string } | undefined;
  const settings = settingsRow ? JSON.parse(settingsRow.value) : {};

  if (settings.preventDuplicatePhone) {
    const exists = db.prepare('SELECT id FROM participants WHERE phone = ?').get(phone.trim());
    if (exists) {
      return res.status(409).json({ error: 'מספר הטלפון כבר רשום להגרלה' });
    }
  }

  if (settings.preventDuplicateEmail) {
    const exists = db.prepare('SELECT id FROM participants WHERE email = ?').get(email.trim().toLowerCase());
    if (exists) {
      return res.status(409).json({ error: 'כתובת האימייל כבר רשומה להגרלה' });
    }
  }

  // Check registration is open
  if (settings.registrationOpen === false) {
    return res.status(403).json({ error: 'ההרשמה להגרלה סגורה כרגע' });
  }

  // Generate unique IDs
  const id = `p_${uuidv4().slice(0, 8)}`;
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM participants').get() as { cnt: number };
  const ticketId = `FT-${String(2000 + countRow.cnt)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO participants
      (id, ticketId, fullName, company, role, phone, email,
       isBusinessCustomer, interest, marketingConsent, source, registeredAt, smsStatus, raffleStatus)
    VALUES
      (@id, @ticketId, @fullName, @company, @role, @phone, @email,
       @isBusinessCustomer, @interest, @marketingConsent, @source, @registeredAt, @smsStatus, @raffleStatus)
  `).run({
    id,
    ticketId,
    fullName: fullName.trim(),
    company: (company || '').trim(),
    role: (role || '').trim(),
    phone: phone.trim(),
    email: email.trim().toLowerCase(),
    isBusinessCustomer: isBusinessCustomer ? 1 : 0,
    interest: interest || 'אחר',
    marketingConsent: marketingConsent ? 1 : 0,
    source: source || 'web',
    registeredAt: now,
    smsStatus: 'ממתין',
    raffleStatus: 'פעיל',
  });

  const row = db.prepare('SELECT * FROM participants WHERE id = ?').get(id) as Record<string, unknown>;
  return res.status(201).json(toParticipant(row));
});

// ---------------------------------------------------------------------------
// DELETE /api/participants/:id  (admin only)
// ---------------------------------------------------------------------------
participantsRouter.delete('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  const result = db.prepare('DELETE FROM participants WHERE id = ?').run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'משתתף לא נמצא' });
  }
  return res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// PATCH /api/participants/:id/invalid  (admin only)
// ---------------------------------------------------------------------------
participantsRouter.patch('/:id/invalid', authenticate, (req, res) => {
  const { id } = req.params;
  const result = db.prepare("UPDATE participants SET raffleStatus = 'לא תקין' WHERE id = ?").run(id);
  if (result.changes === 0) {
    return res.status(404).json({ error: 'משתתף לא נמצא' });
  }
  const row = db.prepare('SELECT * FROM participants WHERE id = ?').get(id) as Record<string, unknown>;
  return res.json(toParticipant(row));
});

// ---------------------------------------------------------------------------
// PATCH /api/participants/:id/status  (admin only – general status update)
// ---------------------------------------------------------------------------
participantsRouter.patch('/:id/status', authenticate, (req, res) => {
  const { id } = req.params;
  const { raffleStatus, smsStatus } = req.body as { raffleStatus?: string; smsStatus?: string };

  if (raffleStatus) {
    db.prepare('UPDATE participants SET raffleStatus = ? WHERE id = ?').run(raffleStatus, id);
  }
  if (smsStatus) {
    db.prepare('UPDATE participants SET smsStatus = ? WHERE id = ?').run(smsStatus, id);
  }

  const row = db.prepare('SELECT * FROM participants WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!row) return res.status(404).json({ error: 'משתתף לא נמצא' });
  return res.json(toParticipant(row));
});
