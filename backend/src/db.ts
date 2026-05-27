import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// ---------------------------------------------------------------------------
// Database path
// DB_PATH env var lets you point to a persistent disk on Render/Railway etc.
// Default: <repo-root>/data/raffle.db
// ---------------------------------------------------------------------------
const DATA_DIR = process.env.DB_PATH
  ? path.dirname(process.env.DB_PATH)
  : path.join(__dirname, '../../data');
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'raffle.db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export const db = new Database(DB_PATH);

// Performance pragmas
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
db.exec(`
  CREATE TABLE IF NOT EXISTS participants (
    id            TEXT PRIMARY KEY,
    ticketId      TEXT UNIQUE NOT NULL,
    fullName      TEXT NOT NULL,
    company       TEXT NOT NULL,
    role          TEXT NOT NULL DEFAULT '',
    phone         TEXT NOT NULL,
    email         TEXT NOT NULL,
    isBusinessCustomer INTEGER NOT NULL DEFAULT 0,
    interest      TEXT NOT NULL DEFAULT '',
    marketingConsent   INTEGER NOT NULL DEFAULT 0,
    source        TEXT NOT NULL DEFAULT 'web',
    registeredAt  TEXT NOT NULL,
    smsStatus     TEXT NOT NULL DEFAULT 'ממתין',
    raffleStatus  TEXT NOT NULL DEFAULT 'פעיל'
  );

  CREATE TABLE IF NOT EXISTS winners (
    id            TEXT PRIMARY KEY,
    participantId TEXT NOT NULL,
    fullName      TEXT NOT NULL,
    company       TEXT NOT NULL,
    phone         TEXT NOT NULL,
    email         TEXT NOT NULL,
    wonAt         TEXT NOT NULL,
    confirmed     INTEGER NOT NULL DEFAULT 1,
    smsSent       INTEGER NOT NULL DEFAULT 0,
    contacted     INTEGER NOT NULL DEFAULT 0,
    prizeDelivered INTEGER NOT NULL DEFAULT 0,
    notes         TEXT
  );

  CREATE TABLE IF NOT EXISTS sms_messages (
    id             TEXT PRIMARY KEY,
    audience       TEXT NOT NULL,
    content        TEXT NOT NULL,
    recipientsCount INTEGER NOT NULL DEFAULT 0,
    sentAt         TEXT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'נשלח'
  );

  CREATE TABLE IF NOT EXISTS settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// ---------------------------------------------------------------------------
// Helpers – convert SQLite booleans
// ---------------------------------------------------------------------------
export function toParticipant(row: Record<string, unknown>) {
  return {
    ...row,
    isBusinessCustomer: Boolean(row.isBusinessCustomer),
    marketingConsent: Boolean(row.marketingConsent),
  };
}

export function toWinner(row: Record<string, unknown>) {
  return {
    ...row,
    confirmed: Boolean(row.confirmed),
    smsSent: Boolean(row.smsSent),
    contacted: Boolean(row.contacted),
    prizeDelivered: Boolean(row.prizeDelivered),
  };
}

// ---------------------------------------------------------------------------
// Default settings
// ---------------------------------------------------------------------------
const DEFAULT_SETTINGS = {
  eventName: 'Fortinet Starlink Giveaway',
  registrationOpen: true,
  winnersCount: 1,
  preventDuplicatePhone: true,
  preventDuplicateEmail: true,
  termsText: 'אני מאשר/ת קבלת עדכונים והודעות בנוגע להגרלה ולפתרונות SpotNet',
  primaryColor: '#EE3124',
  autoSmsEnabled: true,
  autoSmsTemplate:
    'תודה שנרשמת להגרלת Starlink בכנס Fortinet. ההגרלה תתקיים במהלך הכנס. בהצלחה, SpotNet',
};

// ---------------------------------------------------------------------------
// Seed with mock data (runs only if tables are empty)
// ---------------------------------------------------------------------------
export function seedDatabase() {
  // Set SKIP_SEED=true in production to start with an empty DB
  if (process.env.SKIP_SEED === 'true') {
    console.log('⏭️  SKIP_SEED=true — skipping mock data seed');
    return;
  }
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM participants').get() as { cnt: number };
  if (countRow.cnt > 0) {
    console.log(`📦 DB already has ${countRow.cnt} participants — skipping seed`);
    return;
  }

  console.log('🌱 Seeding database with mock data...');

  const firstNames = ['יואב','דנה','איתי','נועה','רון','מיכל','אורי','תמר','גיל','שירה','עידן','יעל','אסף','הילה','ניר','ליאת','תום','מעיין','אלון','רוני','יונתן','מאיה','עומר','עדי','דור','אביגיל','שחר','נטע','ארז','קרן'];
  const lastNames = ['כהן','לוי','מזרחי','פרץ','אברהם','דהן','חדד','אזולאי','ביטון','שמואלי','גולדברג','רוזן','פרידמן','ברק','שפירא','אדלר','נחמיאס','בן דוד','אלוני','גרינברג'];
  const companies = ['Check Point','Wiz','CyberArk','Imperva','SentinelOne','Cellebrite','Bank Hapoalim','Leumi','Teva','Elbit Systems','Rafael','Mobileye','Monday.com','Lightricks','Wix','Fiverr','Taboola','AppsFlyer','JFrog','Riskified','Tabit','Gett','Payoneer','IronSource','Playtika','Innoviz','Otonomo','Outbrain','Verbit','Plus500'];
  const roles = ['CISO','CTO','IT Manager','Security Engineer','Network Architect','DevOps Lead','CIO','Head of Infrastructure','Security Analyst','VP R&D','IT Director','Cloud Architect'];
  const interests = ['Forti SASE','Perception Point','Starlink','פתרונות סייבר','אחר'];
  const smsStatuses = ['נשלח','ממתין','נכשל','לא נשלח'];

  function israeliPhone(i: number) {
    const prefixes = ['050','052','053','054','055','058'];
    const p = prefixes[i % prefixes.length];
    const rest = String(1000000 + ((i * 73 + 91827) % 8999999));
    return `${p}-${rest.slice(0, 3)}-${rest.slice(3)}`;
  }

  const insertParticipant = db.prepare(`
    INSERT INTO participants (id, ticketId, fullName, company, role, phone, email,
      isBusinessCustomer, interest, marketingConsent, source, registeredAt, smsStatus, raffleStatus)
    VALUES (@id, @ticketId, @fullName, @company, @role, @phone, @email,
      @isBusinessCustomer, @interest, @marketingConsent, @source, @registeredAt, @smsStatus, @raffleStatus)
  `);

  const seedAll = db.transaction(() => {
    const now = Date.now();
    for (let i = 0; i < 42; i++) {
      const fn = firstNames[i % firstNames.length];
      const ln = lastNames[(i * 3) % lastNames.length];
      const company = companies[i % companies.length];
      const date = new Date(now - (i * 27 + 13) * 60000);
      insertParticipant.run({
        id: `p_${i + 1}`,
        ticketId: `FT-${String(1000 + i)}`,
        fullName: `${fn} ${ln}`,
        company,
        role: roles[i % roles.length],
        phone: israeliPhone(i),
        email: `${fn.toLowerCase()}.${ln.replace(' ', '')}${i}@${company.toLowerCase().replace(/[^a-z]/g, '')}.com`,
        isBusinessCustomer: i % 3 !== 0 ? 1 : 0,
        interest: interests[i % interests.length],
        marketingConsent: i % 5 !== 0 ? 1 : 0,
        source: 'fortinet_event',
        registeredAt: date.toISOString(),
        smsStatus: smsStatuses[i % smsStatuses.length],
        raffleStatus: i % 17 === 0 ? 'לא תקין' : 'פעיל',
      });
    }

    // Seed one winner
    const p7 = db.prepare('SELECT * FROM participants WHERE id = ?').get('p_7') as Record<string, unknown>;
    if (p7) {
      db.prepare(`
        INSERT INTO winners (id, participantId, fullName, company, phone, email, wonAt,
          confirmed, smsSent, contacted, prizeDelivered, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, 1, 1, 0, ?)
      `).run(
        'w_1',
        'p_7',
        p7.fullName,
        p7.company,
        p7.phone,
        p7.email,
        new Date(Date.now() - 86400000).toISOString(),
        'יצרנו קשר טלפוני',
      );
      db.prepare("UPDATE participants SET raffleStatus = 'זכה' WHERE id = 'p_7'").run();
    }

    // Seed SMS history
    db.prepare(`
      INSERT INTO sms_messages (id, audience, content, recipientsCount, sentAt, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('s_1', 'כל המשתתפים', 'תודה שנרשמת להגרלת Starlink בכנס Fortinet.', 42, new Date(Date.now() - 3600000).toISOString(), 'נשלח');
    db.prepare(`
      INSERT INTO sms_messages (id, audience, content, recipientsCount, sentAt, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run('s_2', 'לקוחות עסקיים', 'ההגרלה עומדת להתחיל. הישארו באזור הכנס.', 28, new Date(Date.now() - 7200000).toISOString(), 'נשלח');
  });

  seedAll();

  // Seed settings if missing
  const settingsExists = db.prepare("SELECT value FROM settings WHERE key = 'all'").get();
  if (!settingsExists) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('all', ?)").run(
      JSON.stringify(DEFAULT_SETTINGS),
    );
  }

  console.log('✅ Database seeded successfully');
}

// Ensure settings row exists even if DB was already populated
const settingsExists = db.prepare("SELECT value FROM settings WHERE key = 'all'").get();
if (!settingsExists) {
  db.prepare("INSERT INTO settings (key, value) VALUES ('all', ?)").run(
    JSON.stringify(DEFAULT_SETTINGS),
  );
}

export { DEFAULT_SETTINGS };
