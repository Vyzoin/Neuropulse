const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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
    const token = jwt.sign(
      { userId: result.rows[0].id, username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.status(201).json({ success: true, token });
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
  if (!email || !password)
    return res.status(400).json({ success: false, message: 'Champs manquants' });
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email_adress = $1',
      [email]
    );
    const user = result.rows[0];
    if (!user) return res.status(401).json({ success: false, message: 'Email introuvable' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: 'Mot de passe incorrect' });

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    res.json({ success: true, token });
  } catch (err) {
    console.error('ERREUR LOGIN:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // Avec JWT, la déconnexion se gère côté frontend (supprimer le token)
  res.json({ success: true, message: 'Déconnecté' });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.json({ loggedIn: false });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ loggedIn: true, userId: decoded.userId, username: decoded.username });
  } catch {
    res.json({ loggedIn: false });
  }
});

module.exports = router;