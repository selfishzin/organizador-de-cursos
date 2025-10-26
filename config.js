// ===================================
// ARQUIVO DE CONFIGURAÇÃO (config.js)
// ===================================
// Coloque sua chave de API aqui. Esta é a única vez que você precisará mexer nela.
const CHAVE_API = 'AIzaSyCDVZQLcB8HyxHnRAYYEJnCfK9zytL8wbs';


// (OPCIONAL) Coloque uma URL de playlist padrão aqui.
// O campo no site já virá preenchido com ela.
// Se quiser o campo em branco, deixe as aspas vazias: ""
const PLAYLIST_PADRAO_URL = 'https://www.youtube.com/playlist?list=PL62G310vn6nFIsOCC0H-C2infYgwm8SWW';

const CONFIG_ESFORCO = {
    
    ORCAMENTO_DIARIO_PADRAO: 10,
    PONTOS_POR_MINUTO: 0.5,
    PONTUACAO_MINIMA: 1,

    MODIFICADORES_TITULO: {
        FACIL: {
            palavras: [
                "bem-vindo", "o que esperar", "como java funciona", "download", "configurando", "executando compilação",
                "conhecendo a ide", "comentários", "introdução", "pt 01"
            ],
            modificador: -2
        },
        DIFICIL: {
            palavras: [
                "orientação objetos", "classes abstratas", "herança", "interfaces", "polimorfismo", "sobrescrita", 
                "sobrecarga", "modificador final", "enumeração", "exceções", "exception", "runtimeexception",
                "try with resources", "coleções", "collections", "list", "set", "map", "queue",
                "hashcode", "equals", "comparable", "comparator", "iterator", "binary search",
                "generics", "wildcard", "classes genéricas", "classes internas", "classes anônimas",
                "lambdas", "predicate", "consumer", "function", "method reference", "optional",
                "streams", "flatmap", "reduce", "collectors", "parallel streams",
                "threads", "concorrência", "sincronismo", "atomicinteger", "lock", "reentrantlock",
                "deadlock", "wait, notify", "blockingqueue", "executors", "thread pools",
                "completablefuture", "padrões de projeto", "builder", "factory", "singleton",
                "jdbc", "banco", "mysql", "docker", "maven", "statement", "resultset",
                "crud", "testes unitários", "junit", "record class", "pattern matching",
                "exercício"
            ],
            modificador: +3
        }
    }
};

// ===================================
// NOVA SEÇÃO: FRASES E RETENÇÃO
// ===================================

const CONFIG_APRENDIZADO = {
    
    // Frases para o total de esforço do dia
    // O sistema usará a *primeira* que encontrar (de cima para baixo)
    FRASES_DE_ESFORCO: [
        { limite: 7,  frase: "Dia leve! Ótimo para aquecer. (🔥)" },
        { limite: 10, frase: "Foco total. Dia na medida certa! (🔥🔥)" },
        { limite: 13, frase: "Dia puxado. Vamos com calma e atenção. (🔥🔥🔥)" },
        { limite: 99, frase: "Dia de maratona! Divida em pausas. (🔥🔥🔥🔥🔥)" } // 99 = qualquer coisa acima de 13
    ],

    // Limite de "dias-app" concluídos no *mesmo dia real*
    // O aviso aparecerá no 2º dia concluído
    LIMITE_DIAS_CONCLUIDOS: 2,

    // Mensagem de aviso (a variável {count} será substituída)
    MENSAGEM_AVISO: "Uau, {count}º dia hoje! 🔥 Aviso de retenção: A neurociência sugere uma pausa para consolidar o aprendizado. Que tal parar por aqui e voltar amanhã?"
};