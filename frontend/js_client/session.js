const API = 'http://localhost:3000';

// --- Gestion du token / auth ---
function getToken() {
  return localStorage.getItem('token');
}

function logout() {
  localStorage.removeItem('token');
  window.location.href = 'login.html';
}

async function getMe() {
  const token = getToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    return data.loggedIn ? data : null;
  } catch {
    return null;
  }
}

async function requireAuth() {
  const me = await getMe();
  if (!me) {
    window.location.href = 'login.html';
    return null;
  }
  return me;
}

function updateNav(username) {
  const btnLogin    = document.getElementById('navLogin');
  const btnRegister = document.getElementById('navRegister');
  const btnLogout   = document.getElementById('navLogout');
  const welcome     = document.getElementById('navWelcome');

  if (username) {
    if (btnLogin)    btnLogin.style.display    = 'none';
    if (btnRegister) btnRegister.style.display = 'none';
    if (btnLogout)   btnLogout.style.display   = 'inline-block';
    if (welcome) {
      welcome.style.display = 'inline-block';
      welcome.textContent   = `👋 Bienvenue, ${username}`;
    }
  } else {
    if (btnLogin)    btnLogin.style.display    = 'inline-block';
    if (btnRegister) btnRegister.style.display = 'inline-block';
    if (btnLogout)   btnLogout.style.display   = 'none';
    if (welcome)     welcome.style.display     = 'none';
  }
}

// --- Gestion du personnage actif ---
function setActivePlayer(player) {
  if (!player) return;
  localStorage.setItem('activePlayer', JSON.stringify(player));
}

function getActivePlayer() {
  const raw = localStorage.getItem('activePlayer');
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem('activePlayer');
    return null;
  }
}

function clearActivePlayer() {
  localStorage.removeItem('activePlayer');
}

function requireActivePlayer() {
  const player = getActivePlayer();
  if (!player) {
    // Aucun personnage actif → retour aux slots
    window.location.href = 'character_save.html';
    return null;
  }
  return player;
}

// --- Initialisation globale ---
document.addEventListener('DOMContentLoaded', () => {
  const btnLogout = document.getElementById('navLogout');
  if (btnLogout) btnLogout.addEventListener('click', logout);
});