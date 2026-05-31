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

export const WINNER_SMS_TEMPLATE =
  'ברכות! זכית בהגרלת Starlink בכנס Fortinet. נציג שלנו יצור איתך קשר.';

export function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('972')) return `+${digits}`;
  if (digits.startsWith('0')) return `+972${digits.slice(1)}`;
  return `+972${digits}`;
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

type TextbeltDeliveryStatus = 'DELIVERED' | 'SENT' | 'SENDING' | 'FAILED' | 'UNKNOWN';

export async function getDeliveryStatus(textId: string): Promise<TextbeltDeliveryStatus> {
  try {
    const res = await fetch(`https://textbelt.com/status/${textId}`);
    const data = await res.json() as { success?: boolean; status?: TextbeltDeliveryStatus };
    return data.status ?? 'UNKNOWN';
  } catch {
    return 'UNKNOWN';
  }
}

async function pollDeliveryStatus(textId: string): Promise<{ status: TextbeltDeliveryStatus; delivered: boolean }> {
  const maxAttempts = 6;
  const delayMs = 2000;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }

    const status = await getDeliveryStatus(textId);
    console.log(`  <- Textbelt delivery status (attempt ${attempt + 1}): ${status}`);

    if (status === 'DELIVERED' || status === 'SENT') {
      return { status, delivered: true };
    }
    if (status === 'FAILED') {
      return { status, delivered: false };
    }
  }

  return { status: 'UNKNOWN', delivered: false };
}

const DELIVERY_FAILED_ERROR =
  'Textbelt accepted the SMS but carrier delivery failed. For Israeli numbers (+972), Textbelt often fails — use a local SMS provider (Twilio/Inforu/019).';

async function sendViaTextbelt(
  phone: string,
  message: string,
  apiKey: string,
  dryRun: boolean,
): Promise<{ success: boolean; textId?: string; quotaRemaining?: number; error?: string }> {
  const key = dryRun ? `${apiKey}_test` : apiKey;
  const normalized = normalizePhone(phone);
  const body = new URLSearchParams({ phone: normalized, message, key });
  const sender = process.env.SMS_SENDER?.trim();
  if (sender) body.set('sender', sender);

  console.log(`  -> Textbelt: phone=${normalized} test=${dryRun}`);

  try {
    const res = await fetch('https://textbelt.com/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const data = await res.json() as { success: boolean; textId?: string; quotaRemaining?: number; error?: string };
    console.log('  <- Textbelt response:', JSON.stringify(data));
    return data;
  } catch (err) {
    console.error('  <- Textbelt fetch error:', err);
    return { success: false, error: String(err) };
  }
}

async function sendAndVerifyDelivery(
  phone: string,
  content: string,
  apiKey: string,
  test: boolean,
): Promise<{ success: boolean; textId?: string; error?: string }> {
  const result = await sendViaTextbelt(phone, content, apiKey, test);
  if (!result.success) return result;
  if (test || !result.textId) return result;

  const delivery = await pollDeliveryStatus(String(result.textId));
  if (delivery.delivered) {
    return { success: true, textId: result.textId };
  }

  const detail = delivery.status === 'FAILED'
    ? DELIVERY_FAILED_ERROR
    : `Delivery status remained ${delivery.status} (textId=${result.textId})`;

  console.error(`  <- SMS not delivered to ${normalizePhone(phone)}: ${detail}`);
  return { success: false, textId: result.textId, error: detail };
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

  const apiKey = process.env.TEXTBELT_API_KEY;
  const localDryRun = process.env.SMS_DRY_RUN === 'true';

  if (localDryRun) {
    console.warn('SMS_DRY_RUN=true - recording SMS without contacting Textbelt');
    updateParticipantSmsStatus(recipients, SENT);
    return saveSmsMessage(audience, content, recipients.length, SENT, recipients.length, 0, []);
  }

  if (!apiKey) {
    updateParticipantSmsStatus(recipients, FAILED);
    return saveSmsMessage(
      audience,
      content,
      0,
      FAILED,
      0,
      recipients.length,
      [],
      'TEXTBELT_API_KEY is not configured',
    );
  }

  if (!test) {
    try {
      const quotaRes = await fetch(`https://textbelt.com/quota/${apiKey}`);
      const quotaData = await quotaRes.json() as { success: boolean; quotaRemaining: number };
      console.log(`Textbelt quota remaining: ${quotaData.quotaRemaining}`);
      if (quotaData.success && quotaData.quotaRemaining <= 0) {
        updateParticipantSmsStatus(recipients, FAILED);
        return saveSmsMessage(
          audience,
          content,
          0,
          FAILED,
          0,
          recipients.length,
          [],
          'Textbelt quota is exhausted',
        );
      }
    } catch {
      // If the quota endpoint is unavailable, try the send endpoint and record its result.
    }
  }

  console.log(`Sending SMS to ${recipients.length} recipient(s) [test=${test}]`);

  let sent = 0;
  let failed = 0;
  const textIds: string[] = [];
  let lastError: string | undefined;

  const batchSize = 5;
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    for (const recipient of batch) {
      const result = await sendAndVerifyDelivery(recipient.phone, content, apiKey, test);
      if (result.success) {
        sent++;
        if (result.textId) textIds.push(result.textId);
        updateParticipantSmsStatus([recipient], SENT);
      } else {
        failed++;
        lastError = result.error;
        console.error(`SMS failed to ${recipient.phone}: ${result.error}`);
        updateParticipantSmsStatus([recipient], FAILED);
      }
    }

    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  const status = failed === 0 ? SENT : sent === 0 ? FAILED : PARTIAL;
  console.log(`SMS batch done: ${sent} sent, ${failed} failed | textIds: ${textIds.join(',')}`);
  return saveSmsMessage(audience, content, sent, status, sent, failed, textIds, lastError);
}
