const QTD_HISTORICO = 50;   
const QTD_TABELA    = 20;   
const INTERVALO_MS  = 2000; 

// Limites de temperatura: são os MESMOS valores do firmware (ecosense.ino) ---
const TEMP_LIMITE  = 26.0;                    // TEMPERATURA_LIMITE: acima disso a ventilação abre
const HISTERESE    = 3.0;                     // HISTERESE: folga para não ligar/desligar toda hora
const TEMP_RETORNO = 23.0; // 23 °C: abaixo disso a ventilação fecha

const ESCALA_MIN = TEMP_LIMITE - 4;         
const ESCALA_MAX = TEMP_LIMITE + 4;          

function formatarHora(dataHora) {
    if (!dataHora) return "--:--:--";
    return dataHora.split(" ")[1] || dataHora;
}

function posicaoNaBarra(temperatura) {
    const pct = ((temperatura - ESCALA_MIN) / (ESCALA_MAX - ESCALA_MIN)) * 100;
    return Math.max(0, Math.min(100, pct));
}

function montarEscala() {
    const p25 = posicaoNaBarra(TEMP_RETORNO);
    const p26 = posicaoNaBarra(TEMP_LIMITE);
    document.getElementById("zona-conforto").style.width = p25 + "%";
    document.getElementById("zona-transicao").style.width = (p26 - p25) + "%";
    document.getElementById("zona-elevada").style.width = (100 - p26) + "%";

    document.getElementById("escala").innerHTML =
        `<span style="left:${p25}%">${TEMP_RETORNO} °C</span>` +
        `<span style="left:${p26}%">${TEMP_LIMITE} °C</span>`;
}

function classificarTemperatura(temperatura) {
    if (temperatura >= TEMP_LIMITE) return "elevado";
    if (temperatura <= TEMP_RETORNO) return "confortavel";
    return "proximo";
}

const ROTULO_CONDICAO = {
    confortavel: "Confortável",
    proximo: "Próxima do limite",
    elevado: "Elevada"
};

function descreverSala(condicao, temPresenca, ventLigada) {
    if (condicao === "elevado") {
        if (!temPresenca) return "Temperatura elevada, mas a sala está vazia. A ventilação permanece desligada para economizar energia.";
        if (ventLigada)   return "Temperatura elevada. Ventilação acionada automaticamente para melhorar o conforto térmico.";
        return "Temperatura elevada. Aguardando o acionamento automático da ventilação.";
    }
    if (condicao === "proximo") {
        if (!temPresenca) return "Temperatura próxima do limite. Sala vazia, com luz e ventilação desligadas.";
        if (ventLigada)   return "Temperatura próxima do limite. A ventilação continua ligada até a temperatura cair abaixo de " + TEMP_RETORNO + " °C.";
        return "Temperatura próxima do limite de " + TEMP_LIMITE + " °C. A ventilação será acionada se ela subir.";
    }
    if (!temPresenca) return "Temperatura confortável. Sala vazia, com luz e ventilação desligadas para economizar energia.";
    if (ventLigada)   return "Temperatura confortável. A ventilação será desligada em instantes.";
    return "Temperatura confortável. Sala ocupada, com luz acesa e ventilação desligada.";
}

function atualizarCards(leitura) {
    if (!leitura || leitura.mensagem) return; // sem resposta (ou banco vazio): mantém o que está na tela

    const temPresenca = leitura.presenca === 1;
    const ledLigado   = leitura.led === 1;
    const ventLigada  = leitura.ventilacao === 1;

    //Cabeçalho: horário da última leitura gravada pelo backend 
    document.getElementById("ultima-atualizacao").textContent = formatarHora(leitura.data_hora);

    //Card principal de temperatura
    const cardTemp = document.getElementById("card-temperatura");
    const tempEl = document.getElementById("temperatura");
    if (leitura.temperatura !== null && leitura.temperatura !== undefined) {
        const temperatura = Number(leitura.temperatura);
        const condicao = classificarTemperatura(temperatura);

        tempEl.innerHTML = temperatura.toFixed(1) + '<span class="unidade">°C</span>';
        document.getElementById("condicao").textContent = ROTULO_CONDICAO[condicao];
        document.getElementById("resumo").textContent = descreverSala(condicao, temPresenca, ventLigada);
        document.getElementById("marcador").style.left = posicaoNaBarra(temperatura) + "%";

        // Classe estado, troca as cores (âmbar só quando há alerta)
        cardTemp.classList.remove("estado-confortavel", "estado-proximo", "estado-elevado");
        cardTemp.classList.add("estado-" + condicao);
    } else {
        tempEl.textContent = "sem leitura";
        document.getElementById("condicao").textContent = "Sem leitura";
    }

    //Presença (1 = alguém na sala)
    document.getElementById("presenca").textContent = temPresenca ? "Detectada" : "Não detectada";
    document.getElementById("desc-presenca").textContent = temPresenca ? "Sala ocupada" : "Sala vazia";
    document.getElementById("card-presenca").classList.toggle("ativo", temPresenca);

    //Distância (-1 significa que o sensor não leu) 
    const distEl = document.getElementById("distancia");
    const distanciaValida = leitura.distancia !== -1;
    if (distanciaValida) {
        distEl.innerHTML = Number(leitura.distancia).toFixed(1) + '<span class="unidade">cm</span>';
    } else {
        distEl.textContent = "sem leitura";
    }
    document.getElementById("card-distancia").classList.toggle("ativo", distanciaValida);

    // Iluminação (LED): mantém a luz acesa enquanto há presença
    document.getElementById("led").textContent = ledLigado ? "Ligada" : "Desligada";
    document.getElementById("desc-led").textContent =
        ledLigado ? "Acesa enquanto houver presença" : "Apagada para economizar energia";
    document.getElementById("card-led").classList.toggle("ativo", ledLigado);

    // Ventilação: o motivo muda conforme a lógica do firmware
    let motivo;
    if (ventLigada) {
        motivo = leitura.temperatura >= TEMP_LIMITE
            ? "Acionada: temperatura acima de " + TEMP_LIMITE + " °C"
            : "Ligada até a temperatura cair abaixo de " + TEMP_RETORNO + " °C";
    } else if (!temPresenca) {
        motivo = "Desligada: sala vazia";
    } else if (leitura.temperatura >= TEMP_LIMITE) {
        motivo = "Aguardando acionamento automático";
    } else {
        motivo = "Desligada: temperatura abaixo do limite de " + TEMP_LIMITE + " °C";
    }
    document.getElementById("ventilacao").textContent = ventLigada ? "Ligada" : "Desligada";
    document.getElementById("desc-ventilacao").textContent = motivo;
    document.getElementById("card-ventilacao").classList.toggle("ativo", ventLigada);
}

function atualizarEstatisticas(est) {
    if (!est) return;
    document.getElementById("est-total").textContent = est.total;
    document.getElementById("est-media").textContent = est.temperatura_media + " °C";
    document.getElementById("est-maxima").textContent = est.temperatura_maxima + " °C";
    document.getElementById("est-presenca").textContent = est.percentual_presenca + "%";
    document.getElementById("est-led").textContent = est.percentual_led + "%";
}

function atualizarTabela(leituras) {
    const corpo = document.getElementById("corpo-tabela");
    corpo.innerHTML = ""; // limpa as linhas antigas antes de remontar

    // slice(0, 20) pega as 20 mais recentes (o backend já manda da mais nova para a mais antiga)
    const ultimas = leituras.slice(0, QTD_TABELA);

    for (const leitura of ultimas) {
        // badge(ligado, textoOn, textoOff) devolve o HTML do selo colorido
        const badge = (ligado, textoOn, textoOff) =>
            `<span class="badge ${ligado ? "ligado" : "desligado"}">${ligado ? textoOn : textoOff}</span>`;

        const linha = `
            <tr>
                <td>${formatarHora(leitura.data_hora)}</td>
                <td>${leitura.distancia === -1 ? "—" : leitura.distancia + " cm"}</td>
                <td>${leitura.temperatura} °C</td>
                <td>${badge(leitura.presenca === 1, "Sim", "Não")}</td>
                <td>${badge(leitura.led === 1, "Ligado", "Desligado")}</td>
                <td>${badge(leitura.ventilacao === 1, "Ligada", "Desligada")}</td>
            </tr>`;
        corpo.innerHTML += linha;
    }
}

function desenharGrafico(leituras) {
    const canvas = document.getElementById("grafico");
    const ctx = canvas.getContext("2d");
    const largura = canvas.width;
    const altura = canvas.height;
    const margem = 30;  
    const margemX = 64; 

    ctx.clearRect(0, 0, largura, altura); // limpa o desenho anterior

    if (leituras.length < 2) {
        ctx.fillStyle = "#9ca3af";
        ctx.font = "16px system-ui";
        ctx.textAlign = "center";
        ctx.fillText("Aguardando dados...", largura / 2, altura / 2);
        return;
    }

    // Pega só a lista de temperaturas na ordem do histórico
    const temperaturas = leituras.map(l => l.temperatura);
    const minimo = Math.min(...temperaturas);
    const maximo = Math.max(...temperaturas);

    // Converte (índice, temperatura) em coordenadas (x, y) do canvas
    const x = i => margemX + (i * (largura - 2 * margemX)) / (temperaturas.length - 1);
    const y = t => altura - margem - ((t - minimo) / ((maximo - minimo) || 1)) * (altura - 2 * margem);

    // Grade horizontal bem suave, só para dar referência de altura
    ctx.strokeStyle = "#e6efe7";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
        const gy = margem + (i * (altura - 2 * margem)) / 3;
        ctx.beginPath();
        ctx.moveTo(margemX, gy);
        ctx.lineTo(largura - margemX, gy);
        ctx.stroke();
    }

    // Área sob a linha: degradê verde que some para baixo.
    const degrade = ctx.createLinearGradient(0, margem, 0, altura - margem);
    degrade.addColorStop(0, "rgba(63, 122, 84, 0.28)");
    degrade.addColorStop(1, "rgba(63, 122, 84, 0)");
    ctx.beginPath();
    ctx.moveTo(x(0), altura - margem);
    for (let i = 0; i < temperaturas.length; i++) {
        ctx.lineTo(x(i), y(temperaturas[i]));
    }
    ctx.lineTo(x(temperaturas.length - 1), altura - margem);
    ctx.closePath();
    ctx.fillStyle = degrade;
    ctx.fill();

    // Linha verde da temperatura.
    ctx.strokeStyle = "#3f7a54";
    ctx.lineWidth = 2.5;
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x(0), y(temperaturas[0]));       
    for (let i = 1; i < temperaturas.length; i++) {
        ctx.lineTo(x(i), y(temperaturas[i]));   
    }
    ctx.stroke();                              

    // Destaca só o ponto mais recente (o último da lista).
    const ultimo = temperaturas.length - 1;
    ctx.fillStyle = "#1f3d2b";
    ctx.beginPath();
    ctx.arc(x(ultimo), y(temperaturas[ultimo]), 5, 0, 2 * Math.PI);
    ctx.fill();

    // Escreve o mínimo e o máximo do eixo Y nos cantos esquerdos.
    ctx.fillStyle = "#66796d";
    ctx.font = "12px system-ui";
    ctx.textAlign = "left";
    ctx.fillText(maximo + " °C", 4, margem);
    ctx.fillText(minimo + " °C", 4, altura - margem + 4);
}

async function atualizarTudo() {
    const [leitura, leituras, estatisticas] = await Promise.all([
        buscarUltimaLeitura(),
        buscarHistorico(QTD_HISTORICO),
        buscarEstatisticas()
    ]);

    // Indicador de conexão: se o backend não respondeu, avisa no cabeçalho
    const online = leitura !== null;
    document.getElementById("status").classList.toggle("offline", !online);
    document.getElementById("status-texto").textContent =
        online ? "Conectado ao backend" : "Sem conexão com o backend";

    atualizarCards(leitura);
    atualizarTabela(leituras);
    desenharGrafico(leituras.slice().reverse()); 
    atualizarEstatisticas(estatisticas);
}

montarEscala();
atualizarTudo();
setInterval(atualizarTudo, INTERVALO_MS);
