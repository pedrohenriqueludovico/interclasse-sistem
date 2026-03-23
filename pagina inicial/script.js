/* =============================================
   home.js — Scripts exclusivos da página inicial
   Scripts globais (ex: toggle de tema) ficam em /js/main.js
   ============================================= */

// ── Dados das notícias ──────────────────────────────────────────────────────
const noticias = {
  1: {
    titulo: "Grande Abertura do Interclasse 2025",
    conteudo:
      "A cerimônia de abertura será realizada no dia 10 de outubro, com apresentações culturais, desfile dos times e muito mais. Não perca!",
  },
  2: {
    titulo: "Novas Regras de Pontuação",
    conteudo:
      "Confira as atualizações nas regras para o torneio de futebol e vôlei deste ano. As mudanças visam tornar a competição mais justa e empolgante.",
  },
  3: {
    titulo: "Treinamentos Abertos",
    conteudo:
      "Participe dos treinos livres para melhorar a preparação dos times antes do torneio. Os treinos acontecem todas as terças e quintas no período do almoço.",
  },
};

// ── Modal de Notícias ───────────────────────────────────────────────────────
const modalNoticia = document.getElementById("modal-noticia");
const modalTitulo = document.getElementById("modal-titulo");
const modalConteudo = document.getElementById("modal-conteudo");

document.querySelectorAll(".btn-leia-mais[data-noticia]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const id = btn.dataset.noticia;
    const noticia = noticias[id];
    if (!noticia) return;

    modalTitulo.textContent = noticia.titulo;
    modalConteudo.textContent = noticia.conteudo;
    modalNoticia.style.display = "flex";
  });
});

// ── Modal de Campeões ───────────────────────────────────────────────────────
const modalCampeoes = document.getElementById("modal-campeoes");

document.getElementById("ver-todos-campeoes").addEventListener("click", () => {
  modalCampeoes.style.display = "flex";
});

// ── Fechar modais ───────────────────────────────────────────────────────────
document.querySelectorAll(".modal .fechar").forEach((btn) => {
  btn.addEventListener("click", () => {
    btn.closest(".modal").style.display = "none";
  });
});

window.addEventListener("click", (e) => {
  if (e.target.classList.contains("modal")) {
    e.target.style.display = "none";
  }
});