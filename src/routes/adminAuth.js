import express from 'express';
import { z } from 'zod';
import * as users from '../models/users.js';
import { validateBody } from '../middleware/validate.js';
import { loginLimiter } from '../middleware/security.js';

const router = express.Router();

const loginSchema = z.object({
  username: z.string().min(1).max(120),
  password: z.string().min(1).max(200),
});

router.get('/login', (req, res) => {
  if (req.session.adminId) return res.redirect('/admin');
  res.render('admin/login', { title: 'Admin-Login', error: null });
});

router.post('/login', loginLimiter, validateBody(loginSchema), async (req, res) => {
  const fail = () =>
    res.status(401).render('admin/login', {
      title: 'Admin-Login',
      error: 'Benutzername oder Passwort falsch.',
    });

  if (req.validationErrors) return fail();

  const user = await users.verify(req.valid.username, req.valid.password);
  if (!user) return fail();

  // Session erneuern (Session-Fixation verhindern), Gate-Status erhalten.
  const gateOk = req.session.gateOk;
  req.session.regenerate((err) => {
    if (err) return fail();
    req.session.gateOk = gateOk;
    req.session.adminId = user.id;
    req.session.adminUsername = user.username;
    res.redirect('/admin');
  });
});

router.post('/logout', (req, res) => {
  req.session.adminId = null;
  req.session.adminUsername = null;
  res.redirect('/admin/login');
});

export default router;
