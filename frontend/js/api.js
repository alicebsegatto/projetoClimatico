
// Se o frontend for aberto em OUTRO computador (não na Raspberry),
// troque "localhost" pelo IP da Raspberry (ex.: "http://192.168.0.25:8000").
const CONFIG = {
    BASE_URL: "http://localhost:8000"
};

// Retorna um objeto {data_hora, distancia, temperatura, presenca, led, ventilacao}
// ou null em caso de erro.
async function buscarUltimaLeitura() {
    try {
        const resposta = await fetch(`${CONFIG.BASE_URL}/leituras/ultima`);
        if (!resposta.ok) {
            throw new Error(`Erro HTTP ${resposta.status}`);
        }
        return await resposta.json();          // converte a resposta em objeto JS
    } catch (erro) {
        console.error("Erro ao buscar a última leitura:", erro);
        return null;                           // a tela trata null como "sem dados"
    }
}

// Busca o histórico de leituras (GET /leituras?limite=N).
// Retorna um array com as últimas N leituras, ou [] em caso de erro.
async function buscarHistorico(limite) {
    try {
        const resposta = await fetch(`${CONFIG.BASE_URL}/leituras?limite=${limite}`);
        if (!resposta.ok) {
            throw new Error(`Erro HTTP ${resposta.status}`);
        }
        return await resposta.json();          // array de leituras
    } catch (erro) {
        console.error("Erro ao buscar o histórico:", erro);
        return [];
    }
}

// Retorna {total, temperatura_media, temperatura_maxima, temperatura_minima,
// percentual_presenca, percentual_led, percentual_ventilacao} ou null.
async function buscarEstatisticas() {
    try {
        const resposta = await fetch(`${CONFIG.BASE_URL}/estatisticas`);
        if (!resposta.ok) {
            throw new Error(`Erro HTTP ${resposta.status}`);
        }
        return await resposta.json();
    } catch (erro) {
        console.error("Erro ao buscar as estatísticas:", erro);
        return null;
    }
}
