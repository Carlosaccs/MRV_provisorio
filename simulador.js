/**
 * SpeedSim - Simulador MCMV / SBPE para SpeedBroker (Versão Calibrada Caixa)
 */

// ============================================================================
// ⚙️ PARÂMETROS E REGRAS CAIXA ECONÔMICA FEDERAL (2026)
// ============================================================================
const CAIXA_CONFIG = {
  // Limites de Renda MCMV (São Paulo / Região Metropolitana)
  rendaMaxFaixa1: 2850.00,
  rendaMaxFaixa2: 4700.00,
  rendaMaxFaixa3: 8400.00,

  tetoImovelMCMV: 350000.00,

  // Tabela de Juros Efetivos Nominais (% a.a.)
  // Com Cotista FGTS (3+ anos) / Sem Cotista
  jurosMCMV: {
    faixa1: { cotista: 4.25, normal: 4.75 },
    faixa2: { cotista: 5.25, normal: 5.75 },
    faixa3: { cotista: 7.23, normal: 7.66 }, // Ajustado para 7.23% conforme simulação Caixa
  },
  jurosSBPE: 9.50,

  // Subsídio Máximo por Região
  subsidioMaxSP: 55000.00,

  // Regras de Margem
  maxComprometimentoRenda: 0.30, // Máximo 30% da renda familiar
  quotaMaxFinanciamento: 0.80,    // Máximo 80% do valor do imóvel

  prazoMaxAnos: 35,
  idadeMaxSomada: 80
};

// Objeto global com estado da simulação ativa
let simState = {
  valorImovel: 0,
  rendaFamiliar: 0,
  dataNascimento: '',
  sinal: 0,
  fgts: 0,
  numParcelasEntrada: 1,
  possuiDependente: true,
  possui3AnosFgts: true,
  municipio: 'SP',
  valorFinanciado: 0,
  taxaJurosAnual: 0,
  prazoMeses: 0,
  amortizacoesExtras: {}
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
  if (!modal) return;

  modal.style.display = 'block';
  simularFluxo();
}

function fecharSpeedSim() {
  const modal = document.getElementById('modal-sobre');
  if (modal) {
    modal.style.display = 'none';
  }
}

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
 * Cálculo Fiel de Juros e Subsídio MCMV
 */
function calcularParametrosCaixa(renda, idade, valorImovel, possui3AnosFgts, possuiDependente) {
  const prazoMaxAnos = Math.min(CAIXA_CONFIG.prazoMaxAnos, Math.max(1, CAIXA_CONFIG.idadeMaxSomada - idade));
  const prazoMaxMeses = prazoMaxAnos * 12;

  let programa = "SBPE";
  let jurosEfetivos = CAIXA_CONFIG.jurosSBPE;
  let subsidioEstimado = 0;

  if (renda <= CAIXA_CONFIG.rendaMaxFaixa3 && valorImovel <= CAIXA_CONFIG.tetoImovelMCMV) {
    programa = "MCMV";

    // Define Taxa de Juros conforme Faixa e Cotista FGTS
    if (renda <= CAIXA_CONFIG.rendaMaxFaixa1) {
      jurosEfetivos = possui3AnosFgts ? CAIXA_CONFIG.jurosMCMV.faixa1.cotista : CAIXA_CONFIG.jurosMCMV.faixa1.normal;
    } else if (renda <= CAIXA_CONFIG.rendaMaxFaixa2) {
      jurosEfetivos = possui3AnosFgts ? CAIXA_CONFIG.jurosMCMV.faixa2.cotista : CAIXA_CONFIG.jurosMCMV.faixa2.normal;
    } else {
      jurosEfetivos = possui3AnosFgts ? CAIXA_CONFIG.jurosMCMV.faixa3.cotista : CAIXA_CONFIG.jurosMCMV.faixa3.normal;
    }

    // Cálculo do Subsídio MCMV (Apenas Faixas 1 e 2 com dependente/mais de um comprador)
    if (renda <= CAIXA_CONFIG.rendaMaxFaixa2 && possuiDependente) {
      const fatorRenda = Math.max(0, (CAIXA_CONFIG.rendaMaxFaixa2 - renda) / CAIXA_CONFIG.rendaMaxFaixa2);
      subsidioEstimado = Math.min(CAIXA_CONFIG.subsidioMaxSP, CAIXA_CONFIG.subsidioMaxSP * fatorRenda * 1.2);
      subsidioEstimado = Math.min(subsidioEstimado, valorImovel * 0.20); // Teto de 20% do imóvel
    } else {
      subsidioEstimado = 0;
    }
  } else {
    programa = "SBPE (Caixa)";
    jurosEfetivos = CAIXA_CONFIG.jurosSBPE;
    subsidioEstimado = 0;
  }

  return {
    programa,
    jurosEfetivos,
    subsidioEstimado,
    prazoMaxMeses
  };
}

/**
 * Simulação de Fluxo com Limite da Parcela em 30% da Renda
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
  const possui3AnosFgts = document.getElementById('sim-fgts-3anos').value === 'sim';
  const possuiDependente = document.getElementById('sim-dependente').value === 'sim';

  if (valorImovel <= 0) return;

  const idade = calcularIdade(dataNasc);
  const params = calcularParametrosCaixa(renda, idade, valorImovel, possui3AnosFgts, possuiDependente);

  // Limite de Financiamento por Quota (80%)
  const maxFinanciamentoQuota = valorImovel * CAIXA_CONFIG.quotaMaxFinanciamento;

  // Limite por Comprometimento de Renda (Máx 30% da Renda em Parcela)
  const maxParcelaPermitida = renda * CAIXA_CONFIG.maxComprometimentoRenda;
  const iMensal = Math.pow(1 + (params.jurosEfetivos / 100), 1 / 12) - 1;
  const n = params.prazoMaxMeses;

  // Financiamento Máximo suportado na PRICE
  const maxFinanciamentoPriceCapacidade = maxParcelaPermitida * ((Math.pow(1 + iMensal, n) - 1) / (iMensal * Math.pow(1 + iMensal, n)));
  const valorFinanciado = Math.min(maxFinanciamentoQuota, maxFinanciamentoPriceCapacidade);

  const percentFinanciado = ((valorFinanciado / valorImovel) * 100).toFixed(1);
  const subsidio = params.subsidioEstimado;
  const entradaTotal = Math.max(0, valorImovel - valorFinanciado - subsidio);
  const saldoEntradaParcelado = Math.max(0, entradaTotal - sinal - fgts);
  const valorParcelaEntrada = numParcelasEntrada > 0 ? (saldoEntradaParcelado / numParcelasEntrada) : 0;

  // Atualiza os Cards da Modal
  document.getElementById('res-enquadramento').innerText = params.programa;
  document.getElementById('res-financiamento').innerText = `R$ ${valorFinanciado.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
  document.getElementById('res-percent-financiado').innerText = `${percentFinanciado}% do imóvel`;
  document.getElementById('res-juros').innerText = `${params.jurosEfetivos.toFixed(2)}% a.a.`;
  document.getElementById('res-subsidio').innerText = `R$ ${subsidio.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
  document.getElementById('res-prazo-max').innerText = `${params.prazoMaxMeses} meses (${Math.floor(params.prazoMaxMeses / 12)} anos)`;
  document.getElementById('res-entrada-total').innerText = `R$ ${entradaTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
  document.getElementById('res-saldo-parcelado').innerText = `${numParcelasEntrada}x de R$ ${valorParcelaEntrada.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

  // Salva Estado
  simState.valorFinanciado = valorFinanciado;
  simState.taxaJurosAnual = params.jurosEfetivos;
  simState.prazoMeses = params.prazoMaxMeses;

  gerarTabelaUnificada();
}

/**
 * Tabela Comparativa SAC e PRICE
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

    // SAC
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

    // PRICE
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

  document.getElementById('tabela-unificada-body').innerHTML = htmlTabela;
  document.getElementById('res-total-sac').innerText = `R$ ${totalPagoSac.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  document.getElementById('res-total-price').innerText = `R$ ${totalPagoPrice.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

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
