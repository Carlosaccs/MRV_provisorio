/**
 * SpeedSim - Simulador MCMV / SBPE para SpeedBroker
 * Atualizado com suporte a Layout de Duas Colunas (SAC/PRICE), Ato Mínimo de 0.2% e Entrada Bruta.
 */

// Função para carregar o modal de simulador dinamicamente se necessário
function abrirSpeedSim() {
    const modal = document.getElementById('modal-speedsim');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        // Se a estrutura ainda não foi injetada no DOM, carrega do simulador.html
        fetch('simulador.html')
            .then(response => response.text())
            .then(html => {
                document.getElementById('container-modal-simulador').innerHTML = html;
                const modalInjetado = document.getElementById('modal-speedsim');
                if (modalInjetado) modalInjetado.style.display = 'flex';
            })
            .catch(err => console.error('Erro ao carregar simulador.html:', err));
    }
}

// Função de Impressão do Recibo / Resumo da Simulação
function imprimirSimulacao(tipoSistema, hoje, renda, sinal, fgts, bomPagador, dataNasc, dependente, valImovel, finanVal, taxaAA, prazo, primeiraParc, ultimaParc, entradaTotal, numParcEntrada, parcEntradaValor) {
    const win = window.open('', '_blank');
    win.document.write(`
        <!DOCTYPE html>
        <html lang="pt-br">
        <head>
            <meta charset="UTF-8">
            <title>Simulação MCMV - ${tipoSistema}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #ccc; padding: 8px 12px; text-align: left; }
                th { background-color: #f4f4f4; text-transform: uppercase; }
                .secao-header { background-color: #e9e9e9; }
            </style>
        </head>
        <body>
            <table>
                <thead>
                    <tr>
                        <th colspan="2">SIMULAÇÃO DE VALORES MCMV – SISTEMA DE AMORTIZAÇÃO ${tipoSistema}</th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td style="width: 50%;">Data:</td><td><strong>${hoje}</strong></td></tr>
                    <tr><td>Renda:</td><td><strong>${renda}</strong></td></tr>
                    <tr><td>Recursos para o Sinal:</td><td><strong>${sinal}</strong></td></tr>
                    <tr><td>FGTS:</td><td><strong>${fgts}</strong></td></tr>
                    <tr><td>Desconto Bom Pagador:</td><td><strong>${bomPagador}</strong></td></tr>
                    <tr><td>Data nascimento:</td><td><strong>${dataNasc}</strong></td></tr>
                    <tr><td>Mais de 1 comprador ou dependente:</td><td><strong>${dependente}</strong></td></tr>
                    <tr><td>Valor do imóvel:</td><td><strong>${valImovel}</strong></td></tr>
                    
                    <tr class="secao-header"><td colspan="2">&nbsp;</td></tr>

                    <tr><td>FINANCIAMENTO:</td><td><strong>${finanVal} ${taxaAA}</strong></td></tr>
                    <tr><td>Prazo:</td><td><strong>${prazo}</strong></td></tr>
                    <tr><td>1ª prestação:</td><td><strong>${primeiraParc}</strong></td></tr>
                    <tr><td>Última prestação:</td><td><strong>${ultimaParc}</strong></td></tr>
                    
                    <tr class="secao-header"><td colspan="2">&nbsp;</td></tr>

                    <tr><td>ENTRADA TOTAL:</td><td><strong>${entradaTotal}</strong></td></tr>
                    <tr>
                        <td style="vertical-align: top;">Forma de pagamento da Entrada:</td>
                        <td>
                            ${sinal !== 'R$ 0,00' ? `<strong>${sinal}</strong> de sinal<br>` : ''}
                            ${fgts !== 'R$ 0,00' ? `<strong>${fgts}</strong> de FGTS<br>` : ''}
                            ${bomPagador !== 'R$ 0,00' ? `<strong>${bomPagador}</strong> de desconto Bom Pagador<br>` : ''}
                            mais <strong>${numParcEntrada} parcelas</strong> no valor de <strong>${parcEntradaValor}</strong> cada corrigidas pelo INCC
                        </td>
                    </tr>
                </tbody>
            </table>
            <script>
                window.onload = function() {
                    window.print();
                };
            <\/script>
        </body>
        </html>
    `);
    win.document.close();
}

// Configuração dos Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const btnSobre = document.getElementById('btn-sobre');
    if (btnSobre) {
        btnSobre.addEventListener('click', abrirSpeedSim);
    }
});



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
  { renda: 4200, finNormal: 187094.40, finRedutor: 197652.27, txNormal: 7.00, txRedutor: 6.50, subSozinho: 0,      subDep: 0 },
  { renda: 4400, finNormal: 196330.05, finRedutor: 207409.11, txNormal: 7.00, txRedutor: 6.50, subSozinho: 0,      subDep: 0 },
  { renda: 4700, finNormal: 210183.54, finRedutor: 220000.00, txNormal: 7.00, txRedutor: 6.50, subSozinho: 0,      subDep: 0 },
  { renda: 5000, finNormal: 220000.00, finRedutor: 220000.00, txNormal: 7.00, txRedutor: 6.50, subSozinho: 0,      subDep: 0 },
  { renda: 5200, finNormal: 202128.80, finRedutor: 212636.86, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,      subDep: 0 },
  { renda: 5400, finNormal: 210317.57, finRedutor: 221251.33, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,      subDep: 0 },
  { renda: 5600, finNormal: 218506.34, finRedutor: 229865.81, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,      subDep: 0 },
  { renda: 5800, finNormal: 226695.10, finRedutor: 238480.29, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,      subDep: 0 },
  { renda: 6000, finNormal: 234883.87, finRedutor: 247094.76, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,      subDep: 0 },
  { renda: 6200, finNormal: 243072.64, finRedutor: 255709.24, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,      subDep: 0 },
  { renda: 6400, finNormal: 251261.41, finRedutor: 264323.72, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,      subDep: 0 },
  { renda: 6600, finNormal: 264363.62, finRedutor: 278158.95, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,      subDep: 0 },
  { renda: 6800, finNormal: 267638.94, finRedutor: 281552.67, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,      subDep: 0 },
  { renda: 7000, finNormal: 275827.71, finRedutor: 290167.14, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,      subDep: 0 },
  { renda: 7200, finNormal: 284016.48, finRedutor: 298781.62, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,      subDep: 0 },
  { renda: 7400, finNormal: 292205.24, finRedutor: 307396.10, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,      subDep: 0 },
  { renda: 7600, finNormal: 300394.01, finRedutor: 316010.57, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,      subDep: 0 },
  { renda: 7800, finNormal: 308582.78, finRedutor: 320000.00, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,      subDep: 0 },
  { renda: 8000, finNormal: 320000.00, finRedutor: 320000.00, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,      subDep: 0 },
  { renda: 8400, finNormal: 320000.00, finRedutor: 320000.00, txNormal: 8.16, txRedutor: 7.66, subSozinho: 0,      subDep: 0 }
];

let simState = {
  valorFinanciadoSac: 0,
  valorFinanciadoPrice: 0,
  valorImovel: 0,
  taxaJurosAnual: 0,
  prazoMeses: 420,
  amortizacoesExtras: {}
};

function parseMoedaParaNumero(valor) {
  if (typeof valor === 'number') return valor;
  if (!valor) return 0;
  let limpo = valor.toString().replace(/[^\d]/g, '');
  if (!limpo) return 0;
  return parseFloat(limpo) / 100;
}

function formatarMoeda(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function mascararMoeda(inputEl) {
  let digitos = inputEl.value.replace(/\D/g, '');
  if (!digitos) {
    inputEl.value = '0,00';
    return;
  }
  let numFloat = parseFloat(digitos) / 100;
  inputEl.value = numFloat.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
  const recursos = parseMoedaParaNumero(document.getElementById('sim-sinal')?.value); // Recursos Próprios
  const bomPagador = parseMoedaParaNumero(document.getElementById('sim-bom-pagador')?.value);

  const inputPrazoEl = document.getElementById('sim-prazo-finan');
  let prazoDesejadoInput = parseInt(inputPrazoEl?.value) || 420;
  simState.prazoMeses = prazoDesejadoInput > 0 ? prazoDesejadoInput : 1;

  const baseSelecionada = document.querySelector('input[name="base-financiamento"]:checked')?.value || 'imovel';
  const baseCalculo = (baseSelecionada === 'avaliacao') ? valAvaliacao : valImovel;

  if (valImovel <= 0 || renda <= 0) {
    if (document.getElementById('sim-subsidio-val')) document.getElementById('sim-subsidio-val').value = "R$ 0,00";
    zeraValoresCards();
    return;
  }

  const params = buscarParametrosCredilar(renda, comRedutor, comDependente);
  
  if (document.getElementById('sim-subsidio-val')) {
    document.getElementById('sim-subsidio-val').value = formatarMoeda(params.subsidio);
  }

  const limite80Base = baseCalculo * 0.80;

  // PRICE: Limitado a 80% ou teto da faixa
  const finanPriceCapacidade = Math.min(limite80Base, params.tetoFinanBase);

  // SAC: Calculado pela 1ª parcela (30% da renda)
  const prestacaoMaximaRenda = renda * 0.30;
  const iMensalMCMV = Math.pow(1 + (params.taxa / 100), 1 / 12) - 1;
  const fatorSacPrimeiraParc = (1 / simState.prazoMeses) + iMensalMCMV;
  const finanSacPorRenda = prestacaoMaximaRenda / fatorSacPrimeiraParc;
  const finanSacCapacidade = Math.min(limite80Base, params.tetoFinanBase, finanSacPorRenda);

  // CÁLCULOS DE ENTRADA TOTAL (Preço do Imóvel - Financiamento)
  const entradaTotalSac = Math.max(0, valImovel - finanSacCapacidade);
  const entradaTotalPrice = Math.max(0, valImovel - finanPriceCapacidade);

  // ENTRADA BRUTA = ENTRADA TOTAL - SUBSÍDIO - FGTS - BOM PAGADOR
  const entradaBrutaSac = Math.max(0, entradaTotalSac - params.subsidio - fgts - bomPagador);
  const entradaBrutaPrice = Math.max(0, entradaTotalPrice - params.subsidio - fgts - bomPagador);

  // EXIBIÇÃO NO CARD SAC - COLUNA ESQUERDA
  if (document.getElementById('sac-res-financiamento')) document.getElementById('sac-res-financiamento').innerText = formatarMoeda(finanSacCapacidade);
  if (document.getElementById('sac-res-entrada-total')) document.getElementById('sac-res-entrada-total').innerText = formatarMoeda(entradaTotalSac);
  if (document.getElementById('sac-res-subsidio')) document.getElementById('sac-res-subsidio').innerText = formatarMoeda(params.subsidio);
  if (document.getElementById('sac-res-fgts')) document.getElementById('sac-res-fgts').innerText = formatarMoeda(fgts);
  if (document.getElementById('sac-res-bom-pagador')) document.getElementById('sac-res-bom-pagador').innerText = formatarMoeda(bomPagador);

  // EXIBIÇÃO NO CARD SAC - COLUNA DIREITA
  if (document.getElementById('sac-res-entrada-bruta')) document.getElementById('sac-res-entrada-bruta').innerText = formatarMoeda(entradaBrutaSac);
  if (document.getElementById('sac-res-recursos')) document.getElementById('sac-res-recursos').innerText = formatarMoeda(recursos);

  // EXIBIÇÃO NO CARD PRICE - COLUNA ESQUERDA
  if (document.getElementById('price-res-financiamento')) document.getElementById('price-res-financiamento').innerText = formatarMoeda(finanPriceCapacidade);
  if (document.getElementById('price-res-entrada-total')) document.getElementById('price-res-entrada-total').innerText = formatarMoeda(entradaTotalPrice);
  if (document.getElementById('price-res-subsidio')) document.getElementById('price-res-subsidio').innerText = formatarMoeda(params.subsidio);
  if (document.getElementById('price-res-fgts')) document.getElementById('price-res-fgts').innerText = formatarMoeda(fgts);
  if (document.getElementById('price-res-bom-pagador')) document.getElementById('price-res-bom-pagador').innerText = formatarMoeda(bomPagador);

  // EXIBIÇÃO NO CARD PRICE - COLUNA DIREITA
  if (document.getElementById('price-res-entrada-bruta')) document.getElementById('price-res-entrada-bruta').innerText = formatarMoeda(entradaBrutaPrice);
  if (document.getElementById('price-res-recursos')) document.getElementById('price-res-recursos').innerText = formatarMoeda(recursos);

  // Atualiza ATO (0.2% Padrão ou o valor atual se válido)
  simState.valorImovel = valImovel;
  simState.valorFinanciadoPrice = finanPriceCapacidade;
  simState.valorFinanciadoSac = finanSacCapacidade;
  simState.taxaJurosAnual = params.taxa;

  validarAto('SAC', true);
  validarAto('PRICE', true);

  gerarTabelaUnificada();
}

/**
 * Valida e calcula o ATO (Padrão 0,2% do imóvel)
 * Se for menor que 0,2%, exibe aviso e restaura o valor mínimo.
 */
function validarAto(sistema, apenasAtualizar) {
  const prefixo = sistema.toLowerCase();
  const valImovel = simState.valorImovel;
  if (valImovel <= 0) return;

  const inputAto = document.getElementById(`${prefixo}-input-ato`);
  const pctAtoEl = document.getElementById(`${prefixo}-pct-ato`);
  if (!inputAto || !pctAtoEl) return;

  const atoMinimo = valImovel * 0.002; // 0.2% do Valor do Imóvel
  let valorAtoDigitado = parseMoedaParaNumero(inputAto.value);

  // Se estiver atualizando e o valor estiver zerado ou abaixo do mínimo, aplica o mínimo
  if (apenasAtualizar && valorAtoDigitado < atoMinimo) {
    valorAtoDigitado = atoMinimo;
    inputAto.value = valorAtoDigitado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  } else if (!apenasAtualizar && valorAtoDigitado < atoMinimo) {
    alert(`O valor mínimo para o ATO é de 0,2% do valor do imóvel (${formatarMoeda(atoMinimo)}).`);
    valorAtoDigitado = atoMinimo;
    inputAto.value = valorAtoDigitado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  // Calcula % em relação ao imóvel
  const pctCalculado = (valorAtoDigitado / valImovel) * 100;
  pctAtoEl.value = `${pctCalculado.toFixed(1)}%`;
}

function zeraValoresCards() {
  const ids = [
    'sac-res-financiamento', 'sac-res-entrada-total', 'sac-res-subsidio', 'sac-res-fgts', 'sac-res-bom-pagador', 'sac-res-entrada-bruta', 'sac-res-recursos',
    'price-res-financiamento', 'price-res-entrada-total', 'price-res-subsidio', 'price-res-fgts', 'price-res-bom-pagador', 'price-res-entrada-bruta', 'price-res-recursos'
  ];
  ids.forEach(id => {
    if (document.getElementById(id)) document.getElementById(id).innerText = "R$ 0,00";
  });

  if (document.getElementById('sac-input-ato')) document.getElementById('sac-input-ato').value = "0,00";
  if (document.getElementById('sac-pct-ato')) document.getElementById('sac-pct-ato').value = "0%";
  if (document.getElementById('price-input-ato')) document.getElementById('price-input-ato').value = "0,00";
  if (document.getElementById('price-pct-ato')) document.getElementById('price-pct-ato').value = "0%";

  const tbody = document.getElementById('tabela-unificada-body');
  if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:20px; color:#999;">Digite o valor do imóvel e a renda para simular...</td></tr>';
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
    const valorAmortExibido = amortExtra > 0 ? formatarMoeda(amortExtra) : '';

    htmlTabela += `
      <tr ${classeLinha}>
        <td><strong>${mes}</strong></td>
        <td>
          <input type="text" class="input-amort-extra" data-mes="${mes}" 
                 value="${valorAmortExibido}" placeholder="0,00" 
                 style="width: 95px; height: 26px; text-align: right; padding: 0 4px; border: 1px solid #ccc; border-radius: 4px;"
                 oninput="mascararMoeda(this)"
                 onchange="confirmarAmortizacaoTabela(this)">
        </td>
        <td>${formatarMoeda(parcelaSac)}</td>
        <td>${formatarMoeda(jurosSac)}</td>
        <td>${formatarMoeda(saldoSac)}</td>
        <td style="border-left: 2px solid #ddd;">${formatarMoeda(parcelaPrice)}</td>
        <td>${formatarMoeda(jurosPrice)}</td>
        <td>${formatarMoeda(saldoPrice)}</td>
      </tr>
    `;

    if (saldoSac === 0 && saldoPrice === 0) break;
  }

  tbody.innerHTML = htmlTabela;

  const difSac = Math.max(0, totalInicialSac - totalPagoSacComAmort);
  const difPrice = Math.max(0, totalInicialPrice - totalPagoPriceComAmort);

  if (document.getElementById('res-sac-inicial')) document.getElementById('res-sac-inicial').innerText = formatarMoeda(totalInicialSac);
  if (document.getElementById('res-sac-amortizado')) document.getElementById('res-sac-amortizado').innerText = formatarMoeda(totalPagoSacComAmort);
  if (document.getElementById('res-sac-diferenca')) document.getElementById('res-sac-diferenca').innerText = formatarMoeda(difSac);

  if (document.getElementById('res-price-inicial')) document.getElementById('res-price-inicial').innerText = formatarMoeda(totalInicialPrice);
  if (document.getElementById('res-price-amortizado')) document.getElementById('res-price-amortizado').innerText = formatarMoeda(totalPagoPriceComAmort);
  if (document.getElementById('res-price-diferenca')) document.getElementById('res-price-diferenca').innerText = formatarMoeda(difPrice);
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


// 1. MÁSCARA MONETÁRIA
function mascararMoeda(input) {
    let value = input.value.replace(/\D/g, "");
    if (value === "") {
        input.value = "";
        return;
    }
    value = (parseInt(value, 10) / 100).toFixed(2) + "";
    value = value.replace(".", ",");
    value = value.replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1.");
    input.value = "R$ " + value;
}

// 2. FUNÇÃO AUXILIAR DE CONVERSÃO DE MOEDA
function obterValorNumerico(id) {
    const el = document.getElementById(id);
    if (!el) return 0;
    const val = el.value || el.innerText || "0";
    const num = parseFloat(val.replace(/[^\d,-]/g, "").replace(",", "."));
    return isNaN(num) ? 0 : num;
}

// 3. LOGICA PRINCIPAL DE CÁLCULO E FLUXO
function simularFluxo() {
    const valImovel = obterValorNumerico('sim-val-imovel');
    const valAvaliacao = obterValorNumerico('sim-val-avaliacao');
    const bomPagador = obterValorNumerico('sim-bom-pagador');
    const fgts = obterValorNumerico('sim-fgts');
    const recursos = obterValorNumerico('sim-sinal');
    const subsidio = obterValorNumerico('sim-subsidio-val');
    
    // Define a base utilizada (Imóvel ou Avaliação)
    const baseRadio = document.querySelector('input[name="base-financiamento"]:checked');
    const baseValor = (baseRadio && baseRadio.value === 'avaliacao') ? valAvaliacao : valImovel;

    // Regra simplificada de LTV (limite até 80% do valor da base)
    const maxFinanciamentoPermitido = baseValor * 0.80;
    
    // O Financiamento real é a base menos as entradas/recursos e subsídios, travado no máximo do LTV
    let valFinanciamentoCalculado = Math.max(0, baseValor - (fgts + recursos + bomPagador + subsidio));
    if (valFinanciamentoCalculado > maxFinanciamentoPermitido) {
        valFinanciamentoCalculado = maxFinanciamentoPermitido;
    }

    // CARREGA O FINANCIAMENTO NOS CAMPOS SAC E PRICE
    const valFinanFormatado = formatarMoedaNum(valFinanciamentoCalculado);
    document.getElementById('sac-val-financiamento').innerText = valFinanFormatado;
    document.getElementById('price-val-financiamento').innerText = valFinanFormatado;

    // ATUALIZA VALORES FIXOS/INFORMAÇÕES ADICIONAIS NAS COLUNAS ESQUERDAS
    document.getElementById('sac-val-fgts').innerText = formatarMoedaNum(fgts);
    document.getElementById('price-val-fgts').innerText = formatarMoedaNum(fgts);

    document.getElementById('sac-val-bom-pagador').innerText = formatarMoedaNum(bomPagador);
    document.getElementById('price-val-bom-pagador').innerText = formatarMoedaNum(bomPagador);

    document.getElementById('sac-val-subsidio').innerText = formatarMoedaNum(subsidio);
    document.getElementById('price-val-subsidio').innerText = formatarMoedaNum(subsidio);

    // ATUALIZA SINAL E ATO PARA SAC E PRICE
    atualizarLinhaSinal('sac', valImovel);
    atualizarLinhaSinal('price', valImovel);
}

// 4. CÁLCULO E ATUALIZAÇÃO DO ATO E SINAL (1,5% DO IMÓVEL - ATO)
function atualizarLinhaSinal(sistema, valImovel) {
    const prefix = sistema; // 'sac' ou 'price'
    const valAto = obterValorNumerico(`${prefix}-input-ato`);
    
    // Porcentagem do Ato em relação ao Imóvel
    const pctAto = valImovel > 0 ? ((valAto / valImovel) * 100).toFixed(1) : "0.0";
    document.getElementById(`${prefix}-pct-ato`).value = `${pctAto}%`;

    // Sinal = (1.5% do Valor do Imóvel) - Ato
    const metaSinal = valImovel * 0.015;
    const valSinal = Math.max(0, metaSinal - valAto);
    document.getElementById(`${prefix}-val-sinal`).innerText = formatarMoedaNum(valSinal);

    // Qtd parcelas do sinal (Máx 5)
    let parcSinalEl = document.getElementById(`${prefix}-parc-sinal`);
    let numParcSinal = parseInt(parcSinalEl.value) || 1;
    if (numParcSinal > 5) {
        numParcSinal = 5;
        parcSinalEl.value = 5;
    }

    const valParcSinal = numParcSinal > 0 ? valSinal / numParcSinal : 0;
    document.getElementById(`${prefix}-val-parc-sinal`).innerText = formatarMoedaNum(valParcSinal);
}

// 5. FORMATADOR DE MOEDA PARA O TEXTO
function formatarMoedaNum(valor) {
    return (valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
