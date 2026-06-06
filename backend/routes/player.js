const express = require('express');
const router = express.Router();
const pool = require('../db');

// POST /api/player — Créer un personnage
router.post('/', async (req, res) => {
  const { name, firstname, sexe } = req.body;
  if (!name || !firstname || !sexe)
    return res.status(400).json({ success: false, message: 'Champs manquants' });

  try {
    // Vérifier si le joueur a déjà un personnage
    const existing = await pool.query(
      'SELECT id FROM player WHERE user_id = $1',
      [req.user.userId]
    );
    if (existing.rows.length > 0)
      return res.status(400).json({ success: false, message: 'Vous avez déjà un personnage' });

    // Créer le personnage
    const result = await pool.query(
      'INSERT INTO player (user_id, name, firstname, sexe) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.user.userId, name, firstname, sexe]
    );
    const player = result.rows[0];

    // Créer l'inventaire associé automatiquement
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

// GET /api/player/me — Récupérer son personnage
router.get('/me', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM player WHERE user_id = $1',
      [req.user.userId]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ success: false, message: 'Aucun personnage trouvé' });

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

  try {
    // Vérifier que le personnage appartient bien à l'utilisateur connecté
    const check = await pool.query(
      'SELECT id FROM player WHERE id = $1 AND user_id = $2',
      [playerId, req.user.userId]
    );
    if (check.rows.length === 0)
      return res.status(403).json({ success: false, message: 'Non autorisé' });

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
    if (check.rows.length === 0)
      return res.status(403).json({ success: false, message: 'Non autorisé' });

    await pool.query('DELETE FROM player WHERE id = $1', [playerId]);
    res.json({ success: true, message: 'Personnage supprimé' });
  } catch (err) {
    console.error('ERREUR DELETE PLAYER:', err);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;