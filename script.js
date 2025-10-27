let dados = [];
dados = catecismoDados; // Carrega os dados da variável global
let atual = null;
let audioAtual = null;

// const apiKey = "chave"; // REMOVIDA OU COMENTADA
let vozSelecionada = "pt-BR-Chirp3-HD-Algieba";
let velocidade = 1.0;

// --- Funções de Busca ---
function buscar() {
  pararAudio(); // Para áudio/destaque/loop ao fazer nova busca
  const q = document.getElementById("busca").value.trim();
  const resultados = document.getElementById("resultados");
  resultados.innerHTML = ""; // Limpa resultados anteriores

  if (!q || isNaN(q)) {
    resultados.innerHTML = "<p>Por favor, digite um número de parágrafo válido.</p>";
    return;
  }

  const alvo = parseInt(q);
  const encontrados = dados.filter(p => parseInt(p.numero) === alvo);

  if (encontrados.length === 0) {
    resultados.innerHTML = `<p>Parágrafo §${alvo} não encontrado.</p>`;
    return;
  }

  atual = alvo; // Guarda o número do parágrafo atual para navegação
  mostrarParagrafos(encontrados);
}

function buscarIntervalo() {
  pararAudio(); // Para áudio/destaque/loop ao fazer nova busca
  const inicioInput = document.getElementById("inicio").value.trim();
  const fimInput = document.getElementById("fim").value.trim();
  const resultados = document.getElementById("resultados");
  resultados.innerHTML = ""; // Limpa resultados anteriores

  const inicio = parseInt(inicioInput);
  const fim = parseInt(fimInput);

  if (isNaN(inicio) || isNaN(fim) || fim < inicio || inicio <= 0) {
    resultados.innerHTML = "<p>Por favor, digite um intervalo de parágrafos válido (ex: 500 a 505).</p>";
    return;
  }

  const encontrados = dados.filter(p => {
    const n = parseInt(p.numero);
    return n >= inicio && n <= fim;
  });

  if (encontrados.length === 0) {
    resultados.innerHTML = `<p>Nenhum parágrafo encontrado no intervalo de ${inicio} a ${fim}.</p>`;
    return;
  }

  atual = inicio; // Guarda o número do primeiro parágrafo do intervalo
  mostrarParagrafos(encontrados);
}

// --- Função para Exibir Parágrafos (MODIFICADA) ---
function mostrarParagrafos(lista) {
  const resultados = document.getElementById("resultados");
  resultados.innerHTML = ""; // Limpa antes de adicionar novos

  let todosTextosParaLeitura = []; // Array para guardar IDs e Textos

  lista.forEach(p => {
    const numeroParagrafo = p.numero;
    const textoOriginal = p.texto?.trim() || "Texto não disponível";

    const textoParaFuncaoOuvir = textoOriginal
      .replace(/\\/g, '\\\\') 
      .replace(/`/g, '\\`')   
      .replace(/"/g, '\\"');  

    const paragrafoId = `paragrafo-${numeroParagrafo}`;
    todosTextosParaLeitura.push({ id: paragrafoId, texto: textoOriginal }); 

    const div = document.createElement("div");
    div.className = "paragrafo";
    div.id = paragrafoId; // Adiciona um ID único ao parágrafo
    div.innerHTML = `
      <span class="numero">§${numeroParagrafo}</span>: ${textoOriginal}
      <div class="button-column">
        <button onclick="lerParagrafoUnico('${paragrafoId}', \`${textoParaFuncaoOuvir}\`)">▶️ Ouvir §${numeroParagrafo}</button>
        <button onclick="pararAudio()">⏹️ Parar Áudio</button>
      </div>
    `;
    resultados.appendChild(div);
  });

  // Adiciona botões de navegação e "Ouvir Todos"
  if (lista.length > 0) {
    const nav = document.createElement("div");
    nav.className = "button-column"; 
    nav.style.marginTop = "20px"; 
    nav.innerHTML = `
      <button onclick="salto(-1)">⬅️ Anterior (§${atual - 1})</button>
      <button onclick="lerTodos()">▶️ Ouvir Tudo (${lista.length} ${lista.length === 1 ? 'parág.' : 'parágs.'})</button>
      <button onclick="salto(1)">➡️ Próximo (§${atual + 1})</button>
    `;
    resultados.appendChild(nav);
  }

  // Guarda os OBJETOS (id + texto) na variável global
  window.textosParaLer = todosTextosParaLeitura;
}

// --- Funções de Navegação ---
function salto(direcao) {
  pararAudio(); // Garante que o áudio e o destaque parem ao navegar
  
  if (atual === null) {
    alert("Busque um parágrafo primeiro para poder navegar.");
    return;
  }

  const proximoNumero = atual + direcao;

  if (proximoNumero <= 0) {
      alert("Já está no início.");
      return;
  }

  const proximoParagrafo = dados.find(p => parseInt(p.numero) === proximoNumero);

  if (!proximoParagrafo) {
    alert(`Parágrafo §${proximoNumero} não encontrado no Catecismo.`);
    return;
  }

  atual = proximoNumero;
  mostrarParagrafos([proximoParagrafo]); 
  document.getElementById("busca").value = atual; 
}


// --- Funções de Áudio (CORRIGIDAS) ---

// Função auxiliar que SÓ para o áudio
function pararAudioAtual() {
  if (audioAtual) {
    audioAtual.pause();
    audioAtual.currentTime = 0; 
    audioAtual = null;
    console.log("Áudio atual parado.");
  }
}

// Função principal de parada (para o botão e interrupção)
function pararAudio() {
  pararAudioAtual(); // Chama a função auxiliar
  window.pararLeituraTodos = true; // Define a flag de interrupção
  console.log("Parada solicitada pelo usuário.");

  // Remove o destaque
  const paragrafoLendo = document.querySelector('.paragrafo.lendo-agora');
  if (paragrafoLendo) {
    paragrafoLendo.classList.remove('lendo-agora');
  }
}

// *** NOVA FUNÇÃO ADICIONADA ***
// Wrapper para ler um único parágrafo com destaque e scroll
async function lerParagrafoUnico(paragrafoId, texto) {
  pararAudio(); // Para qualquer áudio/loop anterior
  window.pararLeituraTodos = false; // Garante que a flag esteja limpa

  const elemento = document.getElementById(paragrafoId);
  if (!elemento) return; // Sai se o elemento não for encontrado

  elemento.classList.add('lendo-agora'); // Adiciona destaque
  elemento.scrollIntoView({ behavior: 'smooth', block: 'center' }); // Rola para o centro

  try {
    await lerTexto(texto); // Chama a função de áudio e espera
  } catch (error) {
    console.error("Erro ao ler parágrafo único:", error);
    // O catch em lerTexto() já deve ter mostrado o alerta
  } finally {
    // Remove o destaque quando terminar ou se der erro
    // (A flag pararLeituraTodos será 'false' a menos que o botão Parar seja clicado durante a leitura)
    if (!window.pararLeituraTodos) { 
       elemento.classList.remove('lendo-agora');
    }
  }
}


// 'lerTexto' agora é principalmente para o áudio
function lerTexto(texto) {
  pararAudioAtual(); // MUDANÇA AQUI: Chama a auxiliar para não parar o loop 'lerTodos'

  // Verifica se o texto é válido
  if (!texto || texto.length < 5) {
    alert("Texto inválido ou muito curto para leitura.");
    return Promise.resolve(); 
  }

  // Dados que serão enviados para o seu servidor backend
  const bodyParaBackend = {
    text: texto,
    voice: vozSelecionada,
    speed: velocidade
  };

  // URL do seu servidor backend
  const backendUrl = 'http://localhost:3000/synthesize';

  console.log("Enviando texto para backend:", backendUrl, bodyParaBackend); 

  // Faz a chamada (fetch) para o SEU servidor backend
  return fetch(backendUrl, {
    method: "POST", 
    headers: {
      "Content-Type": "application/json" 
    },
    body: JSON.stringify(bodyParaBackend) 
  })
  .then(res => {
    console.log("Resposta recebida do backend, status:", res.status); 
    if (!res.ok) {
       return res.json().catch(() => null).then(errData => {
          const errorMessage = errData?.error || `Erro do servidor: ${res.status} ${res.statusText}`;
          console.error("Erro na resposta do backend:", errorMessage);
          throw new Error(errorMessage); 
       });
    }
    return res.json();
  })
  .then(data => {
    if (data.audioContent) {
      console.log("AudioContent recebido do backend."); 
      return new Promise((resolve, reject) => {
        audioAtual = new Audio("data:audio/mp3;base64," + data.audioContent);
        audioAtual.onended = () => {
          console.log("Reprodução de áudio concluída."); 
          resolve(); 
        };
        audioAtual.onerror = (e) => {
          console.error("Erro ao carregar ou reproduzir o áudio:", e);
          alert("Erro ao reproduzir o áudio recebido do servidor.");
          reject(e); 
        };
        audioAtual.play().catch(e => {
             console.error("Erro ao tentar iniciar a reprodução:", e);
             alert("Não foi possível iniciar a reprodução do áudio (verifique permissões do navegador ou clique novamente).");
             reject(e); 
         });
      });
    } else {
      console.error("Resposta do backend sem audioContent:", data);
      alert("Erro inesperado: O servidor não retornou o áudio.");
      return Promise.reject(new Error("Resposta do backend inválida (sem audioContent)")); 
    }
  })
  .catch(e => {
    alert(`Não foi possível conectar ao servidor de áudio: ${e.message}`);
    console.error("Erro durante a chamada ao backend ou processamento:", e);
    return Promise.reject(e);
  });
}

// Função para ler todos os parágrafos exibidos em sequência
async function lerTodos() {
  pararAudio(); // Garante que qualquer áudio anterior pare
  window.pararLeituraTodos = false; // Flag para permitir interrupção

  if (!window.textosParaLer || window.textosParaLer.length === 0) {
    alert("Não há parágrafos exibidos para ler.");
    return;
  }

  console.log(`Iniciando leitura de ${window.textosParaLer.length} parágrafo(s).`);

  let paragrafoAtualElement = null; // Guarda o elemento atual

  try {
    for (const item of window.textosParaLer) {
      // Verifica se o usuário pediu para parar
      if (window.pararLeituraTodos) {
        console.log("Leitura de todos interrompida pelo usuário.");
        break; 
      }

      paragrafoAtualElement = document.getElementById(item.id);
      if (paragrafoAtualElement) {
        // Rola o parágrafo para o centro da tela suavemente
        paragrafoAtualElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        paragrafoAtualElement.classList.add('lendo-agora'); // Adiciona destaque
      }

      console.log(`Lendo ${item.id}...`);
      await lerTexto(item.texto); // Espera a leitura do texto terminar

      if (paragrafoAtualElement) {
        paragrafoAtualElement.classList.remove('lendo-agora'); // Remove destaque
      }
      
      paragrafoAtualElement = null; // Limpa a referência

      if (!window.pararLeituraTodos) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Pausa entre parágrafos
      }
    }
    console.log("Leitura de todos concluída ou interrompida.");
  } catch (error) {
    console.error("Erro durante a leitura sequencial:", error);
    if (paragrafoAtualElement) {
      paragrafoAtualElement.classList.remove('lendo-agora');
    }
  } finally {
    window.pararLeituraTodos = false;
    const destaqueRestante = document.querySelector('.paragrafo.lendo-agora');
    if (destaqueRestante) {
        destaqueRestante.classList.remove('lendo-agora');
    }
  }
}

// --- Funções de Configuração ---
function atualizarVoz(v) {
  vozSelecionada = v;
  console.log("Voz selecionada:", vozSelecionada);
}

function atualizarVelocidade(v) {
  velocidade = parseFloat(v);
  document.getElementById("velocidadeLabel").innerText = `🚀 Velocidade: ${Math.round(v * 100)}%`;
  console.log("Velocidade ajustada:", velocidade);
}

// Inicializa a label da velocidade quando a página carrega
document.addEventListener('DOMContentLoaded', () => {
    const rangeInput = document.querySelector('input[type="range"]');
    if (rangeInput) {
        atualizarVelocidade(rangeInput.value); // Define o valor inicial da label
    }
});