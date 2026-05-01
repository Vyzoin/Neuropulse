require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const app = express();
const pool = require('./db');
const PORT = 3000;

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(session({
  secret: 'neuropulse_secret_key',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, maxAge: 1000 * 60 * 60 * 2 }
}));

app.get('/', (req, res) => res.send('Backend opérationnel et fonctionnel ;)'));

app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.send(` BDD connectée ! ${result.rows[0].now}`);
  } catch (err) {
    res.status(500).send(' Erreur BDD');
  }
});

const authRoutes = require('./routes/auth');
// const playerRoutes = require('./routes/player');
app.use('/api/auth', authRoutes);
// app.use('/api/player', playerRoutes);

app.listen(PORT, () => console.log(` Serveur sur http://localhost:${PORT}`));