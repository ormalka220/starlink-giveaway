import { mockParticipants, mockWinners, mockSmsHistory, defaultSettings } from '../data/mock';
import type { Participant, Winner, SmsMessage, RaffleSettings } from '../types';

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let participants = [...mockParticipants];
let winners = [...mockWinners];
let smsHistory = [...mockSmsHistory];
let settings = { ...defaultSettings };

export const api = {
  async registerParticipant(input: Omit<Participant, 'id' | 'ticketId' | 'registeredAt' | 'smsStatus' | 'raffleStatus'>): Promise<Participant> {
    await delay(600);
    const id = `p_${participants.length + 1}`;
    const ticketId = `FT-${String(1000 + participants.length)}`;
    const p: Participant = {
      ...input,
      id,
      ticketId,
      registeredAt: new Date().toISOString(),
      smsStatus: 'ממתין',
      raffleStatus: 'פעיל',
    };
    participants.push(p);
    return p;
  },
  async listParticipants(): Promise<Participant[]> {
    await delay(200);
    return [...participants];
  },
  async deleteParticipant(id: string) {
    await delay(200);
    participants = participants.filter((p) => p.id !== id);
  },
  async markInvalid(id: string) {
    await delay(150);
    participants = participants.map((p) => (p.id === id ? { ...p, raffleStatus: 'לא תקין' as const } : p));
  },
  async eligibleForDraw(): Promise<Participant[]> {
    await delay(150);
    return participants.filter((p) => p.raffleStatus === 'פעיל');
  },
  async confirmWinner(participantId: string): Promise<Winner> {
    await delay(200);
    const p = participants.find((x) => x.id === participantId)!;
    const w: Winner = {
      id: `w_${winners.length + 1}`,
      participantId,
      fullName: p.fullName,
      company: p.company,
      phone: p.phone,
      email: p.email,
      wonAt: new Date().toISOString(),
      confirmed: true,
      smsSent: false,
      contacted: false,
      prizeDelivered: false,
    };
    winners.push(w);
    participants = participants.map((x) => (x.id === participantId ? { ...x, raffleStatus: 'זכה' } : x));
    return w;
  },
  async listWinners(): Promise<Winner[]> {
    await delay(150);
    return [...winners];
  },
  async updateWinner(id: string, patch: Partial<Winner>) {
    await delay(150);
    winners = winners.map((w) => (w.id === id ? { ...w, ...patch } : w));
  },
  async sendSms(content: string, audience: string, recipientsCount: number): Promise<SmsMessage> {
    await delay(500);
    const msg: SmsMessage = {
      id: `s_${smsHistory.length + 1}`,
      audience,
      content,
      recipientsCount,
      sentAt: new Date().toISOString(),
      status: 'נשלח',
    };
    smsHistory.unshift(msg);
    return msg;
  },
  async listSms(): Promise<SmsMessage[]> {
    await delay(150);
    return [...smsHistory];
  },
  async getSettings(): Promise<RaffleSettings> {
    await delay(100);
    return { ...settings };
  },
  async updateSettings(patch: Partial<RaffleSettings>): Promise<RaffleSettings> {
    await delay(200);
    settings = { ...settings, ...patch };
    return { ...settings };
  },
};
