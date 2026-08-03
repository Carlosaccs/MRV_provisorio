/**
 * SpeedSim - Simulador MCMV / SBPE para SpeedBroker
 */

// Objeto global com estado da simulação ativa
let simState = {
  valorImovel: 0,
  rendaFamiliar: 0,
  dataNascimento: '',
  possuiFgts: false,
  maisDeUmComprador: false,
  sinal: 0,
  fgts: 0,
  numParcelasEntrada: 1,
  amortizacoesSac: {},   // { mes: valor }
  amortizacoesPrice: {}  // { mes: valor }
};

/**
 * Função principal acionada pelo botão "SpeedSim" da barra superior
 */
function abrirSpeedSim() {
  const modal = document.getElementById('speedsim-modal');
  if (modal) {
    modal.style.display = 'flex';
  }
}

function fecharSpeedSim() {
  const modal = document.getElementById('speedsim-modal');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Calcula a idade em anos a partir da data de nascimento
 */
function calcularIdade(dataNasc) {
  if (!dataNasc) return 30; // Idade padrão
  const hoje = new Date();
  const nasc = new Date(dataNasc);
  let idade = hoje.getFullYear() - nasc.getFullYear();
  const m = hoje.getMonth() - nasc.getMonth();
  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
    idade--;
  }
  return idade;
}

/**
 * Determina Enquadramento, Juros Efetivos, Subsídio Máximo e Prazo Máximo
 */
function calcularParametrosCaixa(renda, idade, valorImovel) {
  // Prazo Máximo (Máximo 35 anos ou até completar 80 anos e 6 meses)
  const prazoMaxAnos = Math.min(35, Math.max(1, 80 - idade));
  const prazoMaxMeses = prazoMaxAnos * 12;

  let programa = "SBPE";
  let jurosEfetivos = 9.99; // % a.a. padrão SBPE
  let subsidioMax = 0;
  let maxQuotaPercent = 0.80; // Até 80% de financiamento

  // Regras Gerais MCMV 2026
  if (renda <= 8400 && valorImovel <= 350000) {
    programa = "Minha Casa Minha Vida";
    
    // Faixa 1 (até R$ 2.850,00)
    if (renda <= 2850) {
      jurosEfetivos = 4.25;
      subsidioMax = Math.min(55000, valorImovel * 0.25);
    } 
    // Faixa 2 (R$ 2.850,01 a R$ 4.700,00)
    else if (renda <= 4700) {
      jurosEfetivos = 5.25;
      subsidioMax = Math.min(30000, valorImovel * 0.15);
    } 
    // Faixa 3 (R$ 4.700,01 a R$ 8.400,00)
    else {
      jurosEfetivos = 7.66;
      subsidioMax = 0;
    }
  } else {
    programa = "SBPE (Caixa Econômica)";
    jurosEfetivos = 9.50;
    subsidioMax = 0;
  }

  // Capacidade Máxima de Financiamento (Regra da Comprometimento de Renda - Máx 30%)
  const maxFinanciamentoQuota = valorImovel * maxQuotaPercent;

  return {
    programa,
    jurosEfetivos,
    subsidioMax,
    prazoMaxMeses,
    maxFinanciamentoQuota
  };
}

/**
 * Evento principal acionado pelo botão "Simular Fluxo"
 */
function simularFluxo() {
  const valorImovel = parseFloat(document.getElementById('sim-val-imovel').value) || 0;
  const renda = parseFloat(document.getElementById('sim-renda').value) || 0;
  const dataNasc = document.getElementById('sim-data-nasc').value;
  const sinal = parseFloat(document.getElementById('sim-sinal').value) || 0;
  const fgts = parseFloat(document.getElementById('sim-fgts').value) || 0;
  const numParcelasEntrada = parseInt(document.getElementById('sim-num-parcelas').value) || 1;

  if (valorImovel <= 0) {
    alert("Por favor, informe um valor de imóvel válido.");
    return;
  }

  const idade = calcularIdade(dataNasc);
  const params = calcularParametrosCaixa(renda, idade, valorImovel);

  // Estimativa do Valor Financiado (Limitado a 80% do valor do imóvel)
  const valorFinanciado = Math.min(valorImovel * 0.80, params.maxFinanciamentoQuota);
  const percentFinanciado = ((valorFinanciado / valorImovel) * 100).toFixed(1);

  // Cálculo da Entrada Bruta e Entrada Líquida Parcelada
  const subsidio = params.subsidioMax;
  const entradaTotal = valorImovel - valorFinanciado - subsidio;
  const saldoEntradaParcelado = Math.max(0, entradaTotal - sinal - fgts);
  const valorParcelaEntrada = numParcelasEntrada > 0 ? (saldoEntradaParcelado / numParcelasEntrada) : 0;

  // Atualizar os Cards de Resumo no Painel
  document.getElementById('res-enquadramento').innerText = params.programa;
  document.getElementById('res-financiamento').innerText = `R$ ${valorFinanciado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
  document.getElementById('res-percent-financiado').innerText = `${percentFinanciado}% do imóvel`;
  document.getElementById('res-juros').innerText = `${params.jurosEfetivos.toFixed(2)}% a.a.`;
  document.getElementById('res-subsidio').innerText = `R$ ${subsidio.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
  document.getElementById('res-prazo-max').innerText = `${params.prazoMaxMeses} meses (${params.prazoMaxMeses / 12} anos)`;
  document.getElementById('res-entrada-total').innerText = `R$ ${entradaTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
  document.getElementById('res-entrada-desmembrada').innerText = 
    `Sinal: R$ ${sinal.toLocaleString('pt-BR', {minimumFractionDigits: 2})} | FGTS: R$ ${fgts.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
  document.getElementById('res-saldo-parcelado').innerText = 
    `Saldo em ${numParcelasEntrada}x de R$ ${valorParcelaEntrada.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;

  // Atualiza o Estado Global
  simState.valorFinanciado = valorFinanciado;
  simState.taxaJurosAnual = params.jurosEfetivos;
  simState.prazoMeses = params.prazoMaxMeses;

  // Renderizar as Tabelas de Amortização (SAC e PRICE)
  gerarTabelasAmortizacao();
}

/**
 * Gera as tabelas dinâmicas SAC e PRICE com suporte a amortizações pontuais
 */
function gerarTabelasAmortizacao() {
  const P = simState.valorFinanciado;
  const n = simState.prazoMeses;
  const iMensal = Math.pow(1 + (simState.taxaJurosAnual / 100), 1 / 12) - 1;

  if (!P || !n) return;

  // 1. GERAR TABELA SAC
  let saldoSac = P;
  const amortizacaoConstanteSac = P / n;
  let htmlSac = '';

  for (let mes = 1; mes <= n; mes++) {
    const juros = saldoSac * iMensal;
    const amortExtra = parseFloat(simState.amortizacoesSac[mes]) || 0;
    let amortTotal = amortizacaoConstanteSac + amortExtra;

    if (amortTotal > saldoSac) {
      amortTotal = saldoSac;
    }

    const parcela = amortTotal + juros;
    saldoSac -= amortTotal;
    if (saldoSac < 0) saldoSac = 0;

    htmlSac += `
      <tr>
        <td>${mes}</td>
        <td>R$ ${parcela.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td>R$ ${amortTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td>R$ ${juros.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td>R$ ${saldoSac.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td>
          <input type="number" class="input-amort" data-tabela="sac" data-mes="${mes}" 
                 value="${simState.amortizacoesSac[mes] || ''}" placeholder="0,00" onchange="atualizarAmortizacao(this)">
        </td>
      </tr>
    `;

    if (saldoSac === 0) break;
  }
  document.getElementById('tabela-sac-body').innerHTML = htmlSac;

  // 2. GERAR TABELA PRICE
  let saldoPrice = P;
  const parcelaConstantePrice = P * ( (iMensal * Math.pow(1 + iMensal, n)) / (Math.pow(1 + iMensal, n) - 1) );
  let htmlPrice = '';

  for (let mes = 1; mes <= n; mes++) {
    const juros = saldoPrice * iMensal;
    let amortizacao = parcelaConstantePrice - juros;
    const amortExtra = parseFloat(simState.amortizacoesPrice[mes]) || 0;
    let amortTotal = amortizacao + amortExtra;

    if (amortTotal > saldoPrice) {
      amortTotal = saldoPrice;
    }

    const parcelaFinal = amortTotal + juros;
    saldoPrice -= amortTotal;
    if (saldoPrice < 0) saldoPrice = 0;

    htmlPrice += `
      <tr>
        <td>${mes}</td>
        <td>R$ ${parcelaFinal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td>R$ ${amortTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td>R$ ${juros.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td>R$ ${saldoPrice.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td>
          <input type="number" class="input-amort" data-tabela="price" data-mes="${mes}" 
                 value="${simState.amortizacoesPrice[mes] || ''}" placeholder="0,00" onchange="atualizarAmortizacao(this)">
        </td>
      </tr>
    `;

    if (saldoPrice === 0) break;
  }
  document.getElementById('tabela-price-body').innerHTML = htmlPrice;
}

/**
 * Atualiza o valor de amortização extra informada pelo usuário na coluna correspondente
 */
function atualizarAmortizacao(inputEl) {
  const tabela = inputEl.getAttribute('data-tabela');
  const mes = inputEl.getAttribute('data-mes');
  const valor = parseFloat(inputEl.value) || 0;

  if (tabela === 'sac') {
    if (valor > 0) {
      simState.amortizacoesSac[mes] = valor;
    } else {
      delete simState.amortizacoesSac[mes];
    }
  } else if (tabela === 'price') {
    if (valor > 0) {
      simState.amortizacoesPrice[mes] = valor;
    } else {
      delete simState.amortizacoesPrice[mes];
    }
  }

  // Recalcula as tabelas dinamicamente mantendo o comportamento das séries
  gerarTabelasAmortizacao();
}
