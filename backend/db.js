require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: String(process.env.PGPASSWORD),
});


pool.connect()
  .then(() => console.log(" Connexion PostgreSQL réussie avec neuropulse_user !"))
  .catch(err => console.error(" Erreur de connexion PostgreSQL :", err));

module.exports = pool ; 