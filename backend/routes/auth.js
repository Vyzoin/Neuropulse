const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../db');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, username, password } = req.body; 
  if (!email || !username || !password)
    return res.status(400).json({ success: false, message: 'Champs manquants' });
  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email_adress, username, password) VALUES ($1, $2, $3) RETURNING id',
      [email, username, hash]
    );
    req.session.userId = result.rows[0].id;
    res.json({ success: true });
  } catch (err) {
  console.error('ERREUR REGISTER:', err); 
  if (err.code === '23505')
    return res.status(400).json({ success: false, message: 'Email ou pseudo déjà utilisé' });
  res.status(500).json({ success: false, message: 'Erreur serveur' });
}
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email_adress = $1', [email]);
    if (result.rows.length === 0)
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ success: false, message: 'Email ou mot de passe incorrect' });
    req.session.userId = user.id;
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ success: true }));
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (req.session.userId)
    return res.json({ loggedIn: true, userId: req.session.userId });
  res.json({ loggedIn: false });
});

module.exports = router;