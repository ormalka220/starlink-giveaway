import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../middleware/auth';

export const authRouter = Router();

const ADMIN_EMAIL    = process.env.ADMIN_EMAIL    || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-me';

// POST /api/auth/login
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    return res.status(400).json({ error: 'חסרים שם משתמש או סיסמה' });
  }

  if (email.trim() !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'שם משתמש או סיסמה שגויים' });
  }

  const token = jwt.sign({ email: ADMIN_EMAIL, role: 'admin' }, JWT_SECRET, {
    expiresIn: '24h',
  });

  return res.json({ token, user: { email: ADMIN_EMAIL } });
});

// GET /api/auth/me  (validate current token)
authRouter.get('/me', (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'לא מחובר' });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET) as { email: string };
    return res.json({ email: payload.email });
  } catch {
    return res.status(401).json({ error: 'טוקן לא תקין' });
  }
});
