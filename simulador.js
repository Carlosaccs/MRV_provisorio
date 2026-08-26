// ==========================================================
// MÓDULO SPEEDSIM - SIMULADOR DE FINANCIAMENTO
// ==========================================================

// ==========================================================
// 0. CÓDIGOS DE ENTRADA (Eventos da Popup e DOM)
// ==========================================================
document.addEventListener("DOMContentLoaded", () => {
    // 1. Vincula imediatamente o botão principal que já está no HTML fixo
    vincularBotaoPrincipal();
    
    // 2. Tenta carregar a estrutura externa do modal
    carregarEstruturaSimulador();
});

function vincularBotaoPrincipal() {
    const btnAbrir = document.getElementById('btn-speedsim');
    
    if (btnAbrir) {
        // Remove eventuais duplicidades de listener
        btnAbrir.replaceWith(btnAbrir.cloneNode(true));
        const btnAbrirNovo = document.getElementById('btn-speedsim');
        
        btnAbrirNovo.addEventListener('click', () => {
            const overlay = document.getElementById('modal-speedsim-overlay');
            if (overlay) {
                overlay.style.display = 'flex';
            } else {
                alert("Aviso: A estrutura do simulador ainda está carregando ou o arquivo 'simulador.html' não foi encontrado.");
            }
        });
    }
}

async function carregarEstruturaSimulador() {
    try {
        const resposta = await fetch('simulador.html');
        if (!resposta.ok) throw new Error("Erro ao carregar simulador.html");
        const html = await resposta.text();
        const container = document.getElementById('container-simulador-externo');
        if (container) {
            container.innerHTML = html;
            vincularEventosInternosModal();
        }
    } catch (e) {
        console.warn("Aviso SpeedSim: Executando modo local ou modal já embutido.", e);
    }
}

function vincularEventosInternosModal() {
    const overlay = document.getElementById('modal-speedsim-overlay');
    const btnFechar = document.getElementById('btn-fechar-speedsim');
    const btnCalcular = document.getElementById('btn-executar-simulacao');

    if (btnFechar && overlay) {
        btnFechar.addEventListener('click', () => overlay.style.display = 'none');
    }
    
    if (overlay) {
        overlay.addEventListener('click', (e) => { 
            if (e.target === overlay) overlay.style.display = 'none'; 
        });
    }
      
    if (btnCalcular) {
        btnCalcular.addEventListener('click', () => {
            executarSimulacaoGeral();
        });
    }
}


// ==========================================================
// 1. PARAMETROS (Índices, Taxas e Tabelas)
// ==========================================================
const TABELA_JUROS_MCMV = {
    taxaAnual: 0.045, // Exemplo de taxa referencial
     prazoMaximoMeses: 420
};


// ==========================================================
// 2. CÁLCULOS BÁSICOS (Campos de entrada e pré-requisitos)
// ==========================================================
function processarCalculosBasicos(dadosBrutos) {
    // Coloque aqui os cálculos preliminares (ex: limite de comprometimento de renda)
    return {};
}


// ==========================================================
// 3. MOTOR SAC
// ==========================================================
// ----------------------------------------------------------
// 3.1 CALCULO DO FINANCIAMENTO (SAC)
// ----------------------------------------------------------
function calcularFinanciamentoSAC() {
    // Código de cálculo do financiamento máximo pelo sistema SAC
}

// ----------------------------------------------------------
// 3.2 CALCULO DA ENTRADA (SAC)
// ----------------------------------------------------------
function calcularEntradaSAC() {
    // Código que calcula as formas de pagamento da entrada (ato, mensais, FGTS)
}


// ==========================================================
// 4. MOTOR PRICE
// ==========================================================
// ----------------------------------------------------------
// 4.1 CALCULO DO FINANCIAMENTO (PRICE)
// ----------------------------------------------------------
function calcularFinanciamentoPrice() {
    // Código de cálculo do financiamento máximo pelo sistema Price
}

// ----------------------------------------------------------
// 4.2 CALCULO DA ENTRADA (PRICE)
// ----------------------------------------------------------
function calcularEntradaPrice() {
    // Código que calcula as formas de pagamento da entrada para Price
}


// ==========================================================
// 5. IMPRESSÃO / EXIBIÇÃO DE RESULTADOS
// ==========================================================
// ----------------------------------------------------------
// 5.1 RENDERIZAÇÃO DA TELA
// ----------------------------------------------------------
function executarSimulacaoGeral() {
    // Aqui você chama os motores acima e joga os resultados na tela da popup
    console.log("Executando motores de cálculo...");
    alert("Simulação processada com sucesso usando a arquitetura em blocos!");
}
