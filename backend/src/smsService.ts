import { v4 as uuidv4 } from 'uuid';
import { db } from './db';

export type SmsRecipient = { id: string; phone: string };

export type SmsSendResult = {
  id: string;
  audience: string;
  content: string;
  recipientsCount: number;
  sentAt: string;
  status: string;
  sent: number;
  failed: number;
  textIds: string[];
  error?: string;
};

const SENT = 'נשלח';
const FAILED = 'נכשל';
const PARTIAL = 'נשלח חלקית';
const SMS4FREE_URL = 'https://api.sms4free.co.il/ApiSMS/v2/SendSMS';

export const WINNER_SMS_TEMPLATE =
  'ברכות! זכית בהגרלת Starlink בכנס Fortinet. נציג שלנו יצור איתך קשר.';

/** Israeli local format for SMS4FREE: 05XXXXXXXX */
export function normalizePhoneLocal(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('972')) return `0${digits.slice(3)}`;
  if (digits.startsWith('0')) return digits;
  if (digits.length === 9) return `0${digits}`;
  return digits;
}

export function normalizePhone(raw: string): string {
  const local = normalizePhoneLocal(raw);
  if (local.startsWith('0')) return `+972${local.slice(1)}`;
  return local;
}

export function resolveRecipients(audience: string): SmsRecipient[] {
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
      return db.prepare(
        "SELECT id, phone FROM participants WHERE interest = ? AND raffleStatus = 'פעיל'",
      ).all(audience) as Row[];
  }
}

type Sms4FreeConfig = {
  key: string;
  user: string;
  pass: string;
  sender: string;
};

function getSms4FreeConfig(): Sms4FreeConfig | null {
  const key = process.env.SMS4FREE_KEY?.trim();
  const user = process.env.SMS4FREE_USER?.trim();
  const pass = process.env.SMS4FREE_PASS?.trim();
  if (!key || !user || !pass) return null;

  return {
    key,
    user: normalizePhoneLocal(user),
    pass,
    sender: (process.env.SMS_SENDER?.trim() || normalizePhoneLocal(user)).slice(0, 11),
  };
}

function sms4FreeError(status: number, message?: string): string {
  const map: Record<number, string> = {
    0: 'שגיאה כללית',
    [-1]: 'מפתח, שם משתמש או סיסמה שגויים',
    [-2]: 'שם או מספר שולח ההודעה שגוי',
    [-3]: 'לא נמצאו נמענים',
    [-4]: 'יתרת הודעות פנויות נמוכה',
    [-5]: 'הודעה לא מתאימה',
    [-6]: 'צריך לאמת מספר שולח — שלח הודעה ידנית פעם אחת מאתר SMS4FREE',
  };

  return map[status] ?? message ?? `SMS4FREE error (${status})`;
}

type Sms4FreeResponse = { status: number; message?: string };

async function sendViaSms4Free(
  phone: string,
  message: string,
  config: Sms4FreeConfig,
): Promise<{ success: boolean; status?: number; error?: string }> {
  const recipient = normalizePhoneLocal(phone);
  const payload = {
    key: config.key,
    user: config.user,
    pass: config.pass,
    sender: config.sender,
    recipient,
    msg: message,
  };

  console.log(`  -> SMS4FREE: recipient=${recipient} sender=${config.sender}`);

  try {
    const res = await fetch(SMS4FREE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json() as Sms4FreeResponse;
    console.log('  <- SMS4FREE response:', JSON.stringify(data));

    if (data.status > 0) {
      return { success: true, status: data.status };
    }

    return { success: false, status: data.status, error: sms4FreeError(data.status, data.message) };
  } catch (err) {
    console.error('  <- SMS4FREE fetch error:', err);
    return { success: false, error: String(err) };
  }
}

function updateParticipantSmsStatus(recipients: SmsRecipient[], status: string) {
  const update = db.prepare('UPDATE participants SET smsStatus = ? WHERE id = ?');
  for (const recipient of recipients) {
    if (recipient.id !== 'manual') update.run(status, recipient.id);
  }
}

function saveSmsMessage(
  audience: string,
  content: string,
  recipientsCount: number,
  status: string,
  sent: number,
  failed: number,
  textIds: string[],
  error?: string,
): SmsSendResult {
  const id = `s_${uuidv4().slice(0, 8)}`;
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO sms_messages (id, audience, content, recipientsCount, sentAt, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, audience, content, recipientsCount, now, status);

  const row = db.prepare('SELECT * FROM sms_messages WHERE id = ?').get(id) as {
    id: string;
    audience: string;
    content: string;
    recipientsCount: number;
    sentAt: string;
    status: string;
  };

  return { ...row, sent, failed, textIds, error };
}

export async function sendSmsToAudience(
  content: string,
  audience: string,
  test = false,
): Promise<SmsSendResult> {
  return sendSmsToRecipients({
    content,
    audience,
    recipients: resolveRecipients(audience),
    test,
  });
}

export async function sendSmsToRecipients({
  content,
  audience,
  recipients,
  test = false,
}: {
  content: string;
  audience: string;
  recipients: SmsRecipient[];
  test?: boolean;
}): Promise<SmsSendResult> {
  if (recipients.length === 0) {
    return saveSmsMessage(audience, content, 0, FAILED, 0, 0, [], 'No SMS recipients matched the audience');
  }

  const config = getSms4FreeConfig();
  const localDryRun = process.env.SMS_DRY_RUN === 'true';

  if (localDryRun || test) {
    console.warn(test ? 'SMS test mode — not contacting SMS4FREE' : 'SMS_DRY_RUN=true — recording SMS without contacting SMS4FREE');
    updateParticipantSmsStatus(recipients, SENT);
    return saveSmsMessage(audience, content, recipients.length, SENT, recipients.length, 0, []);
  }

  if (!config) {
    updateParticipantSmsStatus(recipients, FAILED);
    return saveSmsMessage(
      audience,
      content,
      0,
      FAILED,
      0,
      recipients.length,
      [],
      'SMS4FREE is not configured (SMS4FREE_KEY, SMS4FREE_USER, SMS4FREE_PASS)',
    );
  }

  console.log(`Sending SMS to ${recipients.length} recipient(s) via SMS4FREE`);

  let sent = 0;
  let failed = 0;
  const textIds: string[] = [];
  let lastError: string | undefined;

  for (const recipient of recipients) {
    const result = await sendViaSms4Free(recipient.phone, content, config);
    if (result.success) {
      sent++;
      if (result.status != null) textIds.push(String(result.status));
      updateParticipantSmsStatus([recipient], SENT);
    } else {
      failed++;
      lastError = result.error;
      console.error(`SMS failed to ${recipient.phone}: ${result.error}`);
      updateParticipantSmsStatus([recipient], FAILED);
    }

    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  const status = failed === 0 ? SENT : sent === 0 ? FAILED : PARTIAL;
  console.log(`SMS batch done: ${sent} sent, ${failed} failed`);
  return saveSmsMessage(audience, content, sent, status, sent, failed, textIds, lastError);
}

export function isSmsConfigured(): boolean {
  return getSms4FreeConfig() != null;
}
