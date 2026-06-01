import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, toParticipant } from '../db';
import { authenticate } from '../middleware/auth';
import { sendSmsToRecipients, formatRegistrationSms } from '../smsService';

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
  const rows = db.prepare("SELECT * FROM participants WHERE raffleStatus = 'פעיל' ORDER BY ticketId ASC").all() as Record<string, unknown>[];
  return res.json(rows.map(toParticipant));
});

// ---------------------------------------------------------------------------
// POST /api/participants  (public – registration form)
// ---------------------------------------------------------------------------
participantsRouter.post('/', async (req, res) => {
  try {
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
        return res.status(409).json({ error: 'לא ניתן להירשם שוב עם אותו מייל/פלאפון' });
      }
    }

    if (settings.preventDuplicateEmail) {
      const exists = db.prepare('SELECT id FROM participants WHERE email = ?').get(email.trim().toLowerCase());
      if (exists) {
        return res.status(409).json({ error: 'לא ניתן להירשם שוב עם אותו מייל/פלאפון' });
      }
    }

    // Check registration is open
    if (settings.registrationOpen === false) {
      return res.status(403).json({ error: 'ההרשמה להגרלה סגורה כרגע' });
    }

    // Generate unique IDs
    const id = `p_${uuidv4().slice(0, 8)}`;
    const countRow = db.prepare('SELECT COUNT(*) as cnt FROM participants').get() as { cnt: number };
    const ticketId = `SPT-${String(2000 + countRow.cnt)}`;
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
      interest: String(interest || 'אחר').trim().slice(0, 50),
      marketingConsent: marketingConsent ? 1 : 0,
      source: source || 'web',
      registeredAt: now,
      smsStatus: 'ממתין',
      raffleStatus: 'פעיל',
    });

    if (settings.autoSmsEnabled !== false && settings.autoSmsTemplate) {
      try {
        await sendSmsToRecipients({
          content: formatRegistrationSms(String(settings.autoSmsTemplate), {
            ticketId,
            fullName: fullName.trim(),
          }),
          audience: phone.trim(),
          recipients: [{ id, phone: phone.trim() }],
        });
      } catch (err) {
        console.error('Registration SMS failed:', err);
        db.prepare("UPDATE participants SET smsStatus = 'נכשל' WHERE id = ?").run(id);
      }
    } else {
      db.prepare("UPDATE participants SET smsStatus = 'לא נשלח' WHERE id = ?").run(id);
    }

    const row = db.prepare('SELECT * FROM participants WHERE id = ?').get(id) as Record<string, unknown>;
    return res.status(201).json(toParticipant(row));
  } catch (err) {
    console.error('Failed to register participant:', err);
    return res.status(500).json({ error: 'שגיאה בהרשמה להגרלה' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/participants/bulk-delete  (admin only)
// ---------------------------------------------------------------------------
participantsRouter.post('/bulk-delete', authenticate, (req, res) => {
  const { ids } = req.body as { ids?: unknown };
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: 'לא נבחרו משתתפים למחיקה' });
  }

  const unique = [...new Set(ids.filter((id): id is string => typeof id === 'string' && id.length > 0))];
  if (unique.length === 0) {
    return res.status(400).json({ error: 'לא נבחרו משתתפים למחיקה' });
  }

  const deleteWinners = db.prepare('DELETE FROM winners WHERE participantId = ?');
  const deleteParticipant = db.prepare('DELETE FROM participants WHERE id = ?');

  const run = db.transaction((participantIds: string[]) => {
    let deleted = 0;
    for (const id of participantIds) {
      deleteWinners.run(id);
      const result = deleteParticipant.run(id);
      if (result.changes > 0) deleted += 1;
    }
    return deleted;
  });

  const deleted = run(unique);
  return res.json({ ok: true, deleted });
});

// ---------------------------------------------------------------------------
// DELETE /api/participants/:id  (admin only)
// ---------------------------------------------------------------------------
participantsRouter.delete('/:id', authenticate, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM winners WHERE participantId = ?').run(id);
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
