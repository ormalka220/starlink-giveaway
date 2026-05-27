import type { Participant, Winner, SmsMessage, RaffleSettings } from '../types';

// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------
const BASE = '/api';

function getToken(): string | null {
  return localStorage.getItem('auth');
}

function buildHeaders(): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token && token !== '1') h['Authorization'] = `Bearer ${token}`;
  return h;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: buildHeaders(),
      body: body != null ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error('לא ניתן להתחבר לשרת – ודא שהבקאנד פועל');
  }

  // Read body as text first to avoid "Unexpected end of JSON input"
  const text = await res.text();

  if (!res.ok) {
    let msg = `שגיאת שרת (${res.status})`;
    if (text) {
      try {
        const j = JSON.parse(text);
        if (j?.error) msg = j.error;
      } catch { /* not JSON – use raw text */ }
    }
    throw new Error(msg);
  }

  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export const authApi = {
  async login(email: string, password: string): Promise<{ token: string; user: { email: string } }> {
    return request('POST', '/auth/login', { email, password });
  },
};

// ---------------------------------------------------------------------------
// Main API (matches previous mock interface exactly)
// ---------------------------------------------------------------------------
export const api = {
  // ── Participants ────────────────────────────────────────────────────────
  async registerParticipant(
    input: Omit<Participant, 'id' | 'ticketId' | 'registeredAt' | 'smsStatus' | 'raffleStatus'>,
  ): Promise<Participant> {
    return request('POST', '/participants', input);
  },

  async listParticipants(): Promise<Participant[]> {
    return request('GET', '/participants');
  },

  async deleteParticipant(id: string): Promise<void> {
    return request('DELETE', `/participants/${id}`);
  },

  async markInvalid(id: string): Promise<void> {
    return request('PATCH', `/participants/${id}/invalid`);
  },

  async eligibleForDraw(): Promise<Participant[]> {
    return request('GET', '/participants/eligible');
  },

  // ── Winners ─────────────────────────────────────────────────────────────
  async confirmWinner(participantId: string): Promise<Winner> {
    return request('POST', '/winners', { participantId });
  },

  async listWinners(): Promise<Winner[]> {
    return request('GET', '/winners');
  },

  async updateWinner(id: string, patch: Partial<Winner>): Promise<void> {
    return request('PATCH', `/winners/${id}`, patch);
  },

  // ── SMS ─────────────────────────────────────────────────────────────────
  async sendSms(content: string, audience: string, recipientsCount: number): Promise<SmsMessage> {
    return request('POST', '/sms', { content, audience, recipientsCount });
  },

  async listSms(): Promise<SmsMessage[]> {
    return request('GET', '/sms');
  },

  // ── Settings ────────────────────────────────────────────────────────────
  async getSettings(): Promise<RaffleSettings> {
    return request('GET', '/settings');
  },

  async updateSettings(patch: Partial<RaffleSettings>): Promise<RaffleSettings> {
    return request('PUT', '/settings', patch);
  },
};
