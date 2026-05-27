import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { authenticate } from '../middleware/auth';

export const smsRouter = Router();

// All SMS routes are admin-only
smsRouter.use(authenticate);

// ---------------------------------------------------------------------------
// GET /api/sms
// ---------------------------------------------------------------------------
smsRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM sms_messages ORDER BY sentAt DESC').all();
  return res.json(rows);
});

// ---------------------------------------------------------------------------
// POST /api/sms  — send (or simulate sending) a bulk SMS
// body: { content, audience, recipientsCount }
// ---------------------------------------------------------------------------
smsRouter.post('/', (req, res) => {
  const { content, audience, recipientsCount } = req.body as {
    content?: string;
    audience?: string;
    recipientsCount?: number;
  };

  if (!content || !audience) {
    return res.status(400).json({ error: 'content ו-audience הם שדות חובה' });
  }

  const id = `s_${uuidv4().slice(0, 8)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO sms_messages (id, audience, content, recipientsCount, sentAt, status)
    VALUES (?, ?, ?, ?, ?, 'נשלח')
  `).run(id, audience, content, recipientsCount ?? 0, now);

  const row = db.prepare('SELECT * FROM sms_messages WHERE id = ?').get(id);
  return res.status(201).json(row);
});
