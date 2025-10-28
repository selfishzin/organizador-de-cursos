// ===================================
// ARQUIVO DE CONFIGURAÇÃO (config.js)
// ===================================
// Coloque sua chave de API aqui. Esta é a única vez que você precisará mexer nela.
const CHAVE_API = 'AIzaSyCDVZQLcB8HyxHnRAYYEJnCfK9zytL8wbs';


// (OPCIONAL) Coloque uma URL de playlist padrão aqui.
// O campo no site já virá preenchido com ela.
// Se quiser o campo em branco, deixe as aspas vazias: ""
const PLAYLIST_PADRAO_URL = 'https://www.youtube.com/playlist?list=PL62G310vn6nFIsOCC0H-C2infYgwm8SWW';

// --- CONFIGURAÇÃO DO FIREBASE (CHAVE ORIGINAL REVERTIDA) ---
const firebaseConfig = {
  apiKey: "AIzaSyDJwY4TrxR3uOvimNCmJI775BpmKtpN3U8", 
  authDomain: "meu-app-estudos.firebaseapp.com",
  projectId: "meu-app-estudos",
  storageBucket: "meu-app-estudos.firebaseapp.com",
  messagingSenderId: "256586792349",
  appId: "1:256586792349:web:d8bfce77ca3500d7e5c374",
  measurementId: "G-QEQY12RG2M"
};

const CONFIG_ESFORCO = {
    ORCAMENTO_DIARIO_PADRAO: 10, // Objetivo MÍNIMO de esforço por dia
    PONTOS_POR_MINUTO: 0.5,
    PONTUACAO_MINIMA: 1,
    MODIFICADORES_TITULO: {
        FACIL: { palavras: ["bem-vindo", "o que esperar", "como java funciona", "download", "configurando", "executando compilação","conhecendo a ide", "comentários", "introdução", "pt 01"], modificador: -2 },
        DIFICIL: { palavras: ["orientação objetos", "classes abstratas", "herança", "interfaces", "polimorfismo", "sobrescrita", "sobrecarga", "modificador final", "enumeração", "exceções", "exception", "runtimeexception","try with resources", "coleções", "collections", "list", "set", "map", "queue","hashcode", "equals", "comparable", "comparator", "iterator", "binary search","generics", "wildcard", "classes genéricas", "classes internas", "classes anônimas","lambdas", "predicate", "consumer", "function", "method reference", "optional","streams", "flatmap", "reduce", "collectors", "parallel streams","threads", "concorrência", "sincronismo", "atomicinteger", "lock", "reentrantlock","deadlock", "wait, notify", "blockingqueue", "executors", "thread pools","completablefuture", "padrões de projeto", "builder", "factory", "singleton","jdbc", "banco", "mysql", "docker", "maven", "statement", "resultset","crud", "testes unitários", "junit", "record class", "pattern matching","exercício"], modificador: +3 }
    }
};

// --- Frases e Retenção ---
const CONFIG_APRENDIZADO = {
    FRASES_DE_ESFORCO: [
        { limite: 7,  frase: "Dia leve! (🔥)" }, { limite: 10, frase: "Foco total. (🔥🔥)" },
        { limite: 13, frase: "Dia puxado. (🔥🔥🔥)" }, { limite: 99, frase: "Maratona! Divida. (🔥🔥🔥🔥🔥)" }
    ],
    LIMITE_DIAS_CONCLUIDOS: 2,
    MENSAGEM_AVISO: "Uau, {count}º dia hoje! 🔥 Pausa sugerida pela neurociência. Que tal voltar amanhã?",
    INTERVALOS_REVISAO: [1, 3, 7, 16, 30] 
};

// --- IDEIA 2 (Modo Foco) ---
const CONFIG_POMODORO = {
    DURACAO_SESSAO_MIN: 25, // 25 minutos de foco
    DURACAO_PAUSA_MIN: 5      // 5 minutos de pausa
};

// --- CONFIGURAÇÃO DO ALARME ---
const ALARME_URL = 'sons/alarme.mp3'; 

// LOG NO FINAL
console.log("Arquivo config.js carregado com sucesso. firebaseConfig:", (typeof firebaseConfig !== 'undefined'));