import type { Participant, Winner, SmsMessage, RaffleSettings, InterestArea, SmsStatus } from '../types';

const firstNames = ['יואב', 'דנה', 'איתי', 'נועה', 'רון', 'מיכל', 'אורי', 'תמר', 'גיל', 'שירה', 'עידן', 'יעל', 'אסף', 'הילה', 'ניר', 'ליאת', 'תום', 'מעיין', 'אלון', 'רוני', 'יונתן', 'מאיה', 'עומר', 'עדי', 'דור', 'אביגיל', 'שחר', 'נטע', 'ארז', 'קרן'];
const lastNames = ['כהן', 'לוי', 'מזרחי', 'פרץ', 'אברהם', 'דהן', 'חדד', 'אזולאי', 'ביטון', 'שמואלי', 'גולדברג', 'רוזן', 'פרידמן', 'ברק', 'שפירא', 'אדלר', 'נחמיאס', 'בן דוד', 'אלוני', 'גרינברג'];
const companies = ['Check Point', 'Wiz', 'CyberArk', 'Imperva', 'SentinelOne', 'Cellebrite', 'Bank Hapoalim', 'Leumi', 'Teva', 'Elbit Systems', 'Rafael', 'Mobileye', 'Monday.com', 'Lightricks', 'Wix', 'Fiverr', 'Taboola', 'AppsFlyer', 'JFrog', 'Riskified', 'Tabit', 'Gett', 'Payoneer', 'IronSource', 'Playtika', 'Innoviz', 'Otonomo', 'Outbrain', 'Verbit', 'Plus500'];
const roles = ['CISO', 'CTO', 'IT Manager', 'Security Engineer', 'Network Architect', 'DevOps Lead', 'CIO', 'Head of Infrastructure', 'Security Analyst', 'VP R&D', 'IT Director', 'Cloud Architect'];
const interests: InterestArea[] = ['Forti SASE', 'Perception Point', 'Starlink', 'פתרונות סייבר', 'אחר'];
const smsStatuses: SmsStatus[] = ['נשלח', 'ממתין', 'נכשל', 'לא נשלח'];

const rand = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)];

function israeliPhone(i: number) {
  const prefixes = ['050', '052', '053', '054', '055', '058'];
  const p = prefixes[i % prefixes.length];
  const rest = String(1000000 + (i * 73 + 91827) % 8999999);
  return `${p}-${rest.slice(0, 3)}-${rest.slice(3)}`;
}

export const mockParticipants: Participant[] = Array.from({ length: 42 }, (_, i) => {
  const fn = firstNames[i % firstNames.length];
  const ln = lastNames[(i * 3) % lastNames.length];
  const company = companies[i % companies.length];
  const date = new Date(Date.now() - (i * 27 + 13) * 60000);
  return {
    id: `p_${i + 1}`,
    ticketId: `FT-${String(1000 + i)}`,
    fullName: `${fn} ${ln}`,
    company,
    role: roles[i % roles.length],
    phone: israeliPhone(i),
    email: `${fn.toLowerCase()}.${ln.replace(' ', '')}${i}@${company.toLowerCase().replace(/[^a-z]/g, '')}.com`,
    isBusinessCustomer: i % 3 !== 0,
    interest: interests[i % interests.length],
    marketingConsent: i % 5 !== 0,
    source: 'fortinet_event',
    registeredAt: date.toISOString(),
    smsStatus: smsStatuses[i % smsStatuses.length],
    raffleStatus: i % 17 === 0 ? 'לא תקין' : 'פעיל',
  };
});

export const mockWinners: Winner[] = [
  {
    id: 'w_1',
    participantId: 'p_7',
    fullName: mockParticipants[6].fullName,
    company: mockParticipants[6].company,
    phone: mockParticipants[6].phone,
    email: mockParticipants[6].email,
    wonAt: new Date(Date.now() - 86400000).toISOString(),
    confirmed: true,
    smsSent: true,
    contacted: true,
    prizeDelivered: false,
    notes: 'יצרנו קשר טלפוני',
  },
];

export const mockSmsHistory: SmsMessage[] = [
  { id: 's_1', audience: 'כל המשתתפים', content: 'תודה שנרשמת להגרלת Starlink בכנס Fortinet.', recipientsCount: 42, sentAt: new Date(Date.now() - 3600000).toISOString(), status: 'נשלח' },
  { id: 's_2', audience: 'לקוחות עסקיים', content: 'ההגרלה עומדת להתחיל. הישארו באזור הכנס.', recipientsCount: 28, sentAt: new Date(Date.now() - 7200000).toISOString(), status: 'נשלח' },
];

export const defaultSettings: RaffleSettings = {
  eventName: 'Fortinet Starlink Giveaway',
  registrationOpen: true,
  winnersCount: 1,
  preventDuplicatePhone: true,
  preventDuplicateEmail: true,
  termsText: 'אני מאשר/ת קבלת עדכונים והודעות בנוגע להגרלה ולפתרונות SpotNet',
  primaryColor: '#EE3124',
  autoSmsEnabled: true,
  autoSmsTemplate: 'תודה שנרשמת להגרלת Starlink בכנס Fortinet. ההגרלה תתקיים במהלך הכנס. בהצלחה, SpotNet',
};

export const smsTemplates = [
  'תודה שנרשמת להגרלת Starlink בכנס Fortinet. ההגרלה תתקיים במהלך הכנס. בהצלחה, SpotNet',
  'ברכות! זכית בהגרלת Starlink של SpotNet בכנס Fortinet. נציג שלנו יצור איתך קשר להמשך התהליך.',
  'ההגרלה עומדת להתחיל. הישארו באזור הכנס והמתינו להכרזת הזוכה.',
];
