// ===================================
// ARQUIVO main.js (Init no DOMContentLoaded, lendo config.js)
// ===================================

// --- Referências ao DOM ---
const themeToggle = document.getElementById('theme-toggle');
// ... (outras referências) ...
const playlistUrlInput = document.getElementById('playlistUrl');
const carregarBtn = document.getElementById('carregarPlaylist');
const esforcoPorDiaInput = document.getElementById('esforcoPorDia');
const videosContainer = document.getElementById('videosContainer');
const resetProgressBtn = document.getElementById('resetProgress');
let currentPlaylistId = null;
let videoProgress = {};
let db = null; // Variável global para o DB
let firebaseInicializado = false; // Flag

// --- Lógica do Tema ---
function setTheme(theme) { /* ... (código como antes) ... */ }
if(themeToggle){ themeToggle.addEventListener('click', () => { /* ... */ }); }
else { console.error("Elemento #theme-toggle não encontrado."); }

// --- Lógica de Progresso com Firestore ---
async function loadProgress(playlistId) {
    videoProgress = {};
    if (!playlistId || !firebaseInicializado) { // Usa a flag
         console.warn("Firestore não inicializado ou playlistId faltando. Pulando loadProgress.");
         return;
    }
    /* ... (resto como antes) ... */
}
async function saveProgress(playlistId, videoId, isChecked, anotacao = null) {
     if (!playlistId || !videoId || !firebaseInicializado) { // Usa a flag
        /* ... (resto como antes) ... */ return;
     }
    /* ... (resto como antes) ... */
}
if(resetProgressBtn){
    resetProgressBtn.addEventListener('click', async () => {
         if (!firebaseInicializado) { showToast("Erro de conexão com DB.", "warning"); return; } // Usa a flag
        /* ... (resto como antes) ... */
    });
} else { console.error("Elemento #resetProgress não encontrado."); }

// --- Função checkDayCompletion ---
function checkDayCompletion(diaConteudoElement) { /* ... (código como antes) ... */ }

// --- Funções UI ---
function showToast(message, type = 'info') { /* ... (código como antes) ... */ }
function openDay(diaConteudo) { /* ... (código como antes) ... */ }
function closeDay(diaConteudo) { /* ... (código como antes) ... */ }
function getFraseDeEsforco(pontos) { /* ... (código como antes) ... */ }
function logarConclusaoDeDia() { /* ... (código como antes) ... */ }
function autoOpenAndHighlightNextDay() { /* ... (código como antes) ... */ }

// --- Lógica de Carregamento da Página ---
document.addEventListener('DOMContentLoaded', () => {
     console.log("DOMContentLoaded disparado.");
     try {
        // --- INICIALIZAÇÃO FIREBASE DENTRO DO DOMCONTENTLOADED ---
        console.log("Verificando Firebase e Config no DOMContentLoaded...");
        // Verifica se as variáveis GLOBAIS (vindas dos scripts anteriores) existem
        if (typeof firebase === 'undefined') {
            throw new Error("Objeto Firebase global não encontrado! SDK não carregou corretamente?");
        }
        if (typeof firebaseConfig === 'undefined') {
             // Este erro NÃO DEVE MAIS ACONTECER se config.js carregou
             throw new Error("Objeto firebaseConfig global não encontrado! config.js não carregou ou tem erro?");
        }

        console.log("Firebase e Config encontrados. Tentando inicializar...");
        // Tenta inicializar
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig); // Usa firebaseConfig do config.js
            console.log("Firebase app inicializado.");
        } else {
            firebase.app();
            console.log("Firebase app já inicializado.");
        }
        db = firebase.firestore(); // ATRIBUI à variável global 'db'
        if (!db) { throw new Error("Falha ao obter instância do Firestore!"); }
        console.log("Instância do Firestore obtida com sucesso.");
        firebaseInicializado = true; // Marca como sucesso
        // --- FIM FIREBASE ---

        // Verifica elementos essenciais (como antes)
        if (!themeToggle || !esforcoPorDiaInput || !playlistUrlInput || !carregarBtn || !videosContainer || !resetProgressBtn) { /* ... erro ... */ return; }

        // Carrega tema e esforço (como antes)
        const savedTheme = localStorage.getItem('meuTema') || 'light';
        setTheme(savedTheme);
        const savedEsforco = localStorage.getItem('meuEsforcoPorDia') || (typeof CONFIG_ESFORCO !== 'undefined' ? CONFIG_ESFORCO.ORCAMENTO_DIARIO_PADRAO : 10);
        esforcoPorDiaInput.value = savedEsforco;

        // Carrega playlist salva/padrão (como antes)
        let urlParaCarregar = null;
        const urlSalva = localStorage.getItem('minhaPlaylistSalva');
        const urlPadrao = (typeof PLAYLIST_PADRAO_URL !== 'undefined') ? PLAYLIST_PADRAO_URL : null;
        if (urlSalva) { urlParaCarregar = urlSalva; }
        else if (urlPadrao) { urlParaCarregar = urlPadrao; }

        if (urlParaCarregar) {
            playlistUrlInput.value = urlParaCarregar;
            handleLoadPlaylist(); // Chama diretamente
        } else {
            console.log("Nenhuma playlist salva ou padrão para carregar.");
            if(videosContainer) videosContainer.innerHTML = '<p class="loading-message">Cole o link de uma playlist e clique em Carregar.</p>';
        }
     } catch(e) {
         console.error("Erro CRÍTICO durante DOMContentLoaded:", e);
         alert(`Erro GRAVE ao inicializar a página: ${e.message}. Verifique o console.`);
         if(videosContainer) videosContainer.innerHTML = `<p style="color: red; text-align: center;"><b>Falha na inicialização.</b> Verifique o console (F12).</p>`;
     }
});

// --- Lógica do Botão Carregar ---
if (carregarBtn) { carregarBtn.addEventListener('click', handleLoadPlaylist); }
else { console.error("Elemento #carregarPlaylist não encontrado."); }

async function handleLoadPlaylist() { /* ... (código como antes, usa flag firebaseInicializado) ... */ }

// --- Funções de Cálculo de Esforço ---
function parseDuration(durationString) { /* ... (código como antes) ... */ }
function calcularEsforco(title, durationString) { /* ... (código como antes) ... */ }

// --- Função Principal carregarVideosDaPlaylist ---
async function carregarVideosDaPlaylist(playlistId) { /* ... (código como antes, usa flag firebaseInicializado) ... */ }

// --- Função onPlayerStateChange (Global) ---
function onPlayerStateChange(event) { /* ... (código como antes) ... */ }

// --- Tratamento de erro global ---
window.addEventListener('unhandledrejection', event => { /* ... (código como antes) ... */ });

// --- Funções auxiliares ---
// (Definições completas como na versão anterior)
// function parseDuration(durationString) { /* ... */ }
// function calcularEsforco(title, durationString) { /* ... */ }
// function checkDayCompletion(diaConteudoElement) { /* ... */ }
// function showToast(message, type = 'info') { /* ... */ }
// function openDay(diaConteudo) { /* ... */ }
// function closeDay(diaConteudo) { /* ... */ }
// function getFraseDeEsforco(pontos) { /* ... */ }
// function logarConclusaoDeDia() { /* ... */ }
// function autoOpenAndHighlightNextDay() { /* ... */ }