import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { seedDatabase } from './db';
import { authRouter } from './routes/auth';
import { participantsRouter } from './routes/participants';
import { winnersRouter } from './routes/winners';
import { smsRouter } from './routes/sms';
import { settingsRouter } from './routes/settings';

const app = express();
const PORT = Number(process.env.PORT) || 3001;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------
// CORS – allow localhost in dev + any FRONTEND_URL set in env (Netlify/Render URL)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.includes(origin)) return true;

  try {
    const url = new URL(origin);
    const isLocalHost = ['localhost', '127.0.0.1', '[::1]', '::1'].includes(url.hostname);
    return url.protocol === 'http:' && isLocalHost;
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (curl, mobile apps, same-origin)
      if (!origin) return cb(null, true);
      if (isAllowedOrigin(origin)) return cb(null, true);
      cb(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);
app.use(express.json());

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use('/api/auth', authRouter);
app.use('/api/participants', participantsRouter);
app.use('/api/winners', winnersRouter);
app.use('/api/sms', smsRouter);
app.use('/api/settings', settingsRouter);

// 404 fallback
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
seedDatabase();

app.listen(PORT, () => {
  console.log(`\n🚀  Backend API running → http://localhost:${PORT}/api`);
  console.log(`📊  SQLite DB          → data/raffle.db`);
  console.log(`🔐  Admin login        → ${process.env.ADMIN_EMAIL || 'admin@example.com'}\n`);
});

export default app;
