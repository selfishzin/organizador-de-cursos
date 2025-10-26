// ===================================
// ARQUIVO main.js (com Rolagem para o Topo Corrigida, Pomodoro Fixo e Animações)
// ===================================

// --- Variáveis Globais ---
let db = null;
let firebaseInicializado = false;
let currentPlaylistId = null;
let videoProgress = {};
// --- IDEIA 3 ---
let allVideosCompletos = []; // Agora é global para stats
// --- IDEIA 2 ---
let pomodoroTimer = null; // (em segundos)
let pomodoroInterval = null;
let isPomodoroRunning = false;
let isPausa = false;
let activeYoutubePlayer = null; // Guarda o player de vídeo ativo

// --- Referências ao DOM (declaradas aqui, atribuídas no DOMContentLoaded) ---
let themeToggle = null;
let playlistUrlInput = null;
let carregarBtn = null;
let esforcoPorDiaInput = null;
let videosContainer = null;
let resetProgressBtn = null;
let reviewQueueContainer = null;
let reviewQueueItems = null;
// --- IDEIA 2 (Pomodoro) ---
let pomodoroDisplay = null;
let pomodoroStartBtn = null;
let pomodoroResetBtn = null;
// --- IDEIA 3 (Stats) ---
let statPercentual = null;
let statConcluidos = null;
let statEsforco = null;


// --- TENTA INICIALIZAR FIREBASE IMEDIATAMENTE (NÃO ALTERADO) ---
console.log("Tentando inicializar Firebase (topo do main.js)...");
try {
    if (typeof firebase === 'undefined') { throw new Error("Objeto Firebase global não encontrado! SDK não carregou?"); }
    if (typeof firebaseConfig === 'undefined') { throw new Error("Objeto firebaseConfig global não encontrado! Verifique config.js."); }
    console.log("Firebase e Config encontrados no topo. Tentando inicializar...");
    if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); console.log("Firebase app inicializado no topo."); }
    else { firebase.app(); console.log("Firebase app já inicializado (topo)."); }
    db = firebase.firestore();
    if (!db) { throw new Error("Falha ao obter instância do Firestore!"); }
    console.log("Instância do Firestore obtida com sucesso no topo.");
    firebaseInicializado = true;
} catch(e) { console.error("Erro CRÍTICO durante inicialização do Firebase no topo:", e); alert(`Erro GRAVE ao inicializar Firebase: ${e.message}. Verifique o console.`); }
// --- FIM DA INICIALIZAÇÃO FIREBASE ---


// --- Lógica do Tema ---
function setTheme(theme) { 
    try { 
        document.documentElement.setAttribute('data-theme', theme); 
        if (themeToggle) themeToggle.textContent = (theme === 'dark') ? '🌙' : '☀️'; 
        localStorage.setItem('meuTema', theme); 
    } catch(e) { console.error("Erro no setTheme:", e); } 
}

// --- Lógica de Progresso com Firestore ---
async function loadProgress(playlistId) { 
    videoProgress = {}; 
    if (!playlistId || !firebaseInicializado) { console.warn("Pulando loadProgress (DB não pronto ou sem ID)."); return; } 
    console.log("Tentando carregar progresso:", playlistId); 
    try { 
        const docRef = db.collection('progress').doc(playlistId); 
        const docSnap = await docRef.get(); 
        if (docSnap.exists) { 
            videoProgress = docSnap.data(); 
            console.log("Progresso carregado:", videoProgress); 
        } else { console.log("Nenhum progresso salvo."); } 
    } catch (error) { console.error("Erro loadProgress:", error); showToast("Erro carregar progresso.", "warning"); } 
}

// --- saveProgress atualizado (Ideia 1) ---
async function saveProgress(playlistId, videoId, isChecked, anotacao = null) { 
    if (!playlistId || !videoId || !firebaseInicializado) { console.warn("Pulando saveProgress."); return; } 
    const docRef = db.collection('progress').doc(playlistId); 
    let updateData = {}; 
    
    if (isChecked) { 
        const progressoAtual = videoProgress[videoId];
        let dataParaSalvar;

        if (typeof progressoAtual === 'object' && progressoAtual.statusRevisao) {
            dataParaSalvar = { ...progressoAtual, anotacao: anotacao };
        } else {
            dataParaSalvar = {
                anotacao: anotacao,
                statusRevisao: 1, 
                dataConclusao: new Date().toISOString()
            };
        }
        updateData[videoId] = dataParaSalvar;
        videoProgress[videoId] = dataParaSalvar;
        
    } else { 
        updateData[videoId] = firebase.firestore.FieldValue.delete(); 
        delete videoProgress[videoId];
    } 
    
    try { 
        await docRef.set(updateData, { merge: true }); 
        console.log(`Progresso salvo: ${videoId} (${isChecked})`, updateData[videoId]); 
    } catch (error) { 
        console.error("Erro saveProgress:", error); 
        showToast("Erro salvar progresso.", "warning"); 
        const checkbox = document.querySelector(`input[data-video-id="${videoId}"]`); 
        if(checkbox) checkbox.checked = !isChecked; 
    } 
    
    // --- IDEIA 3 (Atualiza stats após salvar) ---
    atualizarPainelDeProgresso();
}

// --- Função checkDayCompletion ---
function checkDayCompletion(diaConteudoElement) { 
    try{ 
        if (!diaConteudoElement) return false; 
        const allCheckboxes = diaConteudoElement.querySelectorAll('input[type="checkbox"]'); 
        if (allCheckboxes.length === 0) return false; 
        const checkedCheckboxes = diaConteudoElement.querySelectorAll('input[type="checkbox"]:checked'); 
        const diaHeader = diaConteudoElement.previousElementSibling; 
        if (!diaHeader) return false; 
        const emojiSpan = diaHeader.querySelector('.completion-emoji'); 
        if (!emojiSpan) return false; 
        if (allCheckboxes.length === checkedCheckboxes.length) { 
            emojiSpan.textContent = '✅'; 
            emojiSpan.classList.add('completed'); 
            return true; 
        } else { 
            emojiSpan.textContent = ''; 
            emojiSpan.classList.remove('completed'); 
            return false; 
        } 
    } catch(e){ console.error("Erro checkDayCompletion:", e); return false;} 
}

// --- Funções UI ---
function showToast(message, type = 'info') { 
    try{ 
        const toast = document.getElementById('toast-message'); 
        if (!toast) return; 
        toast.textContent = message; 
        toast.className = ''; 
        toast.classList.add('show'); 
        if (type === 'warning') { toast.classList.add('toast-warning'); } 
        const duration = (type === 'warning') ? 5000 : 2500; 
        setTimeout(() => { toast.classList.remove('show'); }, duration); 
    } catch(e){ console.error("Erro showToast:",e);}
}

function openDay(diaConteudo) { 
    try{ 
        if (!diaConteudo) return; 
        // Remove a classe de animação de entrada se estiver presente
        const diaElement = diaConteudo.closest('.dia');
        if(diaElement) diaElement.classList.remove('day-next-animation');

        if (!diaConteudo.dataset.loaded) { 
            const placeholders = diaConteudo.querySelectorAll('.video-placeholder'); 
            placeholders.forEach(placeholder => { 
                const videoId = placeholder.dataset.videoId; 
                if (typeof YT !== 'undefined' && typeof YT.Player !== 'undefined') { 
                    // Cria o player e armazena a referência para o player ativo
                    const player = new YT.Player(placeholder, { 
                        videoId: videoId, 
                        playerVars: { 'origin': window.location.origin }, 
                        events: { 
                            'onStateChange': onPlayerStateChange,
                            'onReady': (event) => {
                                // Assume que o primeiro player pronto no dia aberto é o ativo
                                activeYoutubePlayer = event.target;
                            }
                        } 
                    }); 
                } else { 
                    console.error("API YouTube Player não pronta."); 
                    showToast("Erro player YouTube.", "warning"); 
                } 
            }); 
            diaConteudo.dataset.loaded = 'true'; 
        } else {
            // Se o dia já estava carregado, mas foi reaberto, tenta encontrar o player novamente
            const iframe = diaConteudo.querySelector('iframe');
            if (iframe && iframe.id) {
                // Tenta obter a referência do player API
                activeYoutubePlayer = YT.get(iframe.id); 
            }
        }
        
        // Lógica de abertura do acordeão (maxHeight)
        const currentTransition = diaConteudo.style.transition; 
        diaConteudo.style.transition = ''; 
        diaConteudo.style.maxHeight = 'none'; 
        const scrollHeight = diaConteudo.scrollHeight; 
        diaConteudo.style.maxHeight = '0px'; 
        diaConteudo.offsetHeight; 
        diaConteudo.style.transition = currentTransition; 
        diaConteudo.style.paddingTop = '20px'; 
        diaConteudo.style.paddingBottom = '20px'; 
        diaConteudo.style.maxHeight = scrollHeight + "px"; 

    } catch(e){ console.error("Erro openDay:",e);}
}

function closeDay(diaConteudo) { 
    try{ 
        // Pausa qualquer player ativo ao fechar o dia
        if (activeYoutubePlayer && typeof activeYoutubePlayer.pauseVideo === 'function') {
            activeYoutubePlayer.pauseVideo();
        }
        activeYoutubePlayer = null; // Limpa o player ativo

        if (!diaConteudo) return; 
        diaConteudo.style.paddingTop = '0'; 
        diaConteudo.style.paddingBottom = '0'; 
        setTimeout(() => { 
            if (diaConteudo) diaConteudo.style.maxHeight = "0px"; 
        }, 50); 
    } catch(e){ console.error("Erro closeDay:",e);}
}

function getFraseDeEsforco(pontos) { 
    try{ 
        const configA = (typeof CONFIG_APRENDIZADO !== 'undefined') ? CONFIG_APRENDIZADO : {}; 
        const frases = configA.FRASES_DE_ESFORCO || [{ limite: 10, frase: "Bom dia!" },{ limite: 99, frase: "Dia de esforço!" }]; 
        for (const item of frases) { 
            if (pontos <= item.limite) { 
                return item.frase; 
            } 
        } 
        return frases[frases.length - 1].frase; 
    } catch(e){ console.error("Erro getFrase:",e); return "";}
}

function logarConclusaoDeDia() { 
    try{ 
        const hoje = new Date().toDateString(); 
        let logConclusao = JSON.parse(localStorage.getItem('logConclusao')) || {}; 
        if (logConclusao.data !== hoje) { 
            logConclusao = { data: hoje, count: 0 }; 
        } 
        logConclusao.count++; 
        localStorage.setItem('logConclusao', JSON.stringify(logConclusao)); 
        return logConclusao.count; 
    } catch(e){ console.error("Erro logConclusao:",e); return 1;}
}

function autoOpenAndHighlightNextDay() { 
    try{ 
        document.querySelectorAll('.dia-destacado').forEach(el => el.classList.remove('dia-destacado')); 
        const todosOsDias = document.querySelectorAll('.dia'); 
        for (const diaElement of todosOsDias) { 
            const diaHeader = diaElement.querySelector('.dia-header'); 
            const diaConteudo = diaElement.querySelector('.dia-conteudo'); 
            if (!diaHeader || !diaConteudo) continue; 
            const emojiSpan = diaHeader.querySelector('.completion-emoji'); 
            if (!emojiSpan || !emojiSpan.classList.contains('completed')) { 
                // Aplica a animação de entrada
                diaElement.classList.add('dia-destacado', 'day-next-animation');
                openDay(diaConteudo); 
                
                // --- CORREÇÃO DE ROLAGEM: Rola para o TOPO (block: 'start') com um pequeno atraso para a animação
                setTimeout(() => { 
                    // Rola para o topo do cabeçalho
                    if(diaHeader) diaHeader.scrollIntoView({ behavior: 'smooth', block: 'start' }); 
                }, 300);

                return true; // Retorna true assim que encontra e abre o dia
            } 
        } 
        return false; // Retorna false se todos os dias estiverem completos
    } catch(e){ console.error("Erro autoOpen:",e); return false;}
}

// --- NOVA FUNÇÃO DE TRANSIÇÃO (SMOOTH) ---
function smoothDayTransition(diaElementConcluido) {
    // 1. Aplica animação de saída no dia concluído
    // Fecha o conteúdo antes de iniciar a animação de desaparecimento
    const diaConteudo = diaElementConcluido.querySelector('.dia-conteudo');
    if (diaConteudo) closeDay(diaConteudo);

    // Adiciona a classe de animação de saída
    diaElementConcluido.classList.add('day-complete-animation');

    // 2. Define o tempo para o fade-out e o atraso para a próxima ação
    const totalDelay = 700; 

    setTimeout(() => {
        // 3. Abre o próximo dia com animação de entrada
        autoOpenAndHighlightNextDay();
    }, totalDelay);
}
// --- FIM NOVA FUNÇÃO ---

// --- Lógica de Carregamento da Página ---
document.addEventListener('DOMContentLoaded', () => {
     console.log("DOMContentLoaded disparado.");
     
     // --- Atribuição dos elementos do DOM ---
     themeToggle = document.getElementById('theme-toggle');
     playlistUrlInput = document.getElementById('playlistUrl');
     carregarBtn = document.getElementById('carregarPlaylist');
     esforcoPorDiaInput = document.getElementById('esforcoPorDia');
     videosContainer = document.getElementById('videosContainer');
     resetProgressBtn = document.getElementById('resetProgress');
     reviewQueueContainer = document.getElementById('reviewQueueContainer');
     reviewQueueItems = document.getElementById('reviewQueueItems');
     // --- IDEIA 2 (Pomodoro) ---
     pomodoroDisplay = document.getElementById('pomodoro-display');
     pomodoroStartBtn = document.getElementById('pomodoro-start');
     pomodoroResetBtn = document.getElementById('pomodoro-reset');
     // --- IDEIA 3 (Stats) ---
     statPercentual = document.getElementById('stat-percentual');
     statConcluidos = document.getElementById('stat-concluidos');
     statEsforco = document.getElementById('stat-esforco');
     // --- Fim da Atribuição ---

     try { 
         if (!firebaseInicializado) { 
             console.error("Inicialização Firebase falhou."); 
             if(videosContainer) videosContainer.innerHTML = `<p style="color: red;">Falha ao conectar com o Banco de Dados. Verifique o console.</p>`; 
             return; 
         } 
         if (!themeToggle || !playlistUrlInput || !carregarBtn || !esforcoPorDiaInput || !videosContainer || !resetProgressBtn || !reviewQueueContainer || !reviewQueueItems || !pomodoroDisplay || !pomodoroStartBtn || !pomodoroResetBtn || !statPercentual || !statConcluidos || !statEsforco) { 
             console.error("Erro crítico: Elementos essenciais do DOM não encontrados!"); 
             alert("Erro: A interface não carregou corretamente."); 
             return; 
         } 
         console.log("Elementos do DOM encontrados com sucesso.");

         // --- AddEventListeners ---
         themeToggle.addEventListener('click', () => { 
             try { 
                 const currentTheme = document.documentElement.getAttribute('data-theme') || 'light'; 
                 const newTheme = (currentTheme === 'light') ? 'dark' : 'light'; 
                 setTheme(newTheme); 
             } catch(e) { console.error("Erro no clique do tema:", e); } 
         });
         carregarBtn.addEventListener('click', handleLoadPlaylist);
         resetProgressBtn.addEventListener('click', async () => { 
             if (!firebaseInicializado) { showToast("Erro DB.", "warning"); return; } 
             const confirmReset = prompt("Digite 'SIM' para limpar todo o progresso (ação permanente):");
             if (confirmReset === 'SIM') { 
                 if (currentPlaylistId) { 
                     try { 
                         const docRef = db.collection('progress').doc(currentPlaylistId); 
                         await docRef.delete(); 
                         localStorage.removeItem('logConclusao'); 
                         videoProgress = {}; 
                         await handleLoadPlaylist(); 
                         showToast("Progresso resetado!", "info"); 
                     } catch (error) { 
                         console.error("Erro resetProgress:", error); 
                         showToast("Erro ao resetar.", "warning"); 
                     } 
                 } else { showToast("Nenhuma playlist carregada.", "info"); } 
             } else {
                 showToast("Reset cancelado.", "info");
             }
         });
         // --- IDEIA 2 (Listeners Pomodoro) ---
         pomodoroStartBtn.addEventListener('click', startPomodoro);
         pomodoroResetBtn.addEventListener('click', resetPomodoro);
         // --- FIM IDEIA 2 ---
         
         // --- Fim dos Listeners ---

         resetPomodoro(); // Define o tempo inicial no display
         const savedTheme = localStorage.getItem('meuTema') || 'light'; 
         setTheme(savedTheme); 
         const savedEsforco = localStorage.getItem('meuEsforcoPorDia') || (typeof CONFIG_ESFORCO !== 'undefined' ? CONFIG_ESFORCO.ORCAMENTO_DIARIO_PADRAO : 10); 
         esforcoPorDiaInput.value = savedEsforco; 
         let urlParaCarregar = null; 
         const urlSalva = localStorage.getItem('minhaPlaylistSalva'); 
         const urlPadrao = (typeof PLAYLIST_PADRAO_URL !== 'undefined') ? PLAYLIST_PADRAO_URL : null; 
         
         if (urlSalva) { urlParaCarregar = urlSalva; } 
         else if (urlPadrao) { urlParaCarregar = urlPadrao; } 
         
         if (urlParaCarregar) { 
             playlistUrlInput.value = urlParaCarregar; 
             handleLoadPlaylist(); 
         } else { 
             console.log("Nenhuma playlist salva/padrão."); 
             if(videosContainer) videosContainer.innerHTML = '<p class="loading-message">Cole o link da playlist e clique em Carregar.</p>'; 
         } 
     }
     catch(e) { 
         console.error("Erro CRÍTICO DOMContentLoaded:", e); 
         alert(`Erro GRAVE: ${e.message}.`); 
         if(videosContainer) videosContainer.innerHTML = `<p style="color: red;">Erro Grave. Verifique o console.</p>`; 
     }
});

// --- Lógica do Botão Carregar ---
async function handleLoadPlaylist() { 
    console.log("handleLoadPlaylist iniciado"); 
    if (!firebaseInicializado) { showToast("Erro: DB não conectado.", "warning"); return; } 
    if (!playlistUrlInput || !esforcoPorDiaInput) { console.error("Inputs não encontrados"); return; } 
    
    // Limpa UI
    if (reviewQueueContainer) reviewQueueContainer.style.display = 'none';
    if (reviewQueueItems) reviewQueueItems.innerHTML = '';
    allVideosCompletos = []; // Reseta array global
    atualizarPainelDeProgresso(); // Reseta stats
    resetPomodoro(); // Reseta timer

    const playlistUrl = playlistUrlInput.value; 
    if (!playlistUrl) { showToast("Insira uma URL de playlist.", "info"); return; } 
    
    localStorage.setItem('minhaPlaylistSalva', playlistUrl); 
    localStorage.setItem('meuEsforcoPorDia', esforcoPorDiaInput.value); 
    
    const playlistIdMatch = playlistUrl.match(/[?&]list=([^&]+)/); 
    if (!playlistIdMatch) { 
        showToast('URL da playlist parece inválida!', "warning"); 
        return; 
    } 
    
    currentPlaylistId = playlistIdMatch[1]; 
    await carregarVideosDaPlaylist(currentPlaylistId); 
    console.log("handleLoadPlaylist finalizado"); 
}

// --- Funções de Cálculo de Esforço ---
function parseDuration(durationString) {
    try{
        if (!durationString || durationString === 'PT0S') return 0;
        const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
        const matches = durationString.match(regex);
        if (!matches) { console.warn(`   [parseDuration] Padrão não encontrado em: ${durationString}`); return 0; }
        const hours = parseInt(matches[1] || 0);
        const minutes = parseInt(matches[2] || 0);
        const seconds = parseInt(matches[3] || 0);
        const totalMinutes = (hours * 60) + minutes + (seconds / 60);
        if (isNaN(totalMinutes)) {
            console.error(`   [parseDuration] Resultado NaN para ${durationString}`);
            return 0;
        }
        return totalMinutes;
    } catch(e){ console.error("Erro parseDuration:",e, "String:", durationString); return 0;}
}

function calcularEsforco(title, durationString) {
    try{
        const config = (typeof CONFIG_ESFORCO !== 'undefined') ? CONFIG_ESFORCO : { PONTOS_POR_MINUTO: 0.5, PONTUACAO_MINIMA: 1, MODIFICADORES_TITULO: { FACIL:{palavras:[], modificador:0}, DIFICIL:{palavras:[], modificador:0} } };
        const { PONTOS_POR_MINUTO, PONTUACAO_MINIMA, MODIFICADORES_TITULO } = config;
        const totalMinutes = parseDuration(durationString);
        let scoreBase = totalMinutes * PONTOS_POR_MINUTO;
        if (isNaN(scoreBase)) {
             console.error(`   [calcularEsforco] scoreBase é NaN! totalMinutes=${totalMinutes}, PONTOS_POR_MINUTO=${PONTOS_POR_MINUTO}`);
             scoreBase = 0;
        }
        let scoreFinal = scoreBase;
        const lowerTitle = (title || "").toLowerCase();
        let modificadorAplicado = 0;
        if (MODIFICADORES_TITULO?.FACIL?.palavras) { 
            for (const word of MODIFICADORES_TITULO.FACIL.palavras) { 
                if (lowerTitle.includes(word)) { 
                    scoreFinal += MODIFICADORES_TITULO.FACIL.modificador; 
                    modificadorAplicado = MODIFICADORES_TITULO.FACIL.modificador; 
                    break; 
                } 
            } 
        }
        if (modificadorAplicado === 0 && MODIFICADORES_TITULO?.DIFICIL?.palavras) { 
            for (const word of MODIFICADORES_TITULO.DIFICIL.palavras) { 
                if (lowerTitle.includes(word)) { 
                    scoreFinal += MODIFICADORES_TITULO.DIFICIL.modificador; 
                    modificadorAplicado = MODIFICADORES_TITULO.DIFICIL.modificador; 
                    break; 
                } 
            } 
        }
         if (isNaN(scoreFinal)) {
             console.error(`   [calcularEsforco] scoreFinal é NaN após modificadores! scoreBase=${scoreBase}, modificador=${modificadorAplicado}`);
             scoreFinal = scoreBase;
         }
        const resultado = Math.max(PONTUACAO_MINIMA, Math.round(scoreFinal || 0)); 
        return resultado;
    } catch(e){ console.error("Erro calcularEsforco:",e); return 1;}
}


// --- Função Principal carregarVideosDaPlaylist ---
async function carregarVideosDaPlaylist(playlistId) {
     console.log("carregarVideosDaPlaylist iniciado para:", playlistId);
     if (!firebaseInicializado) { showToast("Erro: DB não conectado.", "warning"); return; }
     
     console.log("Verificando CHAVE_API...");
     if (typeof CHAVE_API === 'undefined' || CHAVE_API === 'SUA_CHAVE_DE_API_AQUI' || !CHAVE_API) { 
         console.error("ERRO CRÍTICO: CHAVE_API YouTube inválida!"); 
         alert('ERRO: CHAVE_API YouTube inválida!'); 
         videosContainer.innerHTML = `<p style="color: red;">Erro: Chave API YouTube.</p>`; 
         return; 
     } 
     console.log("CHAVE_API encontrada.");
    
    const API_KEY = CHAVE_API;
    videosContainer.innerHTML = '<p class="loading-message">Carregando progresso...</p>';
    await loadProgress(playlistId);
    
    videosContainer.innerHTML = '<p class="loading-message">Buscando vídeos da playlist...</p>';
    let videosInfo = []; 
    let videoIds = []; 
    let nextPageToken = '';
    // allVideosCompletos agora é global

    try {
        // --- INÍCIO ETAPA 1 (Fetch playlistItems) ---
        console.log(">>> Iniciando busca playlistItems...");
        do {
            const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${API_KEY}&pageToken=${nextPageToken}`;
            const response = await fetch(playlistUrl);
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Erro API Playlist:", errorData);
                throw new Error(`API Playlist falhou: ${errorData.error.message}`);
            }
            const data = await response.json();
            
            data.items.forEach(item => {
                if (item.snippet.title !== "Deleted video" && item.snippet.title !== "Private video" && item.contentDetails.videoId) {
                    videosInfo.push({
                        videoId: item.contentDetails.videoId,
                        title: item.snippet.title,
                        position: item.snippet.position
                    });
                    videoIds.push(item.contentDetails.videoId);
                }
            });
            nextPageToken = data.nextPageToken;
        } while (nextPageToken);
        console.log(`<<< Busca playlistItems concluída: ${videosInfo.length} vídeos válidos.`);
        // --- FIM ETAPA 1 ---

        // --- IDEIA 1 (Processa a fila de revisão) ---
        console.log("Processando fila de revisão...");
        processarFilaDeRevisao(videosInfo, videoProgress);

        videosContainer.innerHTML = '<p class="loading-message">Buscando durações dos vídeos...</p>';
        
        // --- INÍCIO ETAPA 2 (Fetch videos/durações) ---
        const durationMap = {};
         if (videoIds.length > 0) {
            for (let i = 0; i < videoIds.length; i += 50) {
                const videoIdsChunk = videoIds.slice(i, i + 50);
                const videoUrl = `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIdsChunk.join(',')}&key=${API_KEY}`;
                const response = await fetch(videoUrl);
                 if (!response.ok) {
                    const errorData = await response.json();
                    console.error("Erro API Duração:", errorData);
                    throw new Error(`API Duração falhou: ${errorData.error.message}`);
                }
                const data = await response.json();
                data.items.forEach(item => {
                    durationMap[item.id] = item.contentDetails.duration;
                });
            }
            console.log("Durações buscadas com sucesso.");
         } else { 
            console.log("Nenhum videoId para buscar durações."); 
         }
        // --- FIM ETAPA 2 ---

        // ETAPA 3: Combinar e Calcular Esforço
        console.log("Calculando esforço...");
        // Atribui ao global
        allVideosCompletos = videosInfo.map(video => { 
            const duration = durationMap[video.videoId] || 'PT0S'; 
            const esforco = calcularEsforco(video.title, duration); 
            
            const progresso = videoProgress[video.videoId];
            const isChecked = progresso !== undefined;
            let anotacaoSalva = "";
            if (progresso) {
                if (typeof progresso === 'object' && progresso.anotacao) {
                    anotacaoSalva = progresso.anotacao; 
                } else if (typeof progresso === 'string') {
                    anotacaoSalva = progresso; 
                }
            }
            
            return { ...video, duration, esforco, anotacaoSalva, isChecked }; 
        });
        console.log("<<< Cálculo esforço concluído. Tamanho:", allVideosCompletos.length);

        // --- IDEIA 3 (Atualiza painel de progresso) ---
        atualizarPainelDeProgresso();
        // --- FIM IDEIA 3 ---

        videosContainer.innerHTML = '';
        if (allVideosCompletos.length === 0) { 
            console.warn("allVideosCompletos VAZIO."); 
            videosContainer.innerHTML = '<p class="loading-message">Nenhum vídeo válido processado.</p>'; 
            return; 
        }

        // ETAPA 4: Montar os Dias HTML
        console.log("Montando HTML dos dias...");
        const orcamentoDiario = parseInt(esforcoPorDiaInput.value) || (typeof CONFIG_ESFORCO !== 'undefined' ? CONFIG_ESFORCO.ORCAMENTO_DIARIO_PADRAO : 10);
        let diaAtualNum = 0;
        let esforcoNoDia = 0; 
        let diaDiv = null; 
        let diaHeader = null; 
        let diaConteudo = null;

        allVideosCompletos.forEach((video, index) => {
             if (!video?.videoId) { console.warn(`Pulando vídeo inválido ${index}:`, video); return; }
             
             const { videoId, title, esforco, duration, anotacaoSalva, isChecked } = video; 
             const videoTitle = title || "Título Indisponível"; 
             
             if (!diaConteudo || (esforcoNoDia >= orcamentoDiario && esforcoNoDia > 0 )) {
                  if (diaHeader && esforcoNoDia > 0) {
                      const frase = getFraseDeEsforco(esforcoNoDia);
                      diaHeader.querySelector('.frase-esforco').textContent = frase;
                      diaHeader.querySelector('span:first-child').textContent += ` (Total: ${esforcoNoDia} pts)`;
                  }
                  diaAtualNum++; 
                  esforcoNoDia = 0; 
                  diaDiv = document.createElement('div'); 
                  diaDiv.className = 'dia'; 
                  diaHeader = document.createElement('div'); 
                  diaHeader.className = 'dia-header'; 
                  diaHeader.innerHTML = `<h2><span>Dia ${diaAtualNum}</span><span class="frase-esforco"></span><span class="completion-emoji"></span></h2>`; 
                  diaDiv.appendChild(diaHeader); 
                  diaConteudo = document.createElement('div'); 
                  diaConteudo.className = 'dia-conteudo'; 
                  diaDiv.appendChild(diaConteudo); 
                  if (videosContainer) { 
                      videosContainer.appendChild(diaDiv); 
                  } else { 
                      console.error("videosContainer sumiu!"); 
                      return; 
                  } 
             }

             if (!diaConteudo || !(diaConteudo instanceof Element)) { 
                 console.error(`ERRO LOOP: diaConteudo inválido video ${index} (${videoId}). Valor:`, diaConteudo); 
                 showToast(`Erro montar dia ${diaAtualNum}.`, "warning"); 
                 return; 
             }
             
             esforcoNoDia += esforco;
             
             const videoHtml = `
              <div class="video-item" data-video-item-id="${videoId}"> 
                 <div class="video-title-wrapper">
                    <input type="checkbox" data-video-id="${videoId}" ${isChecked ? 'checked' : ''}>
                    <h3>${videoTitle}<span class="esforco-badge" title="${parseDuration(duration).toFixed(0)} min">🔥 ${esforco} pts</span></h3>
                 </div> 
                 <div id="player-${videoId}" class="video-placeholder" data-video-id="${videoId}">
                    <p>Vídeo pronto para carregar...</p>
                 </div> 
                 <div class="anotacao-area">
                    <label for="anotacao-${videoId}">Como você explicaria o conceito deste vídeo para alguém?</label>
                    <textarea id="anotacao-${videoId}" data-video-id="${videoId}" rows="2" placeholder="Escreva aqui para poder marcar como concluído...">${anotacaoSalva}</textarea>
                 </div> 
              </div>`;
             
             try { 
                 diaConteudo.innerHTML += videoHtml; 
             } catch (e) { console.error(`ERRO innerHTML += video ${videoId}:`, e); }
        }); // Fim forEach
        console.log("Montagem HTML concluída.");

        // ETAPA 5: Adicionar frases e totais (para o último dia)
        console.log("Adicionando frase e total para o último dia...");
        if (diaHeader && esforcoNoDia > 0) {
             const frase = getFraseDeEsforco(esforcoNoDia);
             diaHeader.querySelector('.frase-esforco').textContent = frase;
             diaHeader.querySelector('span:first-child').textContent += ` (Total: ${esforcoNoDia} pts)`;
        }

    } catch (error) { 
        console.error("ERRO DETALHADO em carregarVideosDaPlaylist:", error); 
        videosContainer.innerHTML = `<p style="color: red;">Erro ao carregar playlist. Verifique o console.</p>`; 
        if (error.message.includes("API Key") || error.message.includes("Forbidden") || error.message.includes("403")) showToast("Erro: Chave API YouTube inválida/restrita.", "warning"); 
        else if (error.message.includes("quota")) showToast("Cota API YouTube excedida.", "warning"); 
        else if (error.message.includes("API Playlist")) showToast("Erro buscar lista YouTube.", "warning"); 
        else if (error.message.includes("API Duração")) showToast("Erro buscar duração YouTube.", "warning"); 
        else showToast("Erro inesperado.", "warning"); 
        return; 
    }

    // --- INÍCIO ETAPA 6 (Adicionar Lógica de Eventos) ---
    console.log("Adicionando event listeners...");
    try { 
        document.querySelectorAll('.dia-conteudo').forEach(checkDayCompletion); 
        autoOpenAndHighlightNextDay(); 
        
        // Listener do Acordeão
        document.querySelectorAll('.dia-header').forEach(header => { 
            header.addEventListener('click', (e) => { 
                if (e.target.closest('a, button')) return; 
                const diaConteudo = header.nextElementSibling;
                if (diaConteudo) {
                    // Remove animação de entrada de outros dias para evitar bugs visuais
                    document.querySelectorAll('.dia').forEach(d => d.classList.remove('day-next-animation'));
                    
                    if (parseFloat(diaConteudo.style.maxHeight) > 0) {
                        closeDay(diaConteudo);
                    } else {
                        openDay(diaConteudo);
                    }
                }
            }); 
        }); 
        
        // Listener do Checkbox (Porteiro da Memória)
        document.querySelectorAll('.video-title-wrapper input[type="checkbox"]').forEach(checkbox => { 
            checkbox.addEventListener('change', async (e) => { 
                const videoId = e.target.dataset.videoId;
                const videoItem = e.target.closest('.video-item');
                if (!videoId || !videoItem) return;

                const textarea = videoItem.querySelector(`.anotacao-area textarea[data-video-id="${videoId}"]`);
                const isChecked = e.target.checked;
                
                if (isChecked && (!textarea || textarea.value.trim().length === 0)) {
                    e.target.checked = false; 
                    showToast("Escreva o que aprendeu antes de concluir!", "warning");
                    
                    textarea.style.transition = 'transform 0.1s, border-color 0.2s';
                    textarea.style.borderColor = 'red';
                    // Efeito shake rápido
                    textarea.style.transform = 'translateX(-5px)';
                    setTimeout(() => { textarea.style.transform = 'translateX(5px)'; }, 100);
                    setTimeout(() => { textarea.style.transform = 'translateX(-5px)'; }, 200);
                    setTimeout(() => { textarea.style.transform = 'translateX(5px)'; }, 300);
                    setTimeout(() => { textarea.style.transform = 'translateX(0)'; }, 400);

                    textarea.focus();
                    
                    setTimeout(() => {
                        textarea.style.borderColor = '';
                    }, 600);
                    
                    delete checkbox.dataset.triggeredByPlayer;
                    return;
                }

                const anotacao = textarea ? textarea.value.trim() : "";
                await saveProgress(currentPlaylistId, videoId, isChecked, anotacao);

                const diaConteudo = e.target.closest('.dia-conteudo');
                if (diaConteudo) {
                    const diaConcluido = checkDayCompletion(diaConteudo);
                    
                    // --- LÓGICA DE TRANSIÇÃO SUAVE ---
                    if (diaConcluido && isChecked) {
                         const diaElement = diaConteudo.closest('.dia');
                         
                         const configA = (typeof CONFIG_APRENDIZADO !== 'undefined') ? CONFIG_APRENDIZADO : {}; 
                         const limiteDias = configA.LIMITE_DIAS_CONCLUIDOS || 2;
                         const msgAviso = configA.MENSAGEM_AVISO || "Muitos dias hoje! Que tal uma pausa?";

                         const diasHoje = logarConclusaoDeDia();
                         if (diasHoje > limiteDias) {
                            showToast(msgAviso.replace('{count}', diasHoje), "warning");
                         } else {
                            showToast("Dia Concluído! Ótimo trabalho.", "info");
                         }
                         
                         // Chama a nova função de animação
                         if(diaElement) {
                             smoothDayTransition(diaElement);
                         } else {
                             // Fallback
                             closeDay(diaConteudo);
                             autoOpenAndHighlightNextDay();
                         }
                    }
                    // --- FIM DA LÓGICA DE TRANSIÇÃO ---
                }
            }); 
        }); 
        
        // Listener do Textarea
        document.querySelectorAll('.anotacao-area textarea').forEach(textarea => { 
            textarea.addEventListener('input', async (e) => { 
                const videoId = e.target.dataset.videoId;
                const videoItem = e.target.closest('.video-item');
                if (!videoId || !videoItem) return;
                
                const checkbox = videoItem.querySelector(`.video-title-wrapper input[data-video-id="${videoId}"]`);
                
                if (checkbox && checkbox.checked) {
                    const anotacao = e.target.value; 
                    await saveProgress(currentPlaylistId, videoId, true, anotacao);
                }
            }); 
        }); 
        
        console.log("Event listeners adicionados."); 
    }
    catch(e) { console.error("Erro adicionar listeners:", e); showToast("Erro config interações.", "warning"); }
     console.log("carregarVideosDaPlaylist finalizado com sucesso.");
}
// --- FIM ETAPA 6 ---

// --- IDEIA 3 (Função Painel de Progresso) ---
function atualizarPainelDeProgresso() {
    if (!statPercentual || !statConcluidos || !statEsforco) {
        console.warn("Elementos do painel de stats não encontrados.");
        return;
    }

    const totalVideos = allVideosCompletos.length;
    const videosConcluidos = Object.keys(videoProgress).length;
    
    let esforcoAcumulado = 0;
    if (totalVideos > 0) {
        for (const videoId in videoProgress) {
            const video = allVideosCompletos.find(v => v.videoId === videoId);
            if (video && video.esforco) {
                esforcoAcumulado += video.esforco;
            }
        }
    }

    const percentual = (totalVideos > 0) ? ((videosConcluidos / totalVideos) * 100) : 0;

    statPercentual.textContent = `${percentual.toFixed(0)}%`;
    statConcluidos.textContent = `${videosConcluidos} / ${totalVideos}`;
    statEsforco.textContent = `${esforcoAcumulado} pts`;
}
// --- FIM IDEIA 3 ---


// --- IDEIA 1 (Funções do Desafio da Memória) ---
function processarFilaDeRevisao(videosInfo, progressoSalvo) {
    if (!reviewQueueContainer || !reviewQueueItems) {
        console.error("Containers da fila de revisão não encontrados.");
        return;
    }

    const filaDeRevisao = [];
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); 

    const intervalos = (typeof CONFIG_APRENDIZADO !== 'undefined' ? CONFIG_APRENDIZADO.INTERVALOS_REVISAO : [1, 3, 7, 16, 30]);

    for (const videoId in progressoSalvo) {
        const progresso = progressoSalvo[videoId];

        if (typeof progresso !== 'object' || !progresso.dataConclusao || !progresso.statusRevisao) {
            continue; 
        }

        const { statusRevisao, dataConclusao, anotacao } = progresso;
        const indiceIntervalo = statusRevisao - 1; 

        if (indiceIntervalo >= intervalos.length) {
            continue; 
        }

        const diasParaAdicionar = intervalos[indiceIntervalo];
        const dataConcl = new Date(dataConclusao);
        
        const dataRevisao = new Date(dataConcl);
        dataRevisao.setDate(dataConcl.getDate() + diasParaAdicionar);
        dataRevisao.setHours(0, 0, 0, 0); 

        if (hoje >= dataRevisao) {
            const info = videosInfo.find(v => v.videoId === videoId);
            const title = info ? info.title : "Título não encontrado";
            filaDeRevisao.push({ videoId, title, anotacao, statusRevisao });
        }
    }

    // Renderiza a fila
    reviewQueueItems.innerHTML = '';
    if (filaDeRevisao.length > 0) {
        console.log(`Itens para revisar hoje: ${filaDeRevisao.length}`);
        reviewQueueContainer.style.display = 'block';
        
        filaDeRevisao.forEach(item => {
            // HTML do "Desafio"
            const itemHtml = `
                <div class="review-item" data-video-id="${item.videoId}">
                    <h4>${item.title}</h4>
                    
                    <!-- Área do Desafio (sempre visível) -->
                    <div class="review-desafio-area">
                        <label for="review-anotacao-${item.videoId}">O que você lembra sobre este vídeo?</label>
                        <textarea id="review-anotacao-${item.videoId}" rows="3" placeholder="Tente lembrar sem olhar..."></textarea>
                        <button class="review-btn-revelar" data-video-id="${item.videoId}">Comparar com Anotação</button>
                    </div>

                    <!-- Área de Comparação (escondida) -->
                    <div class="review-revelar-area hidden">
                        <p><strong>Sua anotação original:</strong> "${item.anotacao}"</p>
                        <div class="review-actions">
                            <button class="review-btn-nao-lembrei" data-video-id="${item.videoId}">❌ Não Lembrei</button>
                            <button class="review-btn-lembrei" data-video-id="${item.videoId}">✅ Lembrei!</button>
                        </div>
                    </div>
                </div>
            `;
            reviewQueueItems.innerHTML += itemHtml;
        });

        // Adiciona listeners aos botões
        document.querySelectorAll('.review-btn-revelar').forEach(btn => btn.addEventListener('click', handleRevealReview));
        document.querySelectorAll('.review-btn-lembrei').forEach(btn => btn.addEventListener('click', handleReviewAction));
        document.querySelectorAll('.review-btn-nao-lembrei').forEach(btn => btn.addEventListener('click', handleReviewAction));

    } else {
        console.log("Nenhum item para revisar hoje.");
        reviewQueueContainer.style.display = 'none';
    }
}

// Nova função para o botão "Revelar"
function handleRevealReview(e) {
    const videoId = e.target.dataset.videoId;
    const itemElement = e.target.closest('.review-item');
    if (!itemElement) return;

    const desafioArea = itemElement.querySelector('.review-desafio-area');
    const revelarArea = itemElement.querySelector('.review-revelar-area');
    
    // Esconde o botão "Revelar" (ou a área toda) e mostra a área de comparação
    if (desafioArea) desafioArea.querySelector('.review-btn-revelar').classList.add('hidden');
    if (revelarArea) revelarArea.classList.remove('hidden');
}

async function handleReviewAction(e) {
    const videoId = e.target.dataset.videoId;
    const progresso = videoProgress[videoId];
    if (!progresso || !currentPlaylistId) return;

    let novoStatus;
    const isLembrei = e.target.classList.contains('review-btn-lembrei');

    if (isLembrei) {
        novoStatus = progresso.statusRevisao + 1; 
        showToast("Ótimo! Próxima revisão em mais tempo.", "info");
    } else {
        novoStatus = 1; 
        showToast("Sem problemas! Revisão agendada para amanhã.", "info");
    }

    const dataAtualizada = { 
        ...progresso, 
        statusRevisao: novoStatus, 
        dataConclusao: new Date().toISOString() 
    };

    videoProgress[videoId] = dataAtualizada; 

    try {
        const docRef = db.collection('progress').doc(currentPlaylistId);
        const updateData = {};
        updateData[videoId] = dataAtualizada;
        await docRef.set(updateData, { merge: true });

        const itemElement = e.target.closest('.review-item');
        if (itemElement) itemElement.remove();

        if (reviewQueueItems && reviewQueueItems.children.length === 0) {
            if (reviewQueueContainer) reviewQueueContainer.style.display = 'none';
        }

    } catch (error) {
        console.error("Erro ao salvar revisão:", error);
        showToast("Erro ao salvar sua revisão.", "warning");
    }
}
// --- FIM IDEIA 1 ---

// --- FUNÇÃO AUXILIAR PARA ALARME (AGORA USANDO ELEMENTO <audio>) ---
function playAlarm() {
    try {
        if (typeof ALARME_URL !== 'undefined' && ALARME_URL) {
            const audio = new Audio(ALARME_URL);
            audio.play().catch(e => {
                 console.warn("Falha ao tentar tocar o som (pode ser bloqueio do navegador):", e);
                 showToast("TEMPO ESGOTADO! PAUSA AGORA.", 'warning');
            });
        } else {
            // Fallback se ALARME_URL não estiver configurado
            showToast("TEMPO ESGOTADO! PAUSA AGORA.", 'warning');
        }
    } catch (e) {
        console.error("Erro na função playAlarm:", e);
        showToast("TEMPO ESGOTADO! PAUSA AGORA.", 'warning');
    }
}
// --- FIM FUNÇÃO AUXILIAR ---


// --- IDEIA 2 (Funções do Modo Foco) ---
function startPomodoro() {
    if (isPomodoroRunning) {
        // Pausar
        stopPomodoro();
        if (isPausa) {
            pomodoroStartBtn.textContent = "▶ Continuar Pausa";
        } else {
            pomodoroStartBtn.textContent = "▶ Continuar Foco";
        }
        return;
    } 

    isPomodoroRunning = true;
    
    if (!isPausa) {
        if (pomodoroTimer === null || pomodoroTimer === undefined) { 
             pomodoroTimer = (typeof CONFIG_POMODORO !== 'undefined' ? CONFIG_POMODORO.DURACAO_SESSAO_MIN : 25) * 60;
        }
        pomodoroStartBtn.textContent = "⏸ Pausar Foco";
    } else {
         if (pomodoroTimer === null || pomodoroTimer === undefined) { 
            pomodoroTimer = (typeof CONFIG_POMODORO !== 'undefined' ? CONFIG_POMODORO.DURACAO_PAUSA_MIN : 5) * 60;
         }
        pomodoroStartBtn.textContent = "⏸ Pausar Pausa";
    }

    pomodoroInterval = setInterval(() => {
        pomodoroTimer--;
        updatePomodoroDisplay();

        if (pomodoroTimer <= 0) {
            stopPomodoro(); 
            
            // --- AÇÃO NO TÉRMINO ---
            playAlarm(); // Toca o alarme personalizado
            if (activeYoutubePlayer && typeof activeYoutubePlayer.pauseVideo === 'function') {
                activeYoutubePlayer.pauseVideo(); // Pausa o vídeo!
            }
            // --- FIM AÇÃO NO TÉRMINO ---

            if (!isPausa) {
                isPausa = true;
                pomodoroTimer = null; 
                showToast("Sessão de foco concluída! Hora da pausa.", "info");
                startPomodoro(); 
            } else {
                isPausa = false;
                pomodoroTimer = null; // Garante que o timer inicie do zero na próxima sessão de foco
                showToast("Pausa concluída! Pronto para mais uma sessão?", "info");
                resetPomodoro(); 
            }
        }
    }, 1000); 
}

function stopPomodoro() {
    clearInterval(pomodoroInterval);
    isPomodoroRunning = false;
}

function resetPomodoro() {
    stopPomodoro();
    isPausa = false;
    pomodoroTimer = (typeof CONFIG_POMODORO !== 'undefined' ? CONFIG_POMODORO.DURACAO_SESSAO_MIN : 25) * 60;
    updatePomodoroDisplay();
    if (pomodoroStartBtn) pomodoroStartBtn.textContent = "▶ Iniciar Foco";
}

function updatePomodoroDisplay() {
    if (!pomodoroDisplay) return;
    const minutes = Math.floor(pomodoroTimer / 60);
    const seconds = pomodoroTimer % 60;
    pomodoroDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}
// --- FIM IDEIA 2 ---


// --- Função onPlayerStateChange (Global) ---
function onPlayerStateChange(event) { 
    try { 
        // Atualiza a variável do player ativo globalmente
        const diaConteudo = event.target.getIframe().parentElement.closest('.dia-conteudo');
        if (diaConteudo && diaConteudo.style.maxHeight !== '0px') {
            activeYoutubePlayer = event.target;
        }

        if (event.data === YT.PlayerState.ENDED) { 
            const playerElement = event.target.getIframe();
            const videoId = playerElement.parentElement.dataset.videoId;
            
            if (!videoId) {
                console.warn("onPlayerStateChange: Não foi possível extrair videoId do player", playerElement.parentElement);
                return;
            }
            
            const checkbox = document.querySelector(`input[data-video-id="${videoId}"]`); 
            
            if (checkbox && !checkbox.checked) { 
                console.log(`Player ended (ID: ${videoId}), disparando 'change' no checkbox.`);
                checkbox.dataset.triggeredByPlayer = 'true'; 
                checkbox.checked = true; 
                checkbox.dispatchEvent(new Event('change')); 
            } 
        } 
    } catch(e) { console.error("Erro onPlayerStateChange:", e); } 
}

// --- Tratamento de erro global ---
window.addEventListener('unhandledrejection', event => { 
    console.error("ERRO NÃO TRATADO (Promise Rejeitada):", event.reason); 
    if (event.reason?.code?.startsWith('firestore/')) { 
        showToast(`Erro DB: ${event.reason.code}`, "warning"); 
    } else { 
        showToast("Erro inesperado (ver console).", "warning"); 
    } 
});