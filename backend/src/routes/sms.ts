import { Router } from 'express';
import { db } from '../db';
import { authenticate } from '../middleware/auth';
import { sendSmsToAudience } from '../smsService';

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
// POST /api/sms
// body: { content, audience, recipientsCount?, test? }
// ---------------------------------------------------------------------------
smsRouter.post('/', async (req, res) => {
  const { content, audience, test = false } = req.body as {
    content?: string;
    audience?: string;
    test?: boolean;
  };

  if (!content || !audience) {
    return res.status(400).json({ error: 'content ו-audience הם שדות חובה' });
  }

  const result = await sendSmsToAudience(content, audience, test);
  return res.status(201).json(result);
});

// ---------------------------------------------------------------------------
// GET /api/sms/quota - check remaining Textbelt credits
// ---------------------------------------------------------------------------
smsRouter.get('/quota', async (_req, res) => {
  const apiKey = process.env.TEXTBELT_API_KEY;
  if (!apiKey) return res.json({ quota: null, message: 'TEXTBELT_API_KEY not configured' });

  try {
    const r = await fetch(`https://textbelt.com/quota/${apiKey}`);
    const data = await r.json() as { success: boolean; quotaRemaining: number };
    return res.json({ quota: data.quotaRemaining });
  } catch {
    return res.status(500).json({ error: 'Failed to fetch quota' });
  }
});
