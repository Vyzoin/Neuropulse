const API = 'http://localhost:3000';

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
  if (!me) { window.location.href = 'login.html'; return null; }
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
    if (welcome)   { welcome.style.display     = 'inline-block'; welcome.textContent = `👋 Bienvenue, ${username}`; }
  } else {
    if (btnLogin)    btnLogin.style.display    = 'inline-block';
    if (btnRegister) btnRegister.style.display = 'inline-block';
    if (btnLogout)   btnLogout.style.display   = 'none';
    if (welcome)     welcome.style.display     = 'none';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const btnLogout = document.getElementById('navLogout');
  if (btnLogout) btnLogout.addEventListener('click', logout);
});