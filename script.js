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

function mostrarParagrafos(lista) {
  const resultados = document.getElementById("resultados");
  resultados.innerHTML = "";

  lista.forEach(p => {
    const div = document.createElement("div");
    div.className = "paragrafo";
    div.innerHTML = `
      <span class="numero">§${p.numero}</span>: ${p.texto}
      <br><br>
      <div class="button-group">
        <button onclick="lerTexto(\`${p.texto.replace(/`/g, '\\`')}\`)">▶️ Ouvir</button>
        <button onclick="pararAudio()">⏹️ Parar</button>
      </div>
    `;
    resultados.appendChild(div);
  });

  const nav = document.createElement("div");
  nav.className = "button-group";
  nav.innerHTML = `
    <button onclick="salto(-1)">⬅️ Número Anterior</button>
    <button onclick="salto(1)">➡️ Número Seguinte</button>
  `;
  resultados.appendChild(nav);
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

async function lerTexto(texto) {
  pararAudio();

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

  try {
    const response = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }
    );

    const data = await response.json();
    if (data.audioContent) {
      audioAtual = new Audio("data:audio/mp3;base64," + data.audioContent);
      audioAtual.play();
    } else {
      alert("Erro ao gerar áudio.");
    }
  } catch (e) {
    alert("Erro ao conectar com a API do Google TTS.");
    console.error(e);
  }
}

function atualizarVoz(v) {
  vozSelecionada = v;
}

function atualizarVelocidade(v) {
  velocidade = parseFloat(v);
  document.getElementById("velocidadeLabel").innerText = `Velocidade: ${Math.round(v * 100)}%`;
}
