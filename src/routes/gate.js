import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import * as settings from '../models/settings.js';
import { validateBody } from '../middleware/validate.js';
import { loginLimiter } from '../middleware/security.js';

const router = express.Router();

const gateSchema = z.object({
  password: z.string().min(1, 'Bitte Passwort eingeben.').max(200),
});

router.get('/', (req, res) => {
  if (req.session.gateOk) return res.redirect('/');
  res.render('gate/gate', {
    title: 'Zugang',
    error: null,
    shopName: settings.get('shop_name'),
  });
});

router.post('/', loginLimiter, validateBody(gateSchema), async (req, res) => {
  const render = (error) =>
    res.status(error ? 401 : 200).render('gate/gate', {
      title: 'Zugang',
      error,
      shopName: settings.get('shop_name'),
    });

  if (req.validationErrors) return render('Bitte Passwort eingeben.');

  const hash = settings.get('gate_password_hash');
  if (!hash) {
    return render('Zugangsschutz ist nicht konfiguriert. Bitte Administrator kontaktieren.');
  }

  const ok = await bcrypt.compare(req.valid.password, hash);
  if (!ok) return render('Falsches Passwort.');

  req.session.regenerate((err) => {
    if (err) return render('Anmeldung fehlgeschlagen. Bitte erneut versuchen.');
    req.session.gateOk = true;
    res.redirect('/');
  });
});

export default router;
