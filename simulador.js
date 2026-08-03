/**
 * SpeedSim - Simulador MCMV / SBPE para SpeedBroker
 */

// ============================================================================
// ⚙️ TABELA DE PARÂMETROS DA CAIXA ECONÔMICA (ATUALIZE AQUI PERIODICAMENTE)
// ============================================================================
const CAIXA_CONFIG = {
  // Enquadramento de Renda MCMV (Teto de Renda Familiar Bruta)
  rendaMaxFaixa1: 2850.00,
  rendaMaxFaixa2: 4700.00,
  rendaMaxFaixa3: 8400.00,

  // Teto de Valor do Imóvel no MCMV
  tetoImovelMCMV: 350000.00,

  // Taxas de Juros Efetivas Nominais (% a.a.)
  jurosFaixa1: 4.25,
  jurosFaixa2: 5.25,
  jurosFaixa3: 7.66,
  jurosSBPE: 9.50, // Taxa média SBPE padrão

  // Subsídios Máximos MCMV
  subsidioMaxFaixa1: 55000.00,
  subsidioMaxFaixa2: 30000.00,
  
  // Limites de Financiamento (Quota Máxima)
  quotaMaxFinanciamento: 0.80, // Máximo 80% do valor do imóvel

  // Limite Idade + Prazo (Anos)
  prazoMaxAnos: 35,
  idadeMaxSomada: 80 // Idade + Prazo não pode ultrapassar 80 anos
};

// Objeto global com estado da simulação ativa
let simState = {
  valorImovel: 0,
  rendaFamiliar: 0,
  dataNascimento: '',
  sinal: 0,
  fgts: 0,
  numParcelasEntrada: 1,
  valorFinanciado: 0,
  taxaJurosAnual: 0,
  prazoMeses: 0,
  amortizacoesExtras: {} // { mes: valor } - Unificado para SAC e PRICE
};

// Vinculação de eventos quando o DOM é carregado
document.addEventListener('DOMContentLoaded', () => {
  const btnSpeedsim = document.getElementById('btn-sobre');
  if (btnSpeedsim) {
    btnSpeedsim.addEventListener('click', abrirSpeedSim);
  }

  const modal = document.getElementById('modal-sobre');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) fecharSpeedSim();
    });
  }
});

function abrirSpeedSim() {
  const modal = document.getElementById('modal-sobre');
  if (modal) {
    modal.style.display = 'block';
    simularFluxo();
  }
}

function fecharSpeedSim() {
  const modal = document.getElementById('modal-sobre');
  if (modal) {
    modal.style.display = 'none';
  }
}

/**
 * Calcula a idade em anos a partir da data de nascimento
 */
function calcularIdade(dataNasc) {
  if (!dataNasc) return 30;
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
 * Determina Enquadramento e Parâmetros usando as regras configuráveis da Caixa
 */
function calcularParametrosCaixa(renda, idade, valorImovel) {
  const prazoMaxAnos = Math.min(CAIXA_CONFIG.prazoMaxAnos, Math.max(1, CAIXA_CONFIG.idadeMaxSomada - idade));
  const prazoMaxMeses = prazoMaxAnos * 12;

  let programa = "SBPE";
  let jurosEfetivos = CAIXA_CONFIG.jurosSBPE;
  let subsidioMax = 0;

  // Enquadramento Minha Casa Minha Vida
  if (renda <= CAIXA_CONFIG.rendaMaxFaixa3 && valorImovel <= CAIXA_CONFIG.tetoImovelMCMV) {
    programa = "MCMV";
    
    if (renda <= CAIXA_CONFIG.rendaMaxFaixa1) {
      jurosEfetivos = CAIXA_CONFIG.jurosFaixa1;
      subsidioMax = Math.min(CAIXA_CONFIG.subsidioMaxFaixa1, valorImovel * 0.25);
    } else if (renda <= CAIXA_CONFIG.rendaMaxFaixa2) {
      jurosEfetivos = CAIXA_CONFIG.jurosFaixa2;
      subsidioMax = Math.min(CAIXA_CONFIG.subsidioMaxFaixa2, valorImovel * 0.15);
    } else {
      jurosEfetivos = CAIXA_CONFIG.jurosFaixa3;
      subsidioMax = 0;
    }
  } else {
    programa = "SBPE (Caixa)";
    jurosEfetivos = CAIXA_CONFIG.jurosSBPE;
    subsidioMax = 0;
  }

  const maxFinanciamentoQuota = valorImovel * CAIXA_CONFIG.quotaMaxFinanciamento;

  return {
    programa,
    jurosEfetivos,
    subsidioMax,
    prazoMaxMeses,
    maxFinanciamentoQuota
  };
}

/**
 * Recálculo em tempo real do fluxo
 */
function simularFluxo() {
  const elImovel = document.getElementById('sim-val-imovel');
  if (!elImovel) return;

  const valorImovel = parseFloat(elImovel.value) || 0;
  const renda = parseFloat(document.getElementById('sim-renda').value) || 0;
  const dataNasc = document.getElementById('sim-data-nasc').value;
  const sinal = parseFloat(document.getElementById('sim-sinal').value) || 0;
  const fgts = parseFloat(document.getElementById('sim-fgts').value) || 0;
  const numParcelasEntrada = parseInt(document.getElementById('sim-num-parcelas').value) || 1;

  if (valorImovel <= 0) return;

  const idade = calcularIdade(dataNasc);
  const params = calcularParametrosCaixa(renda, idade, valorImovel);

  const valorFinanciado = Math.min(valorImovel * CAIXA_CONFIG.quotaMaxFinanciamento, params.maxFinanciamentoQuota);
  const percentFinanciado = ((valorFinanciado / valorImovel) * 100).toFixed(1);

  const subsidio = params.subsidioMax;
  const entradaTotal = Math.max(0, valorImovel - valorFinanciado - subsidio);
  const saldoEntradaParcelado = Math.max(0, entradaTotal - sinal - fgts);
  const valorParcelaEntrada = numParcelasEntrada > 0 ? (saldoEntradaParcelado / numParcelasEntrada) : 0;

  // Atualiza painel de resultados
  document.getElementById('res-enquadramento').innerText = params.programa;
  document.getElementById('res-financiamento').innerText = `R$ ${valorFinanciado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
  document.getElementById('res-percent-financiado').innerText = `${percentFinanciado}% do imóvel`;
  document.getElementById('res-juros').innerText = `${params.jurosEfetivos.toFixed(2)}% a.a.`;
  document.getElementById('res-subsidio').innerText = `R$ ${subsidio.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
  document.getElementById('res-prazo-max').innerText = `${params.prazoMaxMeses} meses (${Math.floor(params.prazoMaxMeses / 12)} anos)`;
  document.getElementById('res-entrada-total').innerText = `R$ ${entradaTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
  document.getElementById('res-saldo-parcelado').innerText = `${numParcelasEntrada}x de R$ ${valorParcelaEntrada.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

  // Grava estado
  simState.valorFinanciado = valorFinanciado;
  simState.taxaJurosAnual = params.jurosEfetivos;
  simState.prazoMeses = params.prazoMaxMeses;

  gerarTabelaUnificada();
}

/**
 * Renderiza a Tabela Unificada SAC vs PRICE com amortização única e scroll único
 */
function gerarTabelaUnificada() {
  const P = simState.valorFinanciado;
  const n = simState.prazoMeses;
  const iMensal = Math.pow(1 + (simState.taxaJurosAnual / 100), 1 / 12) - 1;

  if (!P || !n) return;

  let saldoSac = P;
  let saldoPrice = P;
  const amortizacaoConstanteSac = P / n;
  const parcelaConstantePrice = P * ( (iMensal * Math.pow(1 + iMensal, n)) / (Math.pow(1 + iMensal, n) - 1) );

  let totalPagoSac = 0;
  let totalPagoPrice = 0;
  let htmlTabela = '';

  for (let mes = 1; mes <= n; mes++) {
    const amortExtra = parseFloat(simState.amortizacoesExtras[mes]) || 0;

    // --- CÁLCULOS SAC ---
    let jurosSac = 0;
    let amortTotalSac = 0;
    let parcelaSac = 0;

    if (saldoSac > 0) {
      jurosSac = saldoSac * iMensal;
      amortTotalSac = amortizacaoConstanteSac + amortExtra;
      if (amortTotalSac > saldoSac) amortTotalSac = saldoSac;
      parcelaSac = amortTotalSac + jurosSac;
      saldoSac -= amortTotalSac;
      if (saldoSac < 0) saldoSac = 0;
      totalPagoSac += parcelaSac;
    }

    // --- CÁLCULOS PRICE ---
    let jurosPrice = 0;
    let amortTotalPrice = 0;
    let parcelaPrice = 0;

    if (saldoPrice > 0) {
      jurosPrice = saldoPrice * iMensal;
      let amortizacaoPriceBase = parcelaConstantePrice - jurosPrice;
      amortTotalPrice = amortizacaoPriceBase + amortExtra;
      if (amortTotalPrice > saldoPrice) amortTotalPrice = saldoPrice;
      parcelaPrice = amortTotalPrice + jurosPrice;
      saldoPrice -= amortTotalPrice;
      if (saldoPrice < 0) saldoPrice = 0;
      totalPagoPrice += parcelaPrice;
    }

    const classeLinha = amortExtra > 0 ? 'class="linha-amortizada"' : '';

    htmlTabela += `
      <tr ${classeLinha}>
        <td><strong>${mes}</strong></td>
        <td>
          <input type="number" class="input-amort-extra" data-mes="${mes}" 
                 value="${simState.amortizacoesExtras[mes] || ''}" placeholder="0,00" onchange="atualizarAmortizacaoUnificada(this)">
        </td>
        <!-- SAC -->
        <td>R$ ${parcelaSac.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td>R$ ${jurosSac.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td>R$ ${saldoSac.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <!-- PRICE -->
        <td style="border-left: 2px solid #ddd;">R$ ${parcelaPrice.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td>R$ ${jurosPrice.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td>R$ ${saldoPrice.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
      </tr>
    `;

    if (saldoSac === 0 && saldoPrice === 0) break;
  }

  // Renderiza corpo da tabela
  document.getElementById('tabela-unificada-body').innerHTML = htmlTabela;

  // Atualiza os Totais Gerais Pagos
  document.getElementById('res-total-sac').innerText = `R$ ${totalPagoSac.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  document.getElementById('res-total-price').innerText = `R$ ${totalPagoPrice.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

/**
 * Atualiza o valor de amortização extra unificado
 */
function atualizarAmortizacaoUnificada(inputEl) {
  const mes = inputEl.getAttribute('data-mes');
  const valor = parseFloat(inputEl.value) || 0;

  if (valor > 0) {
    simState.amortizacoesExtras[mes] = valor;
  } else {
    delete simState.amortizacoesExtras[mes];
  }

  gerarTabelaUnificada();
}
