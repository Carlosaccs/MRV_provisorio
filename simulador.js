/**
 * SpeedSim - Simulador MCMV / SBPE para SpeedBroker
 * Com ajuste automático do prazo máximo pela idade e validação somente em caso de digitação excedente.
 */

const CREDILAR_MATRIZ = [
  { renda: 1000, finNormal: 56132.57, finRedutor: 59840.81, txNormal: 4.75, txRedutor: 4.25, subSozinho: 16500, subDep: 55000 },
  { renda: 1200, finNormal: 68140.82, finRedutor: 72642.35, txNormal: 4.75, txRedutor: 4.25, subSozinho: 16500, subDep: 55000 },
  { renda: 1400, finNormal: 80149.07, finRedutor: 85443.89, txNormal: 4.75, txRedutor: 4.25, subSozinho: 16500, subDep: 55000 },
  { renda: 1600, finNormal: 92798.32, finRedutor: 98962.97, txNormal: 4.75, txRedutor: 4.25, subSozinho: 16500, subDep: 55000 },
  { renda: 1800, finNormal: 104165.58, finRedutor: 111046.98, txNormal: 4.75, txRedutor: 4.25, subSozinho: 16500, subDep: 55000 },
  { renda: 2000, finNormal: 116173.83, finRedutor: 123848.52, txNormal: 4.75, txRedutor: 4.25, subSozinho: 15233, subDep: 50089 },
  { renda: 2200, finNormal: 124245.59, finRedutor: 132313.01, txNormal: 5.00, txRedutor: 4.50, subSozinho: 11868, subDep: 38993 },
  { renda: 2400, finNormal: 135885.06, finRedutor: 144708.25, txNormal: 5.00, txRedutor: 4.50, subSozinho: 8920,  subDep: 29260 },
  { renda: 2600, finNormal: 147524.54, finRedutor: 157103.49, txNormal: 5.00, txRedutor: 4.50, subSozinho: 6461,  subDep: 21157 },
  { renda: 2800, finNormal: 159164.02, finRedutor: 169498.73, txNormal: 5.00, txRedutor: 4.50, subSozinho: 4467,  subDep: 14603 },
  { renda: 3000, finNormal: 160940.88, finRedutor: 171211.65, txNormal: 5.25, txRedutor: 4.75, subSozinho: 2945,  subDep: 9621 },
  { renda: 3200, finNormal: 172228.77, finRedutor: 183219.90, txNormal: 5.25, txRedutor: 4.75, subSozinho: 1803,  subDep: 5880 },
  { renda: 3400, finNormal: 178065.26, finRedutor: 189232.66, txNormal: 5.50, txRedutor: 5.00, subSozinho: 1071,  subDep: 3492 },
  { renda: 3600, finNormal: 178225.19, finRedutor: 189017.84, txNormal: 6.00, txRedutor: 5.50, subSozinho: 715,   subDep: 2333 },
  { renda: 3800, finNormal: 192129.97, finRedutor: 199970.42, txNormal: 6.00, txRedutor: 5.50, subSozinho: 657,   subDep: 2142 },
  { renda: 4000, finNormal: 198879.60, finRedutor: 210923.01, txNormal: 6.00, txRedutor: 5.50, subSozinho: 644,   subDep: 2099 },
  { renda: 4200, finNormal: 187094.40, finRedutor: 197652.27, txNormal: 7.00, txRedutor: 6.50, subSozinho: 0,     subDep: 0 },
  { renda: 4400, finNormal: 196330.05, finRedutor: 207409.11, txNormal: 7.00, txRedutor: 6.50, subSozinho: 0,     subDep: 0 },
  { renda: 4700, finNormal: 210183.54, finRedutor: 220000.00, txNormal: 7.00, txRedutor: 6.50, subSozinho: 0,     subDep: 0 },
  { renda: 5000, finNormal: 220000.00, finRedutor: 220000.00, txNormal: 7.00, txRedutor: 6.50, subSozinho: 0,     subDep: 0 },
  { renda: 5200, finNormal: 202128.80, finRedutor: 212636.86, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,     subDep: 0 },
  { renda: 5400, finNormal: 210317.57, finRedutor: 221251.33, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,     subDep: 0 },
  { renda: 5600, finNormal: 218506.34, finRedutor: 229865.81, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,     subDep: 0 },
  { renda: 5800, finNormal: 226695.10, finRedutor: 238480.29, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,     subDep: 0 },
  { renda: 6000, finNormal: 234883.87, finRedutor: 247094.76, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,     subDep: 0 },
  { renda: 6200, finNormal: 243072.64, finRedutor: 255709.24, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,     subDep: 0 },
  { renda: 6400, finNormal: 251261.41, finRedutor: 264323.72, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,     subDep: 0 },
  { renda: 6600, finNormal: 264363.62, finRedutor: 278158.95, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,     subDep: 0 },
  { renda: 6800, finNormal: 267638.94, finRedutor: 281552.67, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,     subDep: 0 },
  { renda: 7000, finNormal: 275827.71, finRedutor: 290167.14, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,     subDep: 0 },
  { renda: 7200, finNormal: 284016.48, finRedutor: 298781.62, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,     subDep: 0 },
  { renda: 7400, finNormal: 292205.24, finRedutor: 307396.10, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,     subDep: 0 },
  { renda: 7600, finNormal: 300394.01, finRedutor: 316010.57, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,     subDep: 0 },
  { renda: 7800, finNormal: 308582.78, finRedutor: 320000.00, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,     subDep: 0 },
  { renda: 8000, finNormal: 320000.00, finRedutor: 320000.00, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,     subDep: 0 },
  { renda: 8400, finNormal: 320000.00, finRedutor: 320000.00, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,     subDep: 0 }
];

let simState = {
  valorFinanciadoSac: 0,
  valorFinanciadoPrice: 0,
  valorImovel: 0,
  taxaJurosAnual: 0,
  prazoMeses: 420,
  amortizacoesExtras: {}
};

const LIMITE_IDADE_PRAZO_MESES = 966; // 80 anos e 6 meses regra Caixa

function calcularIdadeEmMeses(dataNasc) {
  if (!dataNasc) return 0;
  const hoje = new Date();
  const nascimento = new Date(dataNasc);
  let anos = hoje.getFullYear() - nascimento.getFullYear();
  let meses = hoje.getMonth() - nascimento.getMonth();
  if (meses < 0 || (meses === 0 && hoje.getDate() < nascimento.getDate())) {
    anos--;
    meses += 12;
  }
  return (anos * 12) + meses;
}

function tratarEntradaMoeda(input) {
  let digitos = input.value.replace(/\D/g, '');
  if (!digitos) {
    input.value = '';
    simularFluxo();
    return;
  }
  let num = (parseInt(digitos, 10) / 100).toFixed(2);
  let partes = num.split('.');
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  input.value = `R$ ${partes.join(',')}`;
  simularFluxo();
}

function parseMoedaParaNumero(valorString) {
  if (!valorString) return 0;
  let limpo = valorString.replace(/[^\d]/g, '');
  if (!limpo) return 0;
  return parseFloat(limpo) / 100;
}

document.addEventListener('DOMContentLoaded', () => {
  const btnSpeedsim = document.getElementById('btn-sobre');
  if (btnSpeedsim) btnSpeedsim.addEventListener('click', abrirSpeedSim);

  const modal = document.getElementById('modal-sobre');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) fecharSpeedSim();
    });
  }

  // Evento para quando o usuário alterar a data de nascimento (atualiza o prazo automaticamente sem alerta)
  const inputNasc = document.getElementById('sim-data-nasc');
  if (inputNasc) {
    inputNasc.addEventListener('change', () => {
      atualizarPrazoAutomaticoPorNascimento();
      simularFluxo();
    });
  }
});

function abrirSpeedSim() {
  const modal = document.getElementById('modal-sobre');
  if (!modal) return;
  modal.style.display = 'block';
  atualizarPrazoAutomaticoPorNascimento();
  simularFluxo();
}

function fecharSpeedSim() {
  const modal = document.getElementById('modal-sobre');
  if (modal) modal.style.display = 'none';
}

// Atualiza o campo de prazo de forma limpa ao trocar a data de nascimento (sem estourar aviso)
function atualizarPrazoAutomaticoPorNascimento() {
  const dataNascVal = document.getElementById('sim-data-nasc')?.value;
  const inputPrazoEl = document.getElementById('sim-prazo');
  const alertaEl = document.getElementById('alerta-prazo-modal');

  if (!dataNascVal || !inputPrazoEl) return;

  const idadeMeses = calcularIdadeEmMeses(dataNascVal);
  const prazoMaximoPermitido = Math.max(0, LIMITE_IDADE_PRAZO_MESES - idadeMeses);
  
  // Define o teto máximo permitido (limitado a 420 caso seja jovem, ou o teto da idade se for mais velho)
  const novoPrazo = Math.min(420, prazoMaximoPermitido);
  
  inputPrazoEl.value = novoPrazo;
  if (alertaEl) alertaEl.style.display = 'none'; // Esconde qualquer alerta anterior
}

function buscarParametrosCredilar(renda, comRedutor, comDependente) {
  if (renda <= 0) return { taxa: 0, tetoFinanBase: 0, subsidio: 0 };
  let linha = CREDILAR_MATRIZ[0];
  for (let i = 0; i < CREDILAR_MATRIZ.length; i++) {
    if (renda >= CREDILAR_MATRIZ[i].renda) {
      linha = CREDILAR_MATRIZ[i];
    }
  }
  const taxa = comRedutor ? linha.txRedutor : linha.txNormal;
  const tetoFinanBase = comRedutor ? linha.finRedutor : linha.finNormal;
  const subsidio = comDependente ? linha.subDep : linha.subSozinho;
  return { taxa, tetoFinanBase, subsidio };
}

function simularFluxo() {
  const valImovel = parseMoedaParaNumero(document.getElementById('sim-val-imovel')?.value);
  const valAvaliacao = parseMoedaParaNumero(document.getElementById('sim-val-avaliacao')?.value) || valImovel;
  const renda = parseMoedaParaNumero(document.getElementById('sim-renda')?.value);

  const comRedutor = document.querySelector('input[name="opt-redutor"]:checked')?.value === 'sim';
  const comDependente = document.getElementById('sim-dependente')?.checked ?? true;

  const fgts = parseMoedaParaNumero(document.getElementById('sim-fgts')?.value);
  const numParcelas = parseInt(document.getElementById('sim-num-parcelas')?.value) || 1;

  // Validação caso o usuário digite manualmente um prazo maior que o teto da idade
  const dataNascVal = document.getElementById('sim-data-nasc')?.value;
  const inputPrazoEl = document.getElementById('sim-prazo');
  const alertaEl = document.getElementById('alerta-prazo-modal');
  
  let prazoDesejadoInput = parseInt(inputPrazoEl?.value) || 420;

  if (dataNascVal) {
    const idadeMeses = calcularIdadeEmMeses(dataNascVal);
    const prazoMaximoPermitido = Math.max(0, LIMITE_IDADE_PRAZO_MESES - idadeMeses);

    if (prazoDesejadoInput > prazoMaximoPermitido) {
      // Se tentou forçar um número maior digitando, exibe o aviso e ajusta para baixo
      prazoDesejadoInput = prazoMaximoPermitido;
      if (inputPrazoEl) inputPrazoEl.value = prazoDesejadoInput;
      
      if (alertaEl) {
        alertaEl.style.display = 'block';
        alertaEl.innerHTML = `<strong>Atenção:</strong> O prazo informado excede o limite máximo permitido pela norma da Caixa (Idade + Prazo ≤ 966 meses). O prazo foi ajustado automaticamente para o teto de <strong>${prazoMaximoPermitido} meses</strong>.`;
      }
    } else {
      if (alertaEl) alertaEl.style.display = 'none';
    }
  }

  simState.prazoMeses = prazoDesejadoInput > 0 ? prazoDesejadoInput : 1;

  const baseSelecionada = document.querySelector('input[name="base-financiamento"]:checked')?.value || 'imovel';
  const baseCalculo = (baseSelecionada === 'avaliacao') ? valAvaliacao : valImovel;

  if (valImovel <= 0 || renda <= 0) {
    document.getElementById('sim-subsidio-val').value = "R$ 0,00";
    document.getElementById('res-finan-price').innerText = "R$ 0,00";
    document.getElementById('res-pct-price').innerText = "";
    document.getElementById('res-entrada-price').innerText = "R$ 0,00";
    document.getElementById('res-parcelas-price').innerText = "";

    document.getElementById('res-finan-sac').innerText = "R$ 0,00";
    document.getElementById('res-pct-sac').innerText = "";
    document.getElementById('res-entrada-sac').innerText = "R$ 0,00";
    document.getElementById('res-parcelas-sac').innerText = "";

    document.getElementById('res-sac-inicial').innerText = "R$ 0,00";
    document.getElementById('res-sac-amortizado').innerText = "R$ 0,00";
    document.getElementById('res-sac-diferenca').innerText = "R$ 0,00";
    document.getElementById('res-price-inicial').innerText = "R$ 0,00";
    document.getElementById('res-price-amortizado').innerText = "R$ 0,00";
    document.getElementById('res-price-diferenca').innerText = "R$ 0,00";

    document.getElementById('tabela-unificada-body').innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#999;">Digite o valor do imóvel e a renda para simular...</td></tr>';
    return;
  }

  const params = buscarParametrosCredilar(renda, comRedutor, comDependente);
  
  document.getElementById('sim-subsidio-val').value = `R$ ${params.subsidio.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;

  const limite80Base = baseCalculo * 0.80;

  const finanPriceCapacidade = Math.min(limite80Base, params.tetoFinanBase);
  const finanSacCapacidade = finanPriceCapacidade * 0.92;

  const pctPrice = ((finanPriceCapacidade / valImovel) * 100).toFixed(1);
  const pctSac = ((finanSacCapacidade / valImovel) * 100).toFixed(1);

  const entradaPriceLequida = Math.max(0, valImovel - finanPriceCapacidade - params.subsidio - fgts);
  const entradaSacLequida = Math.max(0, valImovel - finanSacCapacidade - params.subsidio - fgts);

  const parcPriceEntrada = numParcelas > 0 ? (entradaPriceLequida / numParcelas) : 0;
  const parcSacEntrada = numParcelas > 0 ? (entradaSacLequida / numParcelas) : 0;

  document.getElementById('res-finan-price').innerText = `R$ ${finanPriceCapacidade.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
  document.getElementById('res-pct-price').innerText = `(${pctPrice}% DO IMÓVEL)`;
  document.getElementById('res-entrada-price').innerText = `R$ ${entradaPriceLequida.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
  document.getElementById('res-parcelas-price').innerText = `EM ${numParcelas}X DE R$ ${parcPriceEntrada.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

  document.getElementById('res-finan-sac').innerText = `R$ ${finanSacCapacidade.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
  document.getElementById('res-pct-sac').innerText = `(${pctSac}% DO IMÓVEL)`;
  document.getElementById('res-entrada-sac').innerText = `R$ ${entradaSacLequida.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
  document.getElementById('res-parcelas-sac').innerText = `EM ${numParcelas}X DE R$ ${parcSacEntrada.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

  simState.valorImovel = valImovel;
  simState.valorFinanciadoPrice = finanPriceCapacidade;
  simState.valorFinanciadoSac = finanSacCapacidade;
  simState.taxaJurosAnual = params.taxa;

  gerarTabelaUnificada();
}

function calcularTotaisIniciaisFixos(PSac, PPrice, n, iMensal) {
  if (n <= 0) return { totalInicialSac: 0, totalInicialPrice: 0 };
  const parcelaPriceConstante = PPrice * ( (iMensal * Math.pow(1 + iMensal, n)) / (Math.pow(1 + iMensal, n) - 1) );
  const totalInicialPrice = parcelaPriceConstante * n;

  const amortConstanteSac = PSac / n;
  let totalInicialSac = 0;
  for (let m = 1; m <= n; m++) {
    const saldoDev = PSac - ((m - 1) * amortConstanteSac);
    const jurosM = saldoDev * iMensal;
    totalInicialSac += (amortConstanteSac + jurosM);
  }

  return { totalInicialSac, totalInicialPrice };
}

function gerarTabelaUnificada() {
  const PSac = simState.valorFinanciadoSac;
  const PPrice = simState.valorFinanciadoPrice;
  const n = simState.prazoMeses;
  const iMensal = Math.pow(1 + (simState.taxaJurosAnual / 100), 1 / 12) - 1;

  const tbody = document.getElementById('tabela-unificada-body');
  if (!tbody || !PSac || !PPrice || n <= 0) return;

  const { totalInicialSac, totalInicialPrice } = calcularTotaisIniciaisFixos(PSac, PPrice, n, iMensal);

  let saldoSac = PSac;
  let saldoPrice = PPrice;
  const amortizacaoConstanteSac = PSac / n;
  const parcelaConstantePrice = PPrice * ( (iMensal * Math.pow(1 + iMensal, n)) / (Math.pow(1 + iMensal, n) - 1) );

  let totalPagoSacComAmort = 0;
  let totalPagoPriceComAmort = 0;

  let htmlTabela = '';

  for (let mes = 1; mes <= n; mes++) {
    const amortExtra = simState.amortizacoesExtras[mes] || 0;

    let jurosSac = 0, amortTotalSac = 0, parcelaSac = 0;
    if (saldoSac > 0) {
      jurosSac = saldoSac * iMensal;
      amortTotalSac = amortizacaoConstanteSac + amortExtra;
      if (amortTotalSac > saldoSac) amortTotalSac = saldoSac;
      parcelaSac = amortTotalSac + jurosSac;
      saldoSac -= amortTotalSac;
      if (saldoSac < 0) saldoSac = 0;
      totalPagoSacComAmort += parcelaSac;
    }

    let jurosPrice = 0, amortTotalPrice = 0, parcelaPrice = 0;
    if (saldoPrice > 0) {
      jurosPrice = saldoPrice * iMensal;
      let amortPriceBase = parcelaConstantePrice - jurosPrice;
      amortTotalPrice = amortPriceBase + amortExtra;
      if (amortTotalPrice > saldoPrice) amortTotalPrice = saldoPrice;
      parcelaPrice = amortTotalPrice + jurosPrice;
      saldoPrice -= amortTotalPrice;
      if (saldoPrice < 0) saldoPrice = 0;
      totalPagoPriceComAmort += parcelaPrice;
    }

    const classeLinha = amortExtra > 0 ? 'class="linha-amortizada"' : '';
    const valorAmortExibido = amortExtra > 0 ? `R$ ${amortExtra.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '';

    htmlTabela += `
      <tr ${classeLinha}>
        <td><strong>${mes}</strong></td>
        <td>
          <input type="text" class="input-amort-extra" data-mes="${mes}" 
                 value="${valorAmortExibido}" placeholder="0,00" 
                 style="width: 95px; height: 26px; text-align: right; padding: 0 4px; border: 1px solid #ccc; border-radius: 4px;"
                 oninput="mascararDigitoTabela(this)"
                 onchange="confirmarAmortizacaoTabela(this)">
        </td>
        <td>R$ ${parcelaSac.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td>R$ ${jurosSac.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td>R$ ${saldoSac.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td style="border-left: 2px solid #ddd;">R$ ${parcelaPrice.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td>R$ ${jurosPrice.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
        <td>R$ ${saldoPrice.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</td>
      </tr>
    `;

    if (saldoSac === 0 && saldoPrice === 0) break;
  }

  tbody.innerHTML = htmlTabela;

  const difSac = Math.max(0, totalInicialSac - totalPagoSacComAmort);
  const difPrice = Math.max(0, totalInicialPrice - totalPagoPriceComAmort);

  document.getElementById('res-sac-inicial').innerText = `R$ ${totalInicialSac.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  document.getElementById('res-sac-amortizado').innerText = `R$ ${totalPagoSacComAmort.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  document.getElementById('res-sac-diferenca').innerText = `R$ ${difSac.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;

  document.getElementById('res-price-inicial').innerText = `R$ ${totalInicialPrice.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  document.getElementById('res-price-amortizado').innerText = `R$ ${totalPagoPriceComAmort.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  document.getElementById('res-price-diferenca').innerText = `R$ ${difPrice.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
}

function mascararDigitoTabela(inputEl) {
  let digitos = inputEl.value.replace(/\D/g, '');
  if (!digitos) {
    inputEl.value = '';
    return;
  }
  let numFloat = parseFloat(digitos) / 100;
  let numFormatado = numFloat.toFixed(2);
  let partes = numFormatado.split('.');
  partes[0] = partes[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  inputEl.value = `R$ ${partes.join(',')}`;
}

function confirmarAmortizacaoTabela(inputEl) {
  const mes = inputEl.getAttribute('data-mes');
  const numFloat = parseMoedaParaNumero(inputEl.value);
  if (numFloat > 0) {
    simState.amortizacoesExtras[mes] = numFloat;
  } else {
    delete simState.amortizacoesExtras[mes];
  }
  gerarTabelaUnificada();
}
