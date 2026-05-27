import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { authenticate } from '../middleware/auth';

export const smsRouter = Router();

// All SMS routes are admin-only
smsRouter.use(authenticate);

// ---------------------------------------------------------------------------
// Phone normalization  (Israeli numbers → E.164)
// 050-123-4567  →  +972501234567
// ---------------------------------------------------------------------------
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('972')) return `+${digits}`;
  if (digits.startsWith('0'))   return `+972${digits.slice(1)}`;
  return `+972${digits}`;
}

// ---------------------------------------------------------------------------
// Resolve audience string → list of { id, phone } from DB
// ---------------------------------------------------------------------------
function resolveRecipients(audience: string): { id: string; phone: string }[] {
  // If audience looks like a phone number → single recipient
  if (/^[+0-9()\-\s]{7,15}$/.test(audience.trim())) {
    return [{ id: 'manual', phone: audience.trim() }];
  }

  type Row = { id: string; phone: string };

  switch (audience) {
    case 'כל המשתתפים':
      return db.prepare(
        "SELECT id, phone FROM participants WHERE raffleStatus = 'פעיל'",
      ).all() as Row[];

    case 'לקוחות עסקיים':
      return db.prepare(
        "SELECT id, phone FROM participants WHERE isBusinessCustomer = 1 AND raffleStatus = 'פעיל'",
      ).all() as Row[];

    case 'זוכים': {
      const winners = db.prepare('SELECT participantId FROM winners').all() as { participantId: string }[];
      const ids = winners.map((w) => w.participantId);
      if (!ids.length) return [];
      return db.prepare(
        `SELECT id, phone FROM participants WHERE id IN (${ids.map(() => '?').join(',')})`,
      ).all(...ids) as Row[];
    }

    case 'אישרו דיוור':
      return db.prepare(
        "SELECT id, phone FROM participants WHERE marketingConsent = 1 AND raffleStatus = 'פעיל'",
      ).all() as Row[];

    default:
      // Try matching by interest field (Forti SASE, Starlink, etc.)
      return db.prepare(
        "SELECT id, phone FROM participants WHERE interest = ? AND raffleStatus = 'פעיל'",
      ).all(audience) as Row[];
  }
}

// ---------------------------------------------------------------------------
// Send single SMS via Textbelt
// Appends _test to key when test=true (validates without using quota)
// ---------------------------------------------------------------------------
async function sendViaSMS(
  phone: string,
  message: string,
  apiKey: string,
  test: boolean,
): Promise<{ success: boolean; textId?: string; quotaRemaining?: number; error?: string }> {
  const key = test ? `${apiKey}_test` : apiKey;
  const normalized = normalizePhone(phone);
  const body = new URLSearchParams({ phone: normalized, message, key });

  console.log(`  → Textbelt: phone=${normalized} test=${test}`);

  try {
    const res = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const data = await res.json() as { success: boolean; textId?: string; quotaRemaining?: number; error?: string };
    console.log(`  ← Textbelt response:`, JSON.stringify(data));
    return data;
  } catch (err) {
    console.error(`  ← Textbelt fetch error:`, err);
    return { success: false, error: String(err) };
  }
}

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

  const apiKey = process.env.TEXTBELT_API_KEY;

  // ── Resolve recipients ───────────────────────────────────────────────────
  const recipients = resolveRecipients(audience);

  if (!apiKey) {
    // No API key → save to DB as mock (dev / demo mode)
    console.warn('⚠️  TEXTBELT_API_KEY not set — saving SMS record without sending');
    const id   = `s_${uuidv4().slice(0, 8)}`;
    const now  = new Date().toISOString();
    db.prepare(`
      INSERT INTO sms_messages (id, audience, content, recipientsCount, sentAt, status)
      VALUES (?, ?, ?, ?, ?, 'נשלח')
    `).run(id, audience, content, recipients.length, now);

    return res.status(201).json(
      db.prepare('SELECT * FROM sms_messages WHERE id = ?').get(id),
    );
  }

  // ── Check quota before sending ──────────────────────────────────────────
  try {
    const quotaRes = await fetch(`https://textbelt.com/quota/${apiKey}`);
    const quotaData = await quotaRes.json() as { success: boolean; quotaRemaining: number };
    console.log(`💳 Textbelt quota remaining: ${quotaData.quotaRemaining}`);
    if (quotaData.quotaRemaining <= 0) {
      return res.status(402).json({ error: 'אין קרדיטים ב-Textbelt. יש לרכוש קרדיטים.' });
    }
  } catch { /* quota check failed — continue anyway */ }

  // ── Real sending via Textbelt ────────────────────────────────────────────
  console.log(`📱 Sending SMS to ${recipients.length} recipient(s) [test=${test}]`);

  let sent   = 0;
  let failed = 0;
  const textIds: string[] = [];

  // Send in small batches of 5 to avoid flooding
  const BATCH = 5;
  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH);
    const results = await Promise.all(
      batch.map((r) => sendViaSMS(r.phone, content, apiKey, test)),
    );

    results.forEach((result, idx) => {
      const recipient = batch[idx];
      if (result.success) {
        sent++;
        if (result.textId) textIds.push(result.textId);
        if (recipient.id !== 'manual') {
          db.prepare("UPDATE participants SET smsStatus = 'נשלח' WHERE id = ?").run(recipient.id);
        }
      } else {
        failed++;
        console.error(`❌ SMS failed to ${recipient.phone}: ${result.error}`);
        if (recipient.id !== 'manual') {
          db.prepare("UPDATE participants SET smsStatus = 'נכשל' WHERE id = ?").run(recipient.id);
        }
      }
    });

    // Brief pause between batches
    if (i + BATCH < recipients.length) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  const status = failed === 0 ? 'נשלח' : sent === 0 ? 'נכשל' : 'נשלח חלקית';
  const id  = `s_${uuidv4().slice(0, 8)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO sms_messages (id, audience, content, recipientsCount, sentAt, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, audience, content, sent, now, status);

  const row = db.prepare('SELECT * FROM sms_messages WHERE id = ?').get(id);

  console.log(`✅ SMS batch done: ${sent} sent, ${failed} failed | textIds: ${textIds.join(',')}`);
  return res.status(201).json({ ...(row as object), sent, failed, textIds });
});

// ---------------------------------------------------------------------------
// GET /api/sms/quota  — check remaining Textbelt credits
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
