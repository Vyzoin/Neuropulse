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
// GET /api/player/:id/state — Charger l'état de jeu du personnage
router.get('/:id/state', async (req, res) => {
  const playerId = req.params.id;

  try {
    // Vérifier que ce player appartient bien à l'utilisateur connecté
    const check = await pool.query(
      'SELECT id FROM player WHERE id = $1 AND user_id = $2',
      [playerId, req.user.userId]
    );
    if (check.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const result = await pool.query(
      'SELECT * FROM player_state WHERE player_id = $1',
      [playerId]
    );

    if (result.rows.length === 0) {
      // Aucun état → renvoyer des valeurs par défaut
      return res.json({
        success: true,
        state: {
          pos_x: 1249,
          pos_y: 260,
          zone_x: 1,
          zone_y: 0,
          hp: 100,
          mana: 50
        }
      });
    }

    res.json({ success: true, state: result.rows[0] });
  } catch (err) {
    console.error('ERREUR GET PLAYER STATE:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});
// PUT /api/player/:id/state — Sauvegarder l'état de jeu du personnage
router.put('/:id/state', async (req, res) => {
  const playerId = req.params.id;
  const { pos_x, pos_y, zone_x, zone_y, hp, mana } = req.body;

  try {
    const check = await pool.query(
      'SELECT id FROM player WHERE id = $1 AND user_id = $2',
      [playerId, req.user.userId]
    );
    if (check.rows.length === 0) {
      return res.status(403).json({ success: false, message: 'Non autorisé' });
    }

    const existing = await pool.query(
      'SELECT id FROM player_state WHERE player_id = $1',
      [playerId]
    );

    if (existing.rows.length === 0) {
      await pool.query(
        `INSERT INTO player_state
         (player_id, pos_x, pos_y, zone_x, zone_y, hp, mana, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [playerId, pos_x, pos_y, zone_x, zone_y, hp, mana]
      );
    } else {
      await pool.query(
        `UPDATE player_state
         SET pos_x = $1, pos_y = $2, zone_x = $3, zone_y = $4, hp = $5, mana = $6, updated_at = NOW()
         WHERE player_id = $7`,
        [pos_x, pos_y, zone_x, zone_y, hp, mana, playerId]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('ERREUR SAVE PLAYER STATE:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;