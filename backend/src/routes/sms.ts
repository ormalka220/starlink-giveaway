import { Router } from 'express';
import { db } from '../db';
import { authenticate } from '../middleware/auth';
import { isSmsConfigured, sendSmsToAudience } from '../smsService';

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
// GET /api/sms/quota - provider config status
// ---------------------------------------------------------------------------
smsRouter.get('/quota', (_req, res) => {
  if (!isSmsConfigured()) {
    return res.json({ quota: null, provider: 'sms4free', message: 'SMS4FREE is not configured' });
  }
  return res.json({
    quota: null,
    provider: 'sms4free',
    message: 'Check remaining SMS balance at sms4free.co.il',
  });
});
