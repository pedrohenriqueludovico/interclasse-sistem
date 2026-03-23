// =============================================
// sorteio.js — Lógica da página de sorteio
//
// Lê inscrições de: localStorage["maf_inscritos"]
// Salva sorteios em:  localStorage["maf_sorteios"]
//
// Regras:
//   ≤ 8 equipes → Fase de Grupos (todos contra todos)
//                 Classificam-se equipes com 8+ pontos
//   > 8 equipes → Mata-mata direto até a semifinal
// =============================================

const CHAVE_INSCRITOS = "maf_inscritos";
const CHAVE_SORTEIOS  = "maf_sorteios";
const PONTOS_CLASSIFICACAO = 8;
const LIMITE_GRUPOS = 8;

// Paleta de cores para as equipes
const CORES_EQUIPES = [
  "#f0a500", "#e74c3c", "#3498db", "#2ecc71",
  "#9b59b6", "#e67e22", "#1abc9c", "#e91e63",
  "#00bcd4", "#8bc34a", "#ff5722", "#607d8b",
];

// ── Elementos do DOM ────────────────────────
const selEsporte        = document.getElementById("sel-esporte");
const btnSortear        = document.getElementById("btn-sortear");
const btnLimpar         = document.getElementById("btn-limpar-sorteio");
const infoEquipes       = document.getElementById("info-equipes");
const infoTexto         = document.getElementById("info-texto");
const infoModo          = document.getElementById("info-modo");
const avisoSemInscritos = document.getElementById("aviso-sem-inscritos");
const legendaLista      = document.getElementById("legenda-lista");
const resultadoVazio    = document.getElementById("resultado-vazio");
const faseGrupos        = document.getElementById("fase-grupos");
const fasePlayoffs      = document.getElementById("fase-playoffs");
const gruposContainer   = document.getElementById("grupos-container");
const chaveContainer    = document.getElementById("chave-container");
const playoffsSubtitulo = document.getElementById("playoffs-subtitulo");

// ── LocalStorage ────────────────────────────
function getInscritos() {
  return JSON.parse(localStorage.getItem(CHAVE_INSCRITOS) || "[]");
}

function getSorteios() {
  return JSON.parse(localStorage.getItem(CHAVE_SORTEIOS) || "{}");
}

function salvarSorteio(esporte, dados) {
  const sorteios = getSorteios();
  sorteios[esporte] = dados;
  localStorage.setItem(CHAVE_SORTEIOS, JSON.stringify(sorteios));
}

function limparSorteio(esporte) {
  const sorteios = getSorteios();
  delete sorteios[esporte];
  localStorage.setItem(CHAVE_SORTEIOS, JSON.stringify(sorteios));
}

// ── Pega equipes (turmas) de um esporte ─────
function getEquipesPorEsporte(esporte) {
  const inscritos = getInscritos();
  const turmas = new Set();

  inscritos.forEach(i => {
    if (i.coletivos.includes(esporte) || i.individual === esporte) {
      turmas.add(i.turma);
    }
  });

  return [...turmas].sort();
}

// ── Formata turma: "3A" → "3º A" ────────────
function formatarTurma(turma) {
  return turma.replace(/(\d)([A-C])/, "$1º $2");
}

// ── Embaralha array (Fisher-Yates) ──────────
function embaralhar(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Gera confrontos todos-contra-todos ───────
function gerarRoundRobin(equipes) {
  const confrontos = [];
  for (let i = 0; i < equipes.length; i++) {
    for (let j = i + 1; j < equipes.length; j++) {
      confrontos.push([equipes[i], equipes[j]]);
    }
  }
  return confrontos;
}

// ── Divide em grupos equilibrados ────────────
function dividirEmGrupos(equipes, tamanhoGrupo = 4) {
  const grupos = [];
  const shuffled = embaralhar(equipes);
  for (let i = 0; i < shuffled.length; i += tamanhoGrupo) {
    grupos.push(shuffled.slice(i, i + tamanhoGrupo));
  }
  return grupos;
}

// ── Gera chave de mata-mata ──────────────────
function gerarMataMataSemiFinal(equipes) {
  const shuffled = embaralhar(equipes);
  const rodadas = [];

  // Rodada 1 (oitavas ou quartas dependendo do número)
  const r1 = [];
  for (let i = 0; i < shuffled.length; i += 2) {
    if (shuffled[i + 1]) {
      r1.push([shuffled[i], shuffled[i + 1]]);
    } else {
      r1.push([shuffled[i], "BYE"]); // equipe ímpar avança
    }
  }
  const labelR1 = shuffled.length > 8 ? "Oitavas de Final" : "Quartas de Final";
  rodadas.push({ label: labelR1, confrontos: r1 });

  // Semifinal (placeholder)
  const qtdSemi = Math.ceil(r1.length / 2);
  const semi = [];
  for (let i = 0; i < qtdSemi; i++) {
    semi.push(["Vencedor Jogo " + (i * 2 + 1), "Vencedor Jogo " + (i * 2 + 2)]);
  }
  rodadas.push({ label: "Semifinal", confrontos: semi });

  return rodadas;
}

// ── Atualiza UI ao trocar esporte ────────────
selEsporte.addEventListener("change", () => {
  const esporte = selEsporte.value;
  const equipes = getEquipesPorEsporte(esporte);

  // Info equipes
  if (equipes.length === 0) {
    infoEquipes.classList.add("hidden");
    avisoSemInscritos.classList.remove("hidden");
    btnSortear.disabled = true;
  } else {
    avisoSemInscritos.classList.add("hidden");
    infoEquipes.classList.remove("hidden");
    infoTexto.textContent = `${equipes.length} equipe${equipes.length > 1 ? "s" : ""} inscrita${equipes.length > 1 ? "s" : ""}`;
    infoModo.textContent = equipes.length > LIMITE_GRUPOS ? "Mata-mata" : "Fase de Grupos";
    btnSortear.disabled = false;
  }

  // Legenda
  renderizarLegenda(equipes);

  // Carrega sorteio salvo se existir
  const sorteios = getSorteios();
  if (sorteios[esporte]) {
    renderizarResultado(sorteios[esporte]);
  } else {
    mostrarVazio();
  }
});

// ── Legenda de equipes ───────────────────────
function renderizarLegenda(equipes) {
  if (equipes.length === 0) {
    legendaLista.innerHTML = '<p class="legenda-vazia">Nenhuma equipe inscrita.</p>';
    return;
  }

  legendaLista.innerHTML = equipes.map((eq, i) => `
    <div class="legenda-item">
      <div class="legenda-cor" style="background:${CORES_EQUIPES[i % CORES_EQUIPES.length]}"></div>
      <span>${formatarTurma(eq)}</span>
    </div>
  `).join("");
}

// ── Realiza o sorteio ────────────────────────
btnSortear.addEventListener("click", () => {
  const esporte = selEsporte.value;
  if (!esporte) return;

  const equipes = getEquipesPorEsporte(esporte);
  if (equipes.length === 0) return;

  let dados;

  if (equipes.length <= LIMITE_GRUPOS) {
    // Fase de grupos
    const grupos = dividirEmGrupos(equipes, 4);
    const gruposComConfrontos = grupos.map((eq, i) => ({
      nome: `Grupo ${String.fromCharCode(65 + i)}`,
      equipes: eq,
      confrontos: gerarRoundRobin(eq),
    }));

    dados = {
      modo: "grupos",
      esporte,
      equipes,
      grupos: gruposComConfrontos,
      pontosClassificacao: PONTOS_CLASSIFICACAO,
    };
  } else {
    // Mata-mata
    const rodadas = gerarMataMataSemiFinal(equipes);
    dados = {
      modo: "matamata",
      esporte,
      equipes,
      rodadas,
    };
  }

  salvarSorteio(esporte, dados);
  renderizarResultado(dados);
});

// ── Renderiza o resultado ────────────────────
function renderizarResultado(dados) {
  resultadoVazio.classList.add("hidden");

  if (dados.modo === "grupos") {
    fasePlayoffs.classList.add("hidden");
    faseGrupos.classList.remove("hidden");
    renderizarGrupos(dados);
  } else {
    faseGrupos.classList.add("hidden");
    fasePlayoffs.classList.remove("hidden");
    renderizarMataMAta(dados);
  }
}

// ── Renderiza fase de grupos ─────────────────
function renderizarGrupos(dados) {
  gruposContainer.innerHTML = dados.grupos.map(grupo => {
    const confrontosHTML = grupo.confrontos.map(([a, b]) => `
      <div class="confronto">
        <span class="equipe-nome">${formatarTurma(a)}</span>
        <span class="vs-badge">VS</span>
        <span class="equipe-nome direita">${formatarTurma(b)}</span>
      </div>
    `).join("");

    return `
      <div class="grupo-card">
        <div class="grupo-titulo">${grupo.nome}</div>
        ${confrontosHTML}
      </div>
    `;
  }).join("");
}

// ── Renderiza mata-mata ──────────────────────
function renderizarMataMAta(dados) {
  playoffsSubtitulo.textContent = "Sorteio até a Semifinal — Final definida em campo";

  chaveContainer.innerHTML = dados.rodadas.map((rodada, ri) => {
    const confrontosHTML = rodada.confrontos.map(([a, b], ci) => `
      <div class="confronto-card">
        <div class="equipe">
          <span>${typeof a === "string" && a.startsWith("Vencedor") ? "🏆 " + a : "🔵 " + formatarTurma(a)}</span>
        </div>
        <div class="separador">— VS —</div>
        <div class="equipe">
          <span>${typeof b === "string" && b.startsWith("Vencedor") ? "🏆 " + b : b === "BYE" ? "⏩ BYE (avança direto)" : "🔴 " + formatarTurma(b)}</span>
        </div>
      </div>
    `).join("");

    return `
      <div>
        <div class="rodada-titulo">${rodada.label}</div>
        <div class="confrontos-rodada">${confrontosHTML}</div>
      </div>
    `;
  }).join("");
}

// ── Mostra estado vazio ──────────────────────
function mostrarVazio() {
  resultadoVazio.classList.remove("hidden");
  faseGrupos.classList.add("hidden");
  fasePlayoffs.classList.add("hidden");
}

// ── Limpar sorteio ───────────────────────────
btnLimpar.addEventListener("click", () => {
  const esporte = selEsporte.value;
  if (!esporte) return;
  if (!confirm(`Limpar o sorteio de ${esporte}?`)) return;
  limparSorteio(esporte);
  mostrarVazio();
});

// ── Init ─────────────────────────────────────
mostrarVazio();