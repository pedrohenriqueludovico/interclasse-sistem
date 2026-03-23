const form = document.getElementById('form-jogo');
const listaJogos = document.getElementById('lista-jogos');
const btnLimpar = document.getElementById('btn-limpar');
let jogos = JSON.parse(localStorage.getItem('jogos')) || [];

function ordenarRodadas(a, b) {
  const ordemEspecial = ["quartas", "semifinal", "final"];
  const rodadaA = a.rodada.toLowerCase();
  const rodadaB = b.rodada.toLowerCase();

  const numA = parseInt(rodadaA);
  const numB = parseInt(rodadaB);
  const isNumA = !isNaN(numA);
  const isNumB = !isNaN(numB);

  if (isNumA && isNumB) return numA - numB;
  if (isNumA) return -1;
  if (isNumB) return 1;

  const idxA = ordemEspecial.indexOf(rodadaA);
  const idxB = ordemEspecial.indexOf(rodadaB);

  if (idxA === -1 && idxB === -1) return rodadaA.localeCompare(rodadaB);
  if (idxA === -1) return 1;
  if (idxB === -1) return -1;

  return idxA - idxB;
}

function atualizarTabela() {
  listaJogos.innerHTML = jogos
    .sort(ordenarRodadas)
    .map(j => `
      <tr>
        <td>${j.rodada}</td>
        <td>${j.esporte}</td>
        <td>${j.timeA}</td>
        <td>${j.pontosA} x ${j.pontosB}</td>
        <td>${j.timeB}</td>
      </tr>
    `).join('');
}

form.addEventListener('submit', e => {
  e.preventDefault();
  const jogo = {
    esporte: document.getElementById('esporte').value,
    rodada: document.getElementById('rodada').value.trim(),
    timeA: document.getElementById('timeA').value.trim(),
    pontosA: parseInt(document.getElementById('pontosA').value),
    timeB: document.getElementById('timeB').value.trim(),
    pontosB: parseInt(document.getElementById('pontosB').value)
  };
  jogos.push(jogo);
  localStorage.setItem('jogos', JSON.stringify(jogos));
  atualizarTabela();
  form.reset();
});

btnLimpar.addEventListener('click', () => {
  if (confirm('Deseja realmente apagar todos os resultados?')) {
    jogos = [];
    localStorage.removeItem('jogos');
    atualizarTabela();
  }
});

atualizarTabela();
