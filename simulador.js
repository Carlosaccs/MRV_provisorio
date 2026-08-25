// =====================================================================
// 1. CARREGAMENTO, IMPRESSÃO E EVENTOS GLOBAIS
// =====================================================================
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
                    <tr><td>FINANCIAMENTO (Informado):</td><td><strong>${finanVal} ${taxaAA}</strong></td></tr>
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

// =====================================================================
// 2. PARÂMETROS, TABELAS AUXILIARES E ESTADO GLOBAL
// =====================================================================
let simState = {
    valorFinanciadoSac: 0,
    valorImovel: 0,
    taxaJurosAnual: 0,
    prazoMeses: 420,
    amortizacoesExtras: {}
};

const tabelaCidades = [
  { municipio: "São Paulo", populacao: 11500000, teto: 275000 },
  { municipio: "Guarulhos", populacao: 1368784, teto: 275000 },
  { municipio: "Campinas", populacao: 1260000, teto: 275000 },
  { municipio: "Osasco", populacao: 766039, teto: 275000 },
  { municipio: "Jundiaí", populacao: 467978, teto: 235000 },
  { municipio: "Itaquaquecetuba", populacao: 389513, teto: 235000 },
  { municipio: "Suzano", populacao: 324911, teto: 235000 },
  { municipio: "Cotia", populacao: 294359, teto: 210000 },
  { municipio: "Vargem Grande Paulista", populacao: 53273, teto: 210000 }
];

const tabelaTaxasFaixas = [
  { limite: 2160, cotista: 0.0425, naoCotista: 0.0475 },
  { limite: 2850, cotista: 0.0450, naoCotista: 0.0500 },
  { limite: 3200, cotista: 0.0475, naoCotista: 0.0525 },
  { limite: 3500, cotista: 0.0500, naoCotista: 0.0550 },
  { limite: 4000, cotista: 0.0550, naoCotista: 0.0600 }, 
  { limite: 5000, cotista: 0.0650, naoCotista: 0.0700 },
  { limite: 9600, cotista: 0.0766, naoCotista: 0.0816 }, 
  { limite: 13000, cotista: 0.1000, naoCotista: 0.1000 } 
];

const tabelaMIP = [
  { idadeLimite: 18, aliquota: 0.000085 },
  { idadeLimite: 31, aliquota: 0.000085 },
  { idadeLimite: 36, aliquota: 0.0002 },
  { idadeLimite: 41, aliquota: 0.0002 },
  { idadeLimite: 46, aliquota: 0.0004 },
  { idadeLimite: 51, aliquota: 0.0007 },
  { idadeLimite: 56, aliquota: 0.0008 },
  { idadeLimite: 61, aliquota: 0.0013 },
  { idadeLimite: 66, aliquota: 0.0021 },
  { idadeLimite: 71, aliquota: 0.0037 },
  { idadeLimite: 76, aliquota: 0.0053 }
];

function inicializarMunicipios() {
  const selectMunicipio = document.getElementById("municipio");
  if (!selectMunicipio) return;
  selectMunicipio.innerHTML = "";
  tabelaCidades.forEach(c => {
    let option = document.createElement("option");
    option.value = c.municipio;
    option.textContent = c.municipio;
    selectMunicipio.appendChild(option);
  });
}

// Formatadores e Helpers
function parseMoedaParaNumero(valor) {
    if (typeof valor === 'number') return valor;
    if (!valor) return 0;
    let limpo = valor.toString().replace(/[^\d]/g, '');
    if (!limpo) return 0;
    return parseFloat(limpo) / 100;
}

function formatarMoeda(valor) {
    return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarMoedaNum(valor) {
    return (valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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

function mascararMoedaAto(input) {
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

function obterValorFlexivel(listaIds) {
    for (let id of listaIds) {
        const el = document.getElementById(id);
        if (el) {
            const val = (el.value !== undefined && el.value !== '') ? el.value : (el.innerText || "0");
            const num = parseMoedaParaNumero(val);
            if (!isNaN(num) && num > 0) return num;
        }
    }
    for (let id of listaIds) {
        const el = document.getElementById(id);
        if (el) {
            const val = (el.value !== undefined) ? el.value : (el.innerText || "0");
            return parseMoedaParaNumero(val);
        }
    }
    return 0;
}

function atualizarTextoSeExiste(id, valor) {
    const el = document.getElementById(id);
    if (el) el.innerText = valor;
}

function calcularPrazoMaximoPorDataNasc() {
  const inputDataNasc = document.getElementById('sim-data-nasc');
  const inputPrazo = document.getElementById('sim-prazo-finan');
 
  if (!inputDataNasc || !inputPrazo || !inputDataNasc.value) return;

  const dataNasc = new Date(inputDataNasc.value);
  if (isNaN(dataNasc.getTime())) return;

  const hoje = new Date();
  let mesesIdade = (hoje.getFullYear() - dataNasc.getFullYear()) * 12 + (hoje.getMonth() - dataNasc.getMonth());
  if (hoje.getDate() < dataNasc.getDate()) mesesIdade--;

  const limiteTotalMeses = 966;
  let prazoMaximoMeses = limiteTotalMeses - mesesIdade;

  if (prazoMaximoMeses > 420) prazoMaximoMeses = 420;
  if (prazoMaximoMeses < 0) prazoMaximoMeses = 0;

  inputPrazo.value = prazoMaximoMeses;
  simState.prazoMeses = prazoMaximoMeses;
}

// =====================================================================
// 3. CÁLCULOS DE ENTRADA E ORQUESTRAÇÃO (COM FINANCIAMENTO MANUAL)
// =====================================================================
function obterTaxaAnualPROCX(valorImov, tetoImov, renda, redutor) {
    let subsetor = (valorImov <= tetoImov) ? tabelaTaxasFaixas : tabelaTaxasFaixas.slice(6);
    let faixaEncontrada = subsetor.find(f => renda <= f.limite) || subsetor[subsetor.length - 1];
    return (redutor.toLowerCase() === "sim" || redutor.toLowerCase() === "com redutor") ? faixaEncontrada.cotista : faixaEncontrada.naoCotista;
}

function obterMIP(idadeCliente) {
    let mIPEncontrado = tabelaMIP[0];
    for (let i = 0; i < tabelaMIP.length; i++) {
      if (idadeCliente >= tabelaMIP[i].idadeLimite) {
        mIPEncontrado = tabelaMIP[i];
      }
    }
    return mIPEncontrado.aliquota;
}

function simularFluxo() {
  const selectMunicipio = document.getElementById("municipio");
  const cidadeImovel = selectMunicipio ? selectMunicipio.value : "São Paulo";
  const dadosCidade = tabelaCidades.find(c => c.municipio === cidadeImovel);
  const tetoImovel = dadosCidade ? dadosCidade.teto : 275000;

  const inputTetoTela = document.getElementById("sim-teto-municipio");
  if (inputTetoTela) {
    inputTetoTela.value = formatarMoeda(tetoImovel);
  }

  const tipoBaseImovel = document.querySelector('input[name="base-imovel"]:checked')?.value || "imovel";
  const valImovelInput = obterValorFlexivel(['sim-val-imovel', 'val-imovel']);
  const valAvaliacaoInput = obterValorFlexivel(['sim-val-avaliacao', 'val-avaliacao']) || valImovelInput;
  
  const valorImovel = tipoBaseImovel === "avaliacao" ? valAvaliacaoInput : valImovelInput;
  const rendaBruta = obterValorFlexivel(['sim-renda', 'renda']);

  const inputStatusTeto = document.getElementById("sim-status-teto");
  if (inputStatusTeto) {
    if (valorImovel <= tetoImovel) {
      inputStatusTeto.value = "Dentro do Teto";
      inputStatusTeto.style.color = "#15803d";
      inputStatusTeto.style.background = "#dcfce7";
    } else {
      inputStatusTeto.value = "Acima do Teto";
      inputStatusTeto.style.color = "#b91c1c";
      inputStatusTeto.style.background = "#fee2e2";
    }
  }

  const dataNascStr = document.getElementById("sim-data-nasc")?.value; 
  let idade = 26; 
  if (dataNascStr) {
    const partes = dataNascStr.split("-");
    const anoNasc = parseInt(partes[0]);
    const mesNasc = parseInt(partes[1]);
    const diaNasc = parseInt(partes[2]);
    const hoje = new Date();
    idade = hoje.getFullYear() - anoNasc;
    const m = (hoje.getMonth() + 1) - mesNasc;
    if (m < 0 || (m === 0 && hoje.getDate() < diaNasc)) {
      idade--;
    }
  }

  calcularPrazoMaximoPorDataNasc();
  const prazoInput = parseInt(document.getElementById("sim-prazo-finan")?.value) || 420;
  simState.prazoMeses = prazoInput > 0 ? prazoInput : 420;

  const selectRedutor = document.getElementById("sim-redutor") || document.querySelector('input[name="opt-redutor"]:checked');
  const redutorCotista = selectRedutor ? (selectRedutor.value || "Sim") : "Sim"; 

  const taxaAnualNominal = obterTaxaAnualPROCX(valorImovel, tetoImovel, rendaBruta, redutorCotista);
  const taxaNominalMensal = taxaAnualNominal / 12;

  const inputTaxaTopo = document.getElementById("sim-taxa-juros");
  if (inputTaxaTopo) inputTaxaTopo.value = (taxaAnualNominal * 100).toFixed(2).replace(".", ",");

  const inputTaxaMensalTopo = document.getElementById("sim-taxa-juros-mensal");
  if (inputTaxaMensalTopo) inputTaxaMensalTopo.value = (taxaNominalMensal * 100).toFixed(4).replace(".", ",");

  const aliquotaMIP = obterMIP(idade);
  const inputMipTela = document.getElementById("sim-mip-taxa");
  if (inputMipTela) inputMipTela.value = (aliquotaMIP * 100).toFixed(3).replace(".", ",");

  // Insumos auxiliares de entrada
  const fgts = obterValorFlexivel(['sim-fgts', 'fgts']);
  const recursos = obterValorFlexivel(['sim-recursos', 'sim-sinal', 'recursos', 'sinal']);
  const bomPagador = obterValorFlexivel(['sim-bom-pagador', 'bom-pagador']);
  const subsidioVal = obterValorFlexivel(['sim-subsidio-val', 'subsidio']);

  // PEGA O VALOR DO FINANCIAMENTO DIRETAMENTE DA TELA (EDITÁVEL)
  const valorFinanciadoManual = obterValorFlexivel(['sim-val-financiamento', 'sac-val-financiamento-input', 'financiamento']);

  if (valorImovel <= 0) {
    zeraValoresCards();
    return;
  }

  simState.valorImovel = valorImovel;
  simState.valorFinanciadoSac = valorFinanciadoManual > 0 ? valorFinanciadoManual : (valorImovel * 0.8); // Fallback de 80% se vazio
  simState.taxaJurosAnual = taxaAnualNominal * 100;

  // Cálculos de Entrada
  const entradaTotalSac = Math.max(0, valorImovel - simState.valorFinanciadoSac);
  const entradaBrutaSac = Math.max(0, entradaTotalSac - subsidioVal - fgts - bomPagador);

  // Atualiza os cards de exibição na tela
  atualizarTextoSeExiste('sac-val-financiamento', formatarMoeda(simState.valorFinanciadoSac));
  atualizarTextoSeExiste('sac-val-entrada-total', formatarMoeda(entradaTotalSac));
  atualizarTextoSeExiste('sac-val-entrada-bruta', formatarMoeda(entradaBrutaSac));
  atualizarTextoSeExiste('sac-val-fgts', formatarMoeda(fgts));
  atualizarTextoSeExiste('sac-val-bom-pagador', formatarMoeda(bomPagador));
  atualizarTextoSeExiste('sac-val-subsidio', formatarMoeda(subsidioVal));
  atualizarTextoSeExiste('sac-val-recursos', formatarMoeda(recursos));

  atualizarLinhaSinal('sac', valorImovel, entradaBrutaSac, recursos);
  gerarTabelaUnificada();
}

function atualizarLinhaSinal(sistema, valImovel, entradaBruta, recursos) {
  const prefix = sistema.toLowerCase();
  let inputAto = document.getElementById(`${prefix}-input-ato`);
  if (!inputAto) return;

  let valAto = parseMoedaParaNumero(inputAto.value);

  if (valImovel > 0 && (!inputAto.dataset.editadoManualmente || valAto === 0)) {
    valAto = valImovel * 0.002;
    inputAto.value = formatarMoedaNum(valAto);
  }

  const pctAto = valImovel > 0 ? ((valAto / valImovel) * 100).toFixed(1) : "0.0";
  const pctEl = document.getElementById(`${prefix}-pct-ato`);
  if (pctEl) {
    pctEl.value = `${pctAto}%`;
  }

  const metaSinal = valImovel * 0.015;
  const valSinal = Math.max(0, metaSinal - valAto);
 
  const valSinalEl = document.getElementById(`${prefix}-val-sinal`);
  if (valSinalEl) valSinalEl.innerText = formatarMoedaNum(valSinal);

  let parcSinalEl = document.getElementById(`${prefix}-parc-sinal`) || document.getElementById(`${prefix}-qtd-parc-sinal`);
  let numParcSinal = parseInt(parcSinalEl?.value) || 1;
  if (numParcSinal > 5) {
    numParcSinal = 5;
    if (parcSinalEl) parcSinalEl.value = 5;
  }
  const valParcSinal = numParcSinal > 0 ? valSinal / numParcSinal : 0;
 
  let valParcSinalEl = document.getElementById(`${prefix}-val-parc-sinal`);
  if (valParcSinalEl) {
    valParcSinalEl.innerText = formatarMoedaNum(valParcSinal);
  }

  const saldoRecursos = Math.max(0, recursos - valAto - valSinal);
  atualizarTextoSeExiste(`${prefix}-val-saldo-rec`, formatarMoeda(saldoRecursos));

  const entradaLiquida = Math.max(0, entradaBruta - valAto - valSinal);
  let valEntradaLiqEl = document.getElementById(`${prefix}-val-entrada-liquida`);
  if (valEntradaLiqEl) {
    valEntradaLiqEl.innerText = formatarMoedaNum(entradaLiquida);
  }

  let parcLiquidaEl = document.getElementById(`${prefix}-parc-liquida`);
  let numParcLiquida = parseInt(parcLiquidaEl?.value);
  if (isNaN(numParcLiquida) || numParcLiquida <= 0) numParcLiquida = 1;

  const valParcLiquida = entradaLiquida / numParcLiquida;
  let valParcLiquidaEl = document.getElementById(`${prefix}-val-parc-liquida`);
  if (valParcLiquidaEl) {
    valParcLiquidaEl.innerText = formatarMoedaNum(valParcLiquida);
  }
}

function validarAto(sistema, apenasAtualizar) {
  const prefixo = sistema.toLowerCase();
  const valImovel = simState.valorImovel;
  if (valImovel <= 0) return;

  const inputAto = document.getElementById(`${prefixo}-input-ato`);
  const pctAtoEl = document.getElementById(`${prefixo}-pct-ato`);
  if (!inputAto) return;

  const atoMinimo = valImovel * 0.002;
  let valorAtoDigitado = parseMoedaParaNumero(inputAto.value);

  if (!apenasAtualizar && valorAtoDigitado > 0 && valorAtoDigitado < atoMinimo) {
    alert(`O valor mínimo para o ATO é de 0,2% do valor do imóvel (${formatarMoeda(atoMinimo)}).`);
    valorAtoDigitado = atoMinimo;
    inputAto.value = formatarMoedaNum(valorAtoDigitado);
  }

  const pctCalculado = valImovel > 0 ? (valorAtoDigitado / valImovel) * 100 : 0;
  if (pctAtoEl) {
    pctAtoEl.value = `${pctCalculado.toFixed(1)}%`;
  }

  if (!apenasAtualizar) {
    simularFluxo();
  }
}

function zeraValoresCards() {
  const ids = [
    'sac-val-entrada-total', 'sac-val-subsidio', 'sac-val-fgts', 'sac-val-bom-pagador', 'sac-val-entrada-bruta', 'sac-val-recursos', 'sac-val-saldo-rec', 'sac-val-entrada-liquida'
  ];
  ids.forEach(id => {
    atualizarTextoSeExiste(id, "R$ 0,00");
  });

  const el = document.getElementById('sac-input-ato');
  if (el) {
    el.value = "0,00";
    delete el.dataset.editadoManualmente;
  }
  const pct = document.getElementById('sac-pct-ato');
  if (pct) pct.value = "0.0%";

  const tbody = document.getElementById('tabela-unificada-body');
  if (tbody) tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#999;">Digite o valor do imóvel e o financiamento para simular...</td></tr>';
}

// =====================================================================
// 4. TABELA PROVISÓRIA / UNIFICADA
// =====================================================================
function gerarTabelaUnificada() {
  const PSac = simState.valorFinanciadoSac;
  const n = simState.prazoMeses;
  const iMensal = Math.pow(1 + (simState.taxaJurosAnual / 100), 1 / 12) - 1;

  const tbody = document.getElementById('tabela-unificada-body');
  if (!tbody || !PSac || n <= 0) return;

  let saldoSac = PSac;
  const amortizacaoConstanteSac = PSac / n;
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
      </tr>
    `;

    if (saldoSac === 0) break;
  }

  tbody.innerHTML = htmlTabela;
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

// Vinculação de Eventos e Inicialização do Módulo
function vincularEventosMúltiplos() {
  const idsInputs = [
    'sim-val-imovel', 'val-imovel',
    'sim-val-avaliacao', 'val-avaliacao',
    'sim-renda', 'renda',
    'sim-recursos', 'sim-sinal', 'recursos', 'sinal',
    'sim-fgts', 'fgts',
    'sim-bom-pagador', 'bom-pagador',
    'sim-prazo-finan',
    'sim-val-financiamento', 'sac-val-financiamento-input', 'financiamento',
    'sim-qtd-parc-entrada', 'qtd-parc-entrada', 'sim-qtd-entrada',
    'sac-parc-entrada', 'sac-parc-sinal', 'municipio'
  ];

  idsInputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      ['input', 'change', 'keyup'].forEach(evento => {
        el.addEventListener(evento, simularFluxo);
      });
    }
  });

  const radios = document.querySelectorAll('input[type="radio"], input[type="checkbox"]');
  radios.forEach(radio => {
    radio.addEventListener('change', simularFluxo);
  });

  const inputAto = document.getElementById('sac-input-ato');
  if (inputAto) {
    inputAto.onfocus = function() {
      if (parseMoedaParaNumero(this.value) === 0) {
        this.value = '';
      }
    };
    inputAto.oninput = function() {
      this.dataset.editadoManualmente = "true";
      mascararMoedaAto(this);
      simularFluxo();
    };
    inputAto.onblur = function() {
      if (parseMoedaParaNumero(this.value) === 0) {
        delete this.dataset.editadoManualmente;
      }
      validarAto('sac', false);
    };
  }
}

document.addEventListener('DOMContentLoaded', () => {
  vincularEventosMúltiplos();
  inicializarMunicipios();

  const inputDataNasc = document.getElementById('sim-data-nasc');
  if (inputDataNasc) {
    inputDataNasc.addEventListener('change', () => {
      calcularPrazoMaximoPorDataNasc();
      simularFluxo();
    });
  }

  simularFluxo();
});
