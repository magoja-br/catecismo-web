let dados = [];
let atual = null;
let audioAtual = null;

const apiKey = "AIzaSyCZncgfC5xGjvezIUled31DKe4xnqVDKDs"; // Substitua pela sua chave real
let vozSelecionada = "pt-BR-Chirp3-HD-Algieba";
let velocidade = 1.0;

fetch("catecismo_paragrafos.json")
  .then(res => res.json())
  .then(json => dados = json)
  .catch(() => alert("Erro ao carregar o JSON."));

function buscar() {
  const q = document.getElementById("busca").value.trim();
  const resultados = document.getElementById("resultados");
  resultados.innerHTML = "";

  if (!q || isNaN(q)) {
    resultados.innerHTML = "<p>Digite um número válido.</p>";
    return;
  }

  const alvo = parseInt(q);
  const encontrados = dados.filter(p => parseInt(p.numero) === alvo);

  if (encontrados.length === 0) {
    resultados.innerHTML = "<p>Parágrafo não encontrado.</p>";
    return;
  }

  atual = alvo;
  mostrarParagrafos(encontrados);
}

function buscarIntervalo() {
  const inicio = parseInt(document.getElementById("inicio").value.trim());
  const fim = parseInt(document.getElementById("fim").value.trim());
  const resultados = document.getElementById("resultados");
  resultados.innerHTML = "";

  if (isNaN(inicio) || isNaN(fim) || fim < inicio) {
    resultados.innerHTML = "<p>Digite um intervalo válido (ex: 500 a 505).</p>";
    return;
  }

  const encontrados = dados.filter(p => {
    const n = parseInt(p.numero);
    return n >= inicio && n <= fim;
  });

  if (encontrados.length === 0) {
    resultados.innerHTML = "<p>Nenhum parágrafo encontrado nesse intervalo.</p>";
    return;
  }

  atual = inicio;
  mostrarParagrafos(encontrados);
}

function mostrarParagrafos(lista) {
  const resultados = document.getElementById("resultados");
  resultados.innerHTML = "";

  let todosTextos = [];

  lista.forEach(p => {
    const textoOriginal = p.texto?.trim() || "";
    const textoEscapado = textoOriginal
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/`/g, '\\`');

    todosTextos.push(textoOriginal);

    const div = document.createElement("div");
    div.className = "paragrafo";
    div.innerHTML = `
      <span class="numero">§${p.numero}</span>: ${textoOriginal}
      <div class="button-column">
        <button onclick="lerTexto(\`${textoEscapado}\`)">▶️ Ouvir parágrafo</button>
        <button onclick="pararAudio()">⏹️ Parar áudio</button>
      </div>
    `;
    resultados.appendChild(div);
  });

  const nav = document.createElement("div");
  nav.className = "button-column";
  nav.innerHTML = `
    <button onclick="salto(-1)">⬅️ Parágrafo anterior</button>
    <button onclick="salto(1)">➡️ Próximo parágrafo</button>
    <button onclick="lerTodos()">▶️ Ouvir todos</button>
  `;
  resultados.appendChild(nav);

  window.textosParaLer = todosTextos;
}

function salto(direcao) {
  if (atual === null) return;

  const proximoNumero = atual + direcao;
  const encontrados = dados.filter(p => parseInt(p.numero) === proximoNumero);

  if (encontrados.length === 0) {
    alert(`Parágrafo §${proximoNumero} não encontrado.`);
    return;
  }

  atual = proximoNumero;
  mostrarParagrafos(encontrados);
}

function pararAudio() {
  if (audioAtual) {
    audioAtual.pause();
    audioAtual = null;
  }
}

function lerTexto(texto) {
  pararAudio();

  if (!texto || texto.length < 5) {
    alert("Texto inválido ou muito curto para leitura.");
    return Promise.resolve();
  }

  const body = {
    input: { text: texto },
    voice: {
      languageCode: "pt-BR",
      name: vozSelecionada
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: velocidade
    }
  };

  return fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
    .then(res => res.json())
    .then(data => {
      if (data.audioContent) {
        return new Promise(resolve => {
          audioAtual = new Audio("data:audio/mp3;base64," + data.audioContent);
          audioAtual.onended = resolve;
          audioAtual.onerror = resolve;
          audioAtual.play();
        });
      } else {
        alert("Erro ao gerar áudio.");
        return Promise.resolve();
      }
    })
    .catch(e => {
      alert("Erro ao conectar com a API do Google TTS.");
      console.error(e);
      return Promise.resolve();
    });
}

async function lerTodos() {
  pararAudio();

  for (const texto of window.textosParaLer) {
    await lerTexto(texto);
    await new Promise(resolve => setTimeout(resolve, 500)); // pausa entre parágrafos
  }
}

function atualizarVoz(v) {
  vozSelecionada = v;
}

function atualizarVelocidade(v) {
  velocidade = parseFloat(v);
  document.getElementById("velocidadeLabel").innerText = `🚀 Velocidade: ${Math.round(v * 100)}%`;
}