// =============================================
// inscricao.js — Lógica da página de inscrição
// Dados salvos no localStorage como "maf_inscritos"
// Estrutura de cada inscrito:
// { id, nome, turma, coletivos: [], individual: "" }
// =============================================

const LIMITE_POR_ESPORTE = 12;
const CHAVE_LS = "maf_inscritos";

// ── Elementos do DOM ────────────────────────
const inputNome       = document.getElementById("nome");
const selectTurma     = document.getElementById("turma");
const btnInscrever    = document.getElementById("btn-inscrever");
const feedback        = document.getElementById("feedback");
const listaInscritos  = document.getElementById("lista-inscritos");
const totalBadge      = document.getElementById("total-badge");
const filtroTurma     = document.getElementById("filtro-turma");
const filtroEsporte   = document.getElementById("filtro-esporte");
const btnLimparTudo   = document.getElementById("btn-limpar-tudo");

// ── LocalStorage ────────────────────────────
function getInscritos() {
  return JSON.parse(localStorage.getItem(CHAVE_LS) || "[]");
}

function salvarInscritos(lista) {
  localStorage.setItem(CHAVE_LS, JSON.stringify(lista));
}

// ── Contagem por esporte ─────────────────────
function contarPorEsporte(esporte) {
  return getInscritos().filter(i =>
    i.coletivos.includes(esporte) || i.individual === esporte
  ).length;
}

// ── Atualiza barras de vagas ─────────────────
function atualizarContadores() {
  const esportes = {
    Futebol:  { barra: "barra-futebol",  count: "count-futebol"  },
    "Vôlei":  { barra: "barra-volei",    count: "count-volei"    },
    Basquete: { barra: "barra-basquete", count: "count-basquete" },
    Xadrez:   { barra: "barra-xadrez",   count: "count-xadrez"   },
  };

  for (const [esporte, ids] of Object.entries(esportes)) {
    const qtd = contarPorEsporte(esporte);
    const pct = Math.min((qtd / LIMITE_POR_ESPORTE) * 100, 100);
    const barra = document.getElementById(ids.barra);
    const count = document.getElementById(ids.count);

    barra.style.width = pct + "%";
    barra.classList.toggle("cheia", qtd >= LIMITE_POR_ESPORTE);
    count.textContent = `${qtd}/${LIMITE_POR_ESPORTE}`;
  }

  // Bloqueia cards de esportes lotados
  document.querySelectorAll(".esporte-card").forEach(card => {
    const input = card.querySelector("input");
    const esporte = input.value;
    const lotado = contarPorEsporte(esporte) >= LIMITE_POR_ESPORTE;
    card.classList.toggle("lotado", lotado);
    input.disabled = lotado;
  });
}

// ── Renderiza lista de inscritos ─────────────
function renderizarLista() {
  const inscritos = getInscritos();
  const turmaFiltro   = filtroTurma.value;
  const esporteFiltro = filtroEsporte.value;

  totalBadge.textContent = inscritos.length;

  const filtrados = inscritos.filter(i => {
    const passaTurma   = !turmaFiltro   || i.turma === turmaFiltro;
    const passaEsporte = !esporteFiltro || i.coletivos.includes(esporteFiltro) || i.individual === esporteFiltro;
    return passaTurma && passaEsporte;
  });

  if (filtrados.length === 0) {
    listaInscritos.innerHTML = '<p class="lista-vazia">Nenhum inscrito encontrado.</p>';
    return;
  }

  listaInscritos.innerHTML = filtrados.map(i => {
    const esportes = [...i.coletivos, ...(i.individual ? [i.individual] : [])];
    const tags = esportes.map(e => `<span class="tag-esporte">${e}</span>`).join("");
    return `
      <div class="inscrito-item">
        <div class="inscrito-info">
          <span class="inscrito-nome">${i.nome}</span>
          <span class="inscrito-detalhes">Turma ${formatarTurma(i.turma)}</span>
          <div class="inscrito-esportes">${tags}</div>
        </div>
        <button class="btn-remover" data-id="${i.id}" title="Remover inscrição">✕</button>
      </div>
    `;
  }).join("");

  // Eventos de remoção
  listaInscritos.querySelectorAll(".btn-remover").forEach(btn => {
    btn.addEventListener("click", () => removerInscrito(btn.dataset.id));
  });
}

// ── Formata turma: "3A" → "3º A" ────────────
function formatarTurma(turma) {
  return turma.replace(/(\d)([A-C])/, "$1º $2");
}

// ── Exibe feedback ───────────────────────────
function mostrarFeedback(msg, tipo) {
  feedback.textContent = msg;
  feedback.className = `feedback ${tipo}`;
  setTimeout(() => { feedback.className = "feedback hidden"; }, 3500);
}

// ── Lógica de seleção visual dos esportes ────
document.querySelectorAll(".esporte-card").forEach(card => {
  card.addEventListener("click", () => {
    const input = card.querySelector("input");
    if (input.disabled) return;

    if (input.type === "checkbox") {
      const selecionados = document.querySelectorAll('input[name="coletivo"]:checked');
      if (!input.checked && selecionados.length >= 2) {
        mostrarFeedback("Você pode escolher no máximo 2 esportes coletivos.", "erro");
        return;
      }
      input.checked = !input.checked;
    } else {
      // radio
      document.querySelectorAll(".esporte-card.individual").forEach(c => c.classList.remove("selecionado"));
      input.checked = true;
    }

    card.classList.toggle("selecionado", input.checked);
  });
});

// ── Inscrever ────────────────────────────────
btnInscrever.addEventListener("click", () => {
  const nome   = inputNome.value.trim();
  const turma  = selectTurma.value;
  const coletivos  = [...document.querySelectorAll('input[name="coletivo"]:checked')].map(i => i.value);
  const individualEl = document.querySelector('input[name="individual"]:checked');
  const individual = individualEl ? individualEl.value : "";

  // Validações
  if (!nome) return mostrarFeedback("Informe o nome completo.", "erro");
  if (!turma) return mostrarFeedback("Selecione a sua turma.", "erro");
  if (coletivos.length === 0 && !individual)
    return mostrarFeedback("Selecione ao menos um esporte.", "erro");

  const inscritos = getInscritos();

  // Verifica duplicata
  const jaCadastrado = inscritos.find(i => i.nome.toLowerCase() === nome.toLowerCase() && i.turma === turma);
  if (jaCadastrado) return mostrarFeedback("Este aluno já está inscrito.", "erro");

  // Verifica vagas
  for (const esp of [...coletivos, ...(individual ? [individual] : [])]) {
    if (contarPorEsporte(esp) >= LIMITE_POR_ESPORTE) {
      return mostrarFeedback(`${esp} já está com vagas esgotadas.`, "erro");
    }
  }

  const novoInscrito = {
    id: Date.now().toString(),
    nome,
    turma,
    coletivos,
    individual,
  };

  inscritos.push(novoInscrito);
  salvarInscritos(inscritos);

  // Limpa form
  inputNome.value = "";
  selectTurma.value = "";
  document.querySelectorAll(".esporte-card input").forEach(i => { i.checked = false; });
  document.querySelectorAll(".esporte-card").forEach(c => c.classList.remove("selecionado"));

  mostrarFeedback(`${nome} inscrito com sucesso! ✅`, "sucesso");
  atualizarContadores();
  renderizarLista();
});

// ── Remover inscrito ─────────────────────────
function removerInscrito(id) {
  const inscritos = getInscritos().filter(i => i.id !== id);
  salvarInscritos(inscritos);
  atualizarContadores();
  renderizarLista();
}

// ── Limpar tudo ──────────────────────────────
btnLimparTudo.addEventListener("click", () => {
  if (!confirm("Tem certeza que quer apagar todas as inscrições?")) return;
  salvarInscritos([]);
  atualizarContadores();
  renderizarLista();
});

// ── Filtros ──────────────────────────────────
filtroTurma.addEventListener("change", renderizarLista);
filtroEsporte.addEventListener("change", renderizarLista);

// ── Init ─────────────────────────────────────
atualizarContadores();
renderizarLista();