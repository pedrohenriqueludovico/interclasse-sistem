// =============================================
// classificacao.js — Lógica da página de classificação
//
// Lê de: localStorage["jogos"]      → resultados das partidas
//         localStorage["jogadores"] → destaque individual
// =============================================

const tableHeader = document.getElementById("table-header");
const tabelaBody  = document.getElementById("tabela-classificacao");
const listaJogs   = document.getElementById("jogadores-destaque");
const selEsporte  = document.getElementById("esporte");

// ── Dados do localStorage ────────────────────
function getJogos() {
  return JSON.parse(localStorage.getItem("jogos") || "[]");
}

function getJogadores() {
  return JSON.parse(localStorage.getItem("jogadores") || "[]");
}

// ── Cabeçalho da tabela por esporte ──────────
function renderHeader(esporte) {
  const base = `
    <th>Posição</th>
    <th>Time</th>
    <th>Vitórias</th>
    <th>Derrotas</th>
    <th>Rodada/Fase</th>
    <th>Vantagem</th>
  `;

  const headers = {
    Vôlei: `
      <th>Posição</th>
      <th>Time</th>
      <th>Sets Vencidos</th>
      <th>Vitórias</th>
      <th>Derrotas</th>
      <th>Rodada/Fase</th>
      <th>Vantagem</th>
    `,
    Xadrez: `
      <th>Posição</th>
      <th>Jogador</th>
      <th>Vitórias</th>
      <th>Derrotas</th>
      <th>Rodada/Fase</th>
      <th>Vantagem</th>
    `,
    default: `
      <th>Posição</th>
      <th>Time</th>
      <th>Pontos</th>
      <th>Vitórias</th>
      <th>Derrotas</th>
      <th>Rodada/Fase</th>
      <th>Vantagem</th>
    `,
  };

  tableHeader.innerHTML = headers[esporte] || headers.default;
}

// ── Calcula pontos por esporte ────────────────
function calcularPontos(esporte, classificacao, jogo) {
  const { timeA, timeB, pontosA, pontosB, rodada } = jogo;

  // Garante entrada dos dois times
  [timeA, timeB].forEach(time => {
    if (!classificacao[time]) {
      classificacao[time] = { time, pontos: 0, v: 0, d: 0, rodada: rodada || "" };
    }
  });

  const regras = {
    Futebol: () => {
      if (pontosA > pontosB)      { classificacao[timeA].pontos += 3; classificacao[timeA].v++; classificacao[timeB].d++; }
      else if (pontosB > pontosA) { classificacao[timeB].pontos += 3; classificacao[timeB].v++; classificacao[timeA].d++; }
      else                        { classificacao[timeA].pontos++; classificacao[timeB].pontos++; }
    },
    Xadrez: () => {
      if (pontosA > pontosB)      { classificacao[timeA].pontos++; classificacao[timeA].v++; classificacao[timeB].d++; }
      else if (pontosB > pontosA) { classificacao[timeB].pontos++; classificacao[timeB].v++; classificacao[timeA].d++; }
    },
  };

  const regra = regras[esporte] || (() => {
    // Basquete e Vôlei
    if (pontosA > pontosB)      { classificacao[timeA].pontos += 2; classificacao[timeA].v++; classificacao[timeB].d++; }
    else if (pontosB > pontosA) { classificacao[timeB].pontos += 2; classificacao[timeB].v++; classificacao[timeA].d++; }
  });

  regra();
}

// ── Encontra times com maior diferença de pts ─
function calcularVantagem(esporte) {
  const jogos = getJogos().filter(j => j.esporte === esporte);
  const maiores = {};

  jogos.forEach(j => {
    const diff = Math.abs(j.pontosA - j.pontosB);
    const vencedor = j.pontosA > j.pontosB ? j.timeA : j.timeB;
    if (!maiores[vencedor] || diff > maiores[vencedor]) {
      maiores[vencedor] = diff;
    }
  });

  const maiorDiff = Math.max(...Object.values(maiores), 0);
  return Object.entries(maiores)
    .filter(([, diff]) => diff === maiorDiff)
    .map(([time]) => time);
}

// ── Renderiza a tabela ────────────────────────
function calcularClassificacao(esporte) {
  const jogos = getJogos().filter(j => j.esporte === esporte);
  const classificacao = {};

  jogos.forEach(j => calcularPontos(esporte, classificacao, j));

  const timesOrdenados = Object.values(classificacao)
    .sort((a, b) => b.pontos - a.pontos);

  const timesComVantagem = calcularVantagem(esporte);

  if (timesOrdenados.length === 0) {
    tabelaBody.innerHTML = `<tr><td colspan="7" class="sem-dados">Nenhum resultado registrado ainda.</td></tr>`;
    return;
  }

  tabelaBody.innerHTML = timesOrdenados.map((t, i) => {
    const vantagemClass = timesComVantagem.includes(t.time) ? "vantagem" : "";
    const medalClass    = i === 0 ? "gold" : i === 1 ? "silver" : i === 2 ? "bronze" : "";
    const temVantagem   = timesComVantagem.includes(t.time) ? "✅" : "—";

    // Linha extra de "Sets Vencidos" só para Vôlei
    const colPontos = esporte !== "Xadrez"
      ? `<td>${t.pontos}</td>`
      : "";

    return `
      <tr class="${vantagemClass} ${medalClass}">
        <td>${i + 1}º</td>
        <td>${t.time}</td>
        ${colPontos}
        <td>${t.v}</td>
        <td>${t.d}</td>
        <td>${t.rodada}</td>
        <td>${temVantagem}</td>
      </tr>
    `;
  }).join("");
}

// ── Renderiza jogadores em destaque ──────────
function renderizarDestaque(esporte) {
  const top = getJogadores()
    .filter(j => j.esporte === esporte)
    .sort((a, b) => b.pontos - a.pontos)
    .slice(0, 5);

  if (top.length === 0) {
    listaJogs.innerHTML = '<li class="sem-dados">Nenhum jogador em destaque ainda.</li>';
    return;
  }

  const medalhas = ["🥇", "🥈", "🥉"];
  listaJogs.innerHTML = top.map((j, i) =>
    `<li>${medalhas[i] || "🏅"} <strong>${j.nome}</strong> (${j.time}) — ${j.pontos} pts</li>`
  ).join("");
}

// ── Atualiza tudo ao trocar esporte ──────────
function atualizar(esporte) {
  renderHeader(esporte);
  calcularClassificacao(esporte);
  renderizarDestaque(esporte);
}

// ── Eventos ───────────────────────────────────
selEsporte.addEventListener("change", e => atualizar(e.target.value));

// ── Init ─────────────────────────────────────
atualizar(selEsporte.value);