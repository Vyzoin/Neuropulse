const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/player — Créer un personnage
router.post('/', async (req, res) => {
  const { name, firstname, sexe, slot } = req.body;

  if (!name || !firstname || !sexe) {
    return res.status(400).json({ success: false, message: 'Champs manquants' });
  }

  const slotNum = parseInt(slot) || 1;

  try {
    const existing = await pool.query(
      'SELECT id FROM player WHERE user_id = $1 AND slot = $2',
      [req.user.userId, slotNum]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Ce slot est déjà occupé' });
    }

    const result = await pool.query(
      'INSERT INTO player (user_id, name, firstname, sexe, slot) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.user.userId, name, firstname, sexe, slotNum]
    );

    const player = result.rows[0];

    await pool.query(
      'INSERT INTO inventory (player_id) VALUES ($1)',
      [player.id]
    );

    res.status(201).json({ success: true, player });
  } catch (err) {
    console.error('ERREUR CREATE PLAYER:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/player/me — Récupérer tous les personnages
router.get('/me', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM player WHERE user_id = $1 ORDER BY slot ASC',
      [req.user.userId]
    );

    res.json({ success: true, players: result.rows });
  } catch (err) {
    console.error('ERREUR GET PLAYERS:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// GET /api/player/:id — Récupérer un personnage précis
router.get('/:id', async (req, res) => {
  const playerId = req.params.id;

  try {
    const result = await pool.query(
      'SELECT * FROM player WHERE id = $1 AND user_id = $2',
      [playerId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Personnage introuvable' });
    }

    res.json({ success: true, player: result.rows[0] });
  } catch (err) {
    console.error('ERREUR GET PLAYER:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// PUT /api/player/:id — Modifier son personnage
router.put('/:id', async (req, res) => {
  const { name, firstname, sexe } = req.body;
  const playerId = req.params.id;

  if (!name || !firstname || !sexe) {
    return res.status(400).json({ success: false, message: 'Champs manquants' });
  }

  try {
    const check = await pool.query(
      'SELECT id FROM player WHERE id = $1 AND user_id = $2',
      [playerId, req.user.userId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const result = await pool.query(
      'UPDATE player SET name = $1, firstname = $2, sexe = $3 WHERE id = $4 RETURNING *',
      [name, firstname, sexe, playerId]
    );

    res.json({ success: true, player: result.rows[0] });
  } catch (err) {
    console.error('ERREUR UPDATE PLAYER:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

// DELETE /api/player/:id — Supprimer son personnage
router.delete('/:id', async (req, res) => {
  const playerId = req.params.id;

  try {
    const check = await pool.query(
      'SELECT id FROM player WHERE id = $1 AND user_id = $2',
      [playerId, req.user.userId]
    );

    if (check.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    await pool.query('DELETE FROM inventory WHERE player_id = $1', [playerId]);
    await pool.query('DELETE FROM player WHERE id = $1', [playerId]);

    res.json({ success: true, message: 'Personnage supprimé' });
  } catch (err) {
    console.error('ERREUR DELETE PLAYER:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;