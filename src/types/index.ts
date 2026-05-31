export type InterestArea =
  | 'Forti SASE'
  | 'Perception Point'
  | 'Starlink'
  | 'פתרונות סייבר'
  | 'אחר';

export type SmsStatus = 'נשלח' | 'ממתין' | 'נכשל' | 'לא נשלח';
export type RaffleStatus = 'פעיל' | 'זכה' | 'לא תקין' | 'הוסר';

export interface Participant {
  id: string;
  ticketId: string;
  fullName: string;
  company: string;
  role: string;
  phone: string;
  email: string;
  isBusinessCustomer: boolean;
  interest: InterestArea | string;
  marketingConsent: boolean;
  source: string;
  registeredAt: string;
  smsStatus: SmsStatus;
  raffleStatus: RaffleStatus;
}

export interface Winner {
  id: string;
  participantId: string;
  fullName: string;
  company: string;
  phone: string;
  email: string;
  wonAt: string;
  confirmed: boolean;
  smsSent: boolean;
  contacted: boolean;
  prizeDelivered: boolean;
  notes?: string;
}

export interface SmsMessage {
  id: string;
  audience: string;
  content: string;
  recipientsCount: number;
  sentAt: string;
  status: 'נשלח' | 'בתהליך' | 'נכשל';
  sent?: number;
  failed?: number;
  textIds?: string[];
  error?: string;
}

export interface RaffleSettings {
  eventName: string;
  registrationOpen: boolean;
  winnersCount: number;
  preventDuplicatePhone: boolean;
  preventDuplicateEmail: boolean;
  termsText: string;
  primaryColor: string;
  autoSmsEnabled: boolean;
  autoSmsTemplate: string;
}

export interface DrawResult {
  winnerId: string;
  drawnAt: string;
}
