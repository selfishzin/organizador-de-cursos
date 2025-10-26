// ===================================
// ARQUIVO main.js (Corrigido e Completo)
// ===================================

// --- Variáveis Globais ---
let db = null;
let firebaseInicializado = false;
let currentPlaylistId = null;
let videoProgress = {};

// --- Referências ao DOM (declaradas aqui, atribuídas no DOMContentLoaded) ---
let themeToggle = null;
let playlistUrlInput = null;
let carregarBtn = null;
let esforcoPorDiaInput = null;
let videosContainer = null;
let resetProgressBtn = null;


// --- TENTA INICIALIZAR FIREBASE IMEDIATAMENTE ---
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

async function saveProgress(playlistId, videoId, isChecked, anotacao = null) { 
    if (!playlistId || !videoId || !firebaseInicializado) { console.warn("Pulando saveProgress."); return; } 
    const docRef = db.collection('progress').doc(playlistId); 
    let updateData = {}; 
    if (isChecked) { 
        // Salva a anotação ou 'true' se a anotação for nula (fallback)
        updateData[videoId] = anotacao || true; 
    } else { 
        // Remove o campo do documento se desmarcado
        updateData[videoId] = firebase.firestore.FieldValue.delete(); 
    } 
    try { 
        await docRef.set(updateData, { merge: true }); 
        if (isChecked) { 
            videoProgress[videoId] = anotacao || true; 
        } else { 
            delete videoProgress[videoId]; 
        } 
        console.log(`Progresso salvo: ${videoId} (${isChecked})`); 
    } catch (error) { 
        console.error("Erro saveProgress:", error); 
        showToast("Erro salvar progresso.", "warning"); 
        // Desfaz a ação na UI se o salvamento falhar
        const checkbox = document.querySelector(`input[data-video-id="${videoId}"]`); 
        if(checkbox) checkbox.checked = !isChecked; 
    } 
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
        // Lazy load dos players
        if (!diaConteudo.dataset.loaded) { 
            const placeholders = diaConteudo.querySelectorAll('.video-placeholder'); 
            placeholders.forEach(placeholder => { 
                const videoId = placeholder.dataset.videoId; 
                if (typeof YT !== 'undefined' && typeof YT.Player !== 'undefined') { 
                    new YT.Player(placeholder, { 
                        videoId: videoId, 
                        playerVars: { 'origin': window.location.origin }, 
                        events: { 'onStateChange': onPlayerStateChange } 
                    }); 
                } else { 
                    console.error("API YouTube Player não pronta."); 
                    showToast("Erro player YouTube.", "warning"); 
                } 
            }); 
            diaConteudo.dataset.loaded = 'true'; 
        } 
        // Animação de abertura
        const currentTransition = diaConteudo.style.transition; 
        diaConteudo.style.transition = ''; 
        diaConteudo.style.maxHeight = 'none'; 
        const scrollHeight = diaConteudo.scrollHeight; 
        diaConteudo.style.maxHeight = '0px'; 
        diaConteudo.offsetHeight; // Força reflow
        diaConteudo.style.transition = currentTransition; 
        diaConteudo.style.paddingTop = '20px'; 
        diaConteudo.style.paddingBottom = '20px'; 
        diaConteudo.style.maxHeight = scrollHeight + "px"; 
    } catch(e){ console.error("Erro openDay:",e);}
}

function closeDay(diaConteudo) { 
    try{ 
        if (!diaConteudo) return; 
        diaConteudo.style.paddingTop = '0'; 
        diaConteudo.style.paddingBottom = '0'; 
        setTimeout(() => { 
            if (diaConteudo) diaConteudo.style.maxHeight = "0px"; 
        }, 50); // Delay pequeno para a transição de padding funcionar
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
                diaElement.classList.add('dia-destacado'); 
                openDay(diaConteudo); 
                setTimeout(() => { 
                    if(diaHeader) diaHeader.scrollIntoView({ behavior: 'smooth', block: 'center' }); 
                }, 450); // Espera a animação de abertura
                break; 
            } 
        } 
    } catch(e){ console.error("Erro autoOpen:",e);}
}

// --- Lógica de Carregamento da Página ---
document.addEventListener('DOMContentLoaded', () => {
     console.log("DOMContentLoaded disparado.");
     
     // --- CORREÇÃO: Atribuir elementos do DOM AQUI ---
     themeToggle = document.getElementById('theme-toggle');
     playlistUrlInput = document.getElementById('playlistUrl');
     carregarBtn = document.getElementById('carregarPlaylist');
     esforcoPorDiaInput = document.getElementById('esforcoPorDia');
     videosContainer = document.getElementById('videosContainer');
     resetProgressBtn = document.getElementById('resetProgress');
     // --- Fim da Atribuição ---

     try { 
         if (!firebaseInicializado) { 
             console.error("Inicialização Firebase falhou."); 
             if(videosContainer) videosContainer.innerHTML = `<p style="color: red;">Falha ao conectar com o Banco de Dados. Verifique o console.</p>`; 
             return; 
         } 
         // Verifica se todos os elementos essenciais foram encontrados
         if (!themeToggle || !playlistUrlInput || !carregarBtn || !esforcoPorDiaInput || !videosContainer || !resetProgressBtn) { 
             console.error("Erro crítico: Elementos essenciais do DOM não encontrados!"); 
             alert("Erro: A interface não carregou corretamente."); 
             return; 
         } 
         console.log("Elementos do DOM encontrados com sucesso.");

         // --- CORREÇÃO: Mover AddEventListeners para CÁ ---

         // Listener do Tema
         themeToggle.addEventListener('click', () => { 
             try { 
                 const currentTheme = document.documentElement.getAttribute('data-theme') || 'light'; 
                 const newTheme = (currentTheme === 'light') ? 'dark' : 'light'; 
                 setTheme(newTheme); 
             } catch(e) { console.error("Erro no clique do tema:", e); } 
         });

         // Listener do Botão Carregar
         carregarBtn.addEventListener('click', handleLoadPlaylist);

         // Listener do Botão Resetar
         resetProgressBtn.addEventListener('click', async () => { 
             if (!firebaseInicializado) { showToast("Erro DB.", "warning"); return; } 
             // Substitui o confirm() por um prompt simples (idealmente, use um modal customizado)
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

         // --- Fim dos Listeners ---


         // Lógica de inicialização (carregar tema, esforço e playlist salva)
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
        console.log(`[calcularEsforco] Título: "${title?.substring(0,30)}...", Duração: ${durationString}`);
        const config = (typeof CONFIG_ESFORCO !== 'undefined') ? CONFIG_ESFORCO : { PONTOS_POR_MINUTO: 0.5, PONTUACAO_MINIMA: 1, MODIFICADORES_TITULO: { FACIL:{palavras:[], modificador:0}, DIFICIL:{palavras:[], modificador:0} } };
        const { PONTOS_POR_MINUTO, PONTUACAO_MINIMA, MODIFICADORES_TITULO } = config;
        
        const totalMinutes = parseDuration(durationString);
        let scoreBase = totalMinutes * PONTOS_POR_MINUTO;
        
        if (isNaN(scoreBase)) {
             console.error(`   [calcularEsforco] scoreBase é NaN! totalMinutes=${totalMinutes}, PONTOS_POR_MINUTO=${PONTOS_POR_MINUTO}`);
             scoreBase = 0; // Define como 0 se for NaN
        }
        
        let scoreFinal = scoreBase;
        console.log(`   totalMinutes=${totalMinutes.toFixed(2)}, scoreBase=${scoreBase.toFixed(2)}`);
        
        const lowerTitle = (title || "").toLowerCase();
        let modificadorAplicado = 0;
        
        if (MODIFICADORES_TITULO?.FACIL?.palavras) { 
            for (const word of MODIFICADORES_TITULO.FACIL.palavras) { 
                if (lowerTitle.includes(word)) { 
                    scoreFinal += MODIFICADORES_TITULO.FACIL.modificador; 
                    modificadorAplicado = MODIFICADORES_TITULO.FACIL.modificador; 
                    console.log(`   -> Modificador FÁCIL (${word}): ${modificadorAplicado}`); 
                    break; 
                } 
            } 
        }
        
        if (modificadorAplicado === 0 && MODIFICADORES_TITULO?.DIFICIL?.palavras) { 
            for (const word of MODIFICADORES_TITULO.DIFICIL.palavras) { 
                if (lowerTitle.includes(word)) { 
                    scoreFinal += MODIFICADORES_TITULO.DIFICIL.modificador; 
                    modificadorAplicado = MODIFICADORES_TITULO.DIFICIL.modificador; 
                    console.log(`   -> Modificador DIFÍCIL (${word}): ${modificadorAplicado}`); 
                    break; 
                } 
            } 
        }
        
         if (isNaN(scoreFinal)) {
             console.error(`   [calcularEsforco] scoreFinal é NaN após modificadores! scoreBase=${scoreBase}, modificador=${modificadorAplicado}`);
             scoreFinal = scoreBase; // Reverte para scoreBase se NaN
         }
         
        const resultado = Math.max(PONTUACAO_MINIMA, Math.round(scoreFinal || 0)); 
        console.log(`   Score Final (antes min): ${scoreFinal.toFixed(2)}, Resultado (após min ${PONTUACAO_MINIMA}): ${resultado}`);
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
    let allVideosCompletos = [];

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
                // Ignora vídeos privados ou deletados que ainda podem aparecer na lista
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

        videosContainer.innerHTML = '<p class="loading-message">Buscando durações dos vídeos...</p>';
        
        // --- INÍCIO ETAPA 2 (Fetch videos/durações) ---
        const durationMap = {};
         if (videoIds.length > 0) {
            // A API de vídeos aceita até 50 IDs por vez
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
        allVideosCompletos = videosInfo.map(video => { 
            const duration = durationMap[video.videoId] || 'PT0S'; 
            const esforco = calcularEsforco(video.title, duration); 
            const anotacaoSalva = (videoProgress[video.videoId] && typeof videoProgress[video.videoId] === 'string') ? videoProgress[video.videoId] : ""; 
            return { ...video, duration, esforco, anotacaoSalva }; 
        });
        console.log("<<< Cálculo esforço concluído. Tamanho:", allVideosCompletos.length);

        videosContainer.innerHTML = '';
        if (allVideosCompletos.length === 0) { 
            console.warn("allVideosCompletos VAZIO."); 
            videosContainer.innerHTML = '<p class="loading-message">Nenhum vídeo válido processado.</p>'; 
            return; 
        }

        // ETAPA 4: Montar os Dias HTML
        console.log("Montando HTML dos dias...");
        const orcamentoDiario = parseInt(esforcoPorDiaInput.value) || (typeof CONFIG_ESFORCO !== 'undefined' ? CONFIG_ESFORCO.ORCAMENTO_DIARIO_PADRAO : 10);
        let diaAtualNum = 0; // Começa em 0 para o primeiro dia ser 1
        let esforcoNoDia = 0; 
        let diaDiv = null; 
        let diaHeader = null; 
        let diaConteudo = null;
        console.log("Verificando array 'allVideosCompletos' antes loop. Tamanho:", allVideosCompletos.length);

        allVideosCompletos.forEach((video, index) => {
             console.log(`---> Entrando no loop forEach - Vídeo ${index + 1}`);
             if (!video?.videoId) { console.warn(`Pulando vídeo inválido ${index}:`, video); return; }
             
             const { videoId, title, esforco, duration, anotacaoSalva } = video; 
             const videoTitle = title || "Título Indisponível"; 
             const isChecked = videoProgress[videoId] !== undefined;
             
             // --- CORREÇÃO LÓGICA DE CRIAÇÃO DE DIA ---
             // Cria um novo dia se:
             // 1. É o primeiro vídeo (diaConteudo é null)
             // 2. O esforço do dia atual JÁ ATINGIU o orçamento E não está zerado (para não criar dias vazios)
             if (!diaConteudo || (esforcoNoDia >= orcamentoDiario && esforcoNoDia > 0 )) {
                  
                  // Se já existe um dia, finaliza o cálculo de esforço dele antes de criar um novo
                  if (diaHeader && esforcoNoDia > 0) {
                      const frase = getFraseDeEsforco(esforcoNoDia);
                      diaHeader.querySelector('.frase-esforco').textContent = frase;
                      diaHeader.querySelector('span:first-child').textContent += ` (Total: ${esforcoNoDia} pts)`;
                  }

                  // Cria o novo dia
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
             // --- FIM CORREÇÃO LÓGICA ---

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
                    <label for="anotacao-${videoId}">O que você aprendeu com este vídeo?</label>
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
                // Evita fechar/abrir ao clicar em links ou botões dentro do header (se houver)
                if (e.target.closest('a, button')) return; 
                
                const diaConteudo = header.nextElementSibling;
                if (diaConteudo) {
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
                
                // "Porteiro da Memória"
                if (isChecked && (!textarea || textarea.value.trim().length === 0)) {
                    // Impede a marcação se a anotação estiver vazia
                    e.target.checked = false; 
                    showToast("Escreva o que aprendeu antes de concluir!", "warning");
                    
                    // Efeito de "shake" no textarea
                    textarea.classList.add('shake-animation'); // (Precisa definir essa animação no CSS)
                    textarea.style.borderColor = 'red'; // Feedback visual
                    textarea.focus();
                    
                    setTimeout(() => {
                        textarea.classList.remove('shake-animation');
                        textarea.style.borderColor = ''; // Reseta a borda
                    }, 600);
                    
                    // Se o player disparou o 'change', remove o gatilho
                    delete checkbox.dataset.triggeredByPlayer;
                    return; // Para a execução
                }

                // Se passou pelo porteiro (ou está desmarcando)
                const anotacao = textarea ? textarea.value.trim() : "";
                await saveProgress(currentPlaylistId, videoId, isChecked, anotacao);

                // Verifica se o dia foi concluído
                const diaConteudo = e.target.closest('.dia-conteudo');
                if (diaConteudo) {
                    const diaConcluido = checkDayCompletion(diaConteudo);
                    
                    // Se o dia foi concluído AGORA
                    if (diaConcluido && isChecked) {
                         // Lógica de "Guardião da Retenção"
                         const configA = (typeof CONFIG_APRENDIZADO !== 'undefined') ? CONFIG_APRENDIZADO : {}; 
                         const limiteDias = configA.LIMITE_DIAS_CONCLUIDOS || 2;
                         const msgAviso = configA.MENSAGEM_AVISO || "Muitos dias hoje! Que tal uma pausa?";

                         const diasHoje = logarConclusaoDeDia();
                         if (diasHoje > limiteDias) {
                            showToast(msgAviso.replace('{count}', diasHoje), "warning");
                         } else {
                            showToast("Dia Concluído!", "info");
                         }
                         
                         // Fecha o dia atual e abre o próximo
                         closeDay(diaConteudo);
                         autoOpenAndHighlightNextDay();
                    }
                }
            }); 
        }); 
        
        // Listener do Textarea (Salva anotação se o vídeo JÁ ESTIVER concluído)
        document.querySelectorAll('.anotacao-area textarea').forEach(textarea => { 
            textarea.addEventListener('input', async (e) => { 
                const videoId = e.target.dataset.videoId;
                const videoItem = e.target.closest('.video-item');
                if (!videoId || !videoItem) return;
                
                const checkbox = videoItem.querySelector(`.video-title-wrapper input[data-video-id="${videoId}"]`);
                
                // Só salva a anotação no DB se o vídeo já estiver marcado como concluído
                if (checkbox && checkbox.checked) {
                    const anotacao = e.target.value; // Não usa trim() para permitir rascunho
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


// --- Função onPlayerStateChange (Global) ---
function onPlayerStateChange(event) { 
    try { 
        if (event.data === YT.PlayerState.ENDED) { 
            const playerElement = event.target.getIframe();
            const videoId = playerElement.id.replace('player-', ''); // Pega o ID do placeholder
            
            if (!videoId) {
                console.warn("onPlayerStateChange: Não foi possível extrair videoId do player", playerElement);
                return;
            }
            
            const checkbox = document.querySelector(`input[data-video-id="${videoId}"]`); 
            
            if (checkbox && !checkbox.checked) { 
                console.log(`Player ended (ID: ${videoId}), disparando 'change' no checkbox.`);
                // Adiciona um dataset para o listener 'change' saber que foi o player
                checkbox.dataset.triggeredByPlayer = 'true'; 
                checkbox.checked = true; 
                // Dispara o evento 'change' para ativar o "Porteiro da Memória"
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
