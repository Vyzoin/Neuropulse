require('dotenv').config();
const express = require('express');
const app = express();
const pool = require('./db');
const PORT = 3000;

app.use(express.json());


app.get('/', (req, res) => {
  res.send('Backend opérationnel et fonctionnel ;)');
});


app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(` Base de données connectée ! Heure PostgreSQL : ${result.rows[0].now}`);
  } catch (err) {
    console.error(err);
    res.status(500).send(' Erreur de connexion à la base');
  }
});

app.listen(PORT, () => {
  console.log(` Serveur lancé sur http://localhost:${PORT}`);
});