import { Router } from 'express';
import { db, DEFAULT_SETTINGS } from '../db';
import { authenticate } from '../middleware/auth';

export const settingsRouter = Router();

function getSettings() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'all'").get() as { value: string } | undefined;
  return row ? JSON.parse(row.value) : { ...DEFAULT_SETTINGS };
}

// ---------------------------------------------------------------------------
// GET /api/settings  (public – registration form needs registrationOpen, termsText, etc.)
// ---------------------------------------------------------------------------
settingsRouter.get('/', (_req, res) => {
  return res.json(getSettings());
});

// ---------------------------------------------------------------------------
// PUT /api/settings  (admin only)
// ---------------------------------------------------------------------------
settingsRouter.put('/', authenticate, (req, res) => {
  const current = getSettings();
  const patch = req.body as Record<string, unknown>;

  // Only allow known fields
  const allowed = [
    'eventName','registrationOpen','winnersCount',
    'preventDuplicatePhone','preventDuplicateEmail',
    'termsText','primaryColor','autoSmsEnabled','autoSmsTemplate',
  ];

  const updated = { ...current };
  for (const key of allowed) {
    if (key in patch) updated[key] = patch[key];
  }

  db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('all', ?)").run(
    JSON.stringify(updated),
  );

  return res.json(updated);
});
