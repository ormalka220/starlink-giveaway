import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db, toWinner, toParticipant } from '../db';
import { authenticate } from '../middleware/auth';
import { sendSmsToRecipients, WINNER_SMS_TEMPLATE } from '../smsService';

export const winnersRouter = Router();

// All winner routes are admin-only
winnersRouter.use(authenticate);

// ---------------------------------------------------------------------------
// GET /api/winners
// ---------------------------------------------------------------------------
winnersRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM winners ORDER BY wonAt DESC').all() as Record<string, unknown>[];
  return res.json(rows.map(toWinner));
});

// ---------------------------------------------------------------------------
// POST /api/winners  — confirm a winner from the draw
// body: { participantId: string }
// ---------------------------------------------------------------------------
winnersRouter.post('/', async (req, res) => {
  try {
    const { participantId } = req.body as { participantId?: string };
    if (!participantId) {
      return res.status(400).json({ error: 'participantId is required' });
    }

    const existing = db.prepare('SELECT * FROM winners WHERE participantId = ?').get(participantId) as Record<string, unknown> | undefined;
    if (existing) {
      return res.json(toWinner(existing));
    }

    const p = db.prepare('SELECT * FROM participants WHERE id = ?').get(participantId) as Record<string, unknown> | undefined;
    if (!p) {
      return res.status(404).json({ error: 'משתתף לא נמצא' });
    }

    const id = `w_${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO winners
        (id, participantId, fullName, company, phone, email, wonAt,
         confirmed, smsSent, contacted, prizeDelivered)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 0, 0)
    `).run(id, participantId, p.fullName, p.company, p.phone, p.email, now);

    // Mark participant as winner
    db.prepare("UPDATE participants SET raffleStatus = 'זכה' WHERE id = ?").run(participantId);

    try {
      const smsResult = await sendSmsToRecipients({
        content: WINNER_SMS_TEMPLATE,
        audience: String(p.phone),
        recipients: [{ id: participantId, phone: String(p.phone) }],
      });
      db.prepare('UPDATE winners SET smsSent = ? WHERE id = ?').run(smsResult.sent > 0 ? 1 : 0, id);
    } catch (err) {
      console.error('Winner SMS failed:', err);
    }

    const row = db.prepare('SELECT * FROM winners WHERE id = ?').get(id) as Record<string, unknown>;
    return res.status(201).json(toWinner(row));
  } catch (err) {
    console.error('Failed to confirm winner:', err);
    return res.status(500).json({ error: 'שגיאה באישור הזוכה' });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/winners/:id  — update winner details / flags
// ---------------------------------------------------------------------------
winnersRouter.patch('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM winners WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!existing) return res.status(404).json({ error: 'זוכה לא נמצא' });

  const allowedFields = ['confirmed','smsSent','contacted','prizeDelivered','notes'] as const;
  const patch = req.body as Partial<Record<typeof allowedFields[number], unknown>>;

  for (const field of allowedFields) {
    if (field in patch) {
      let val = patch[field];
      // Convert boolean to integer for SQLite
      if (typeof val === 'boolean') val = val ? 1 : 0;
      db.prepare(`UPDATE winners SET ${field} = ? WHERE id = ?`).run(val, id);
    }
  }

  const row = db.prepare('SELECT * FROM winners WHERE id = ?').get(id) as Record<string, unknown>;
  return res.json(toWinner(row));
});

// ---------------------------------------------------------------------------
// DELETE /api/winners/:id  (undo draw result)
// ---------------------------------------------------------------------------
winnersRouter.delete('/:id', (req, res) => {
  const { id } = req.params;
  const winner = db.prepare('SELECT * FROM winners WHERE id = ?').get(id) as Record<string, unknown> | undefined;
  if (!winner) return res.status(404).json({ error: 'זוכה לא נמצא' });

  db.prepare('DELETE FROM winners WHERE id = ?').run(id);
  // Revert participant status back to active
  db.prepare("UPDATE participants SET raffleStatus = 'פעיל' WHERE id = ?").run(winner.participantId);

  return res.json({ ok: true });
});
