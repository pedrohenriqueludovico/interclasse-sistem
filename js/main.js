// =============================================
// main.js — Scripts globais (todas as páginas)
// =============================================

// ── Toggle de Tema Escuro ───────────────────
const btnTheme = document.getElementById('toggle-theme');
const body = document.body;

if (localStorage.getItem('theme') === 'dark') {
  body.classList.add('dark-mode');
  btnTheme.textContent = '☀️';
}

btnTheme.addEventListener('click', () => {
  body.classList.toggle('dark-mode');
  btnTheme.textContent = body.classList.contains('dark-mode') ? '☀️' : '🌙';
  localStorage.setItem('theme', body.classList.contains('dark-mode') ? 'dark' : 'light');
});