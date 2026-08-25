// ===========================================
// 0. PARAMETROS E POPULAÇÃO DA INTERFACE
// ===========================================

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

function mascararMoeda(input) {
  let valor = input.value.replace(/\D/g, "");
  valor = (valor / 100).toFixed(2) + "";
  valor = valor.replace(".", ",");
  valor = valor.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  input.value = "R$ " + valor;
}

function converterMoedaParaNumero(valorStr) {
  if (!valorStr) return 0;
  let limpo = valorStr.replace("R$", "").trim().replaceAll(".", "").replace(",", ".");
  return parseFloat(limpo) || 0;
}

function formatarMoeda(num) {
  return "R$ " + num.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function atualizarTextoSeExiste(id, texto) {
  const el = document.getElementById(id);
  if (el) el.textContent = texto;
}

// ===========================================
// CONTROLE DE ABERTURA E FECHAMENTO DO SPEEDSIM
// ===========================================
function configurarControleModal() {
  // Ajuste os IDs conforme o seu HTML principal (ex: id do botão de abrir, do container do modal e do botão X)
  const btnAbrir = document.getElementById("btn-abrir-speedsim") || document.querySelector("[id*='speedsim']");
  const modalSpeedSim = document.getElementById("modal-speedsim") || document.getElementById("speedsim-container");
  const btnFechar = document.getElementById("btn-fechar-speedsim") || document.querySelector(".fa-times, .close-modal, [class*='close']");

  if (btnAbrir && modalSpeedSim) {
    btnAbrir.addEventListener("click", () => {
      modalSpeedSim.style.display = "block";
      modalSpeedSim.classList.add("ativo");
    });
  }

  if (btnFechar && modalSpeedSim) {
    btnFechar.addEventListener("click", () => {
      modalSpeedSim.style.display = "none";
      modalSpeedSim.classList.remove("ativo");
    });
  }
}

// ===========================================
// FUNÇÃO PRINCIPAL DE SIMULAÇÃO (FLUXO GERAL)
// ===========================================
function simularFluxo() {
  // 0.1. Cidade e Teto
  const selectMunicipio = document.getElementById("municipio");
  const cidadeImovel = selectMunicipio ? selectMunicipio.value : "São Paulo";
  const dadosCidade = tabelaCidades.find(c => c.municipio === cidadeImovel);
  const tetoImovel = dadosCidade ? dadosCidade.teto : 275000;

  const inputTetoTela = document.getElementById("sim-teto-municipio");
  if (inputTetoTela) {
    inputTetoTela.value = formatarMoeda(tetoImovel);
  }

  // 0.2. Valor do Imóvel / Avaliação e Renda
  const tipoBaseImovel = document.querySelector('input[name="base-imovel"]:checked')?.value || "imovel";
  const valImovelInput = converterMoedaParaNumero(document.getElementById("sim-val-imovel")?.value);
  const valAvaliacaoInput = converterMoedaParaNumero(document.getElementById("sim-val-avaliacao")?.value);
  
  const valorImovel = tipoBaseImovel === "avaliacao" ? valAvaliacaoInput : valImovelInput;
  const rendaBruta = converterMoedaParaNumero(document.getElementById("sim-renda")?.value);

  // Leituras adicionais de entradas e abatimentos do painel
  const fgts = converterMoedaParaNumero(document.getElementById("sim-fgts")?.value);
  const recursos = converterMoedaParaNumero(document.getElementById("sim-recursos")?.value);
  const bomPagador = converterMoedaParaNumero(document.getElementById("sim-bom-pagador")?.value);

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

  // 0.3 e 0.4. Data de Nascimento e Idade
  const dataNascStr = document.getElementById("sim-data-nasc")?.value; 
  let idade = 28; 
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

  // 0.5. Número de parcelas
  const prazoInput = parseInt(document.getElementById("sim-prazo-finan")?.value) || 420;
  const numeroParcelas = prazoInput > 0 ? prazoInput : 420;

  // 0.6. Redutor
  const selectRedutor = document.getElementById("sim-redutor");
  const redutorCotista = selectRedutor ? selectRedutor.value : "Com Redutor"; 

  // 0.7. Tabela Oficial de Taxas Caixa
  const tabelaTaxasFaixas = [
    { limite: 2160, cotista: 0.0500, naoCotista: 0.0550 },
    { limite: 2850, cotista: 0.0525, naoCotista: 0.0575 },
    { limite: 3200, cotista: 0.0550, naoCotista: 0.0600 },
    { limite: 3500, cotista: 0.0575, naoCotista: 0.0625 },
    { limite: 4000, cotista: 0.0550, naoCotista: 0.0600 }, 
    { limite: 5000, cotista: 0.0650, naoCotista: 0.0700 },
    { limite: 9600, cotista: 0.0766, naoCotista: 0.0816 }, 
    { limite: 13000, cotista: 0.1000, naoCotista: 0.1000 } 
  ];

  function obterTaxaAnualPROCX(valorImov, tetoImov, renda, redutor) {
    let subsetor = (valorImov <= tetoImov) ? tabelaTaxasFaixas : tabelaTaxasFaixas.slice(6);
    let faixaEncontrada = subsetor.find(f => renda <= f.limite) || subsetor[subsetor.length - 1];
    return (redutor.toLowerCase().includes("com")) ? faixaEncontrada.cotista : faixaEncontrada.naoCotista;
  }

  const taxaAnualNominal = obterTaxaAnualPROCX(valorImovel, tetoImovel, rendaBruta, redutorCotista);
  const taxaNominalMensal = Math.pow(1 + taxaAnualNominal, 1 / 12) - 1;

  const inputTaxaTopo = document.getElementById("sim-taxa-juros");
  if (inputTaxaTopo) inputTaxaTopo.value = (taxaAnualNominal * 100).toFixed(2).replace(".", ",");

  const inputTaxaMensalTopo = document.getElementById("sim-taxa-juros-mensal");
  if (inputTaxaMensalTopo) inputTaxaMensalTopo.value = (taxaNominalMensal * 100).toFixed(4).replace(".", ",");

  // 0.8. Tabela MIP e Seguros Editáveis
  const inputMipEdit = converterMoedaParaNumero(document.getElementById("sim-mip-val")?.value);
  const aliquotaMIP = inputMipEdit > 0 ? (inputMipEdit / 100) : 0.000085;

  const aliquotaFGHAB = 0.000196; 
  const inputDfiEdit = converterMoedaParaNumero(document.getElementById("sim-dfi-val")?.value);
  const valorDIFConstante = inputDfiEdit > 0 ? valorImovel * (inputDfiEdit / 100) : valorImovel * (0.00028 / 100);
  
  const inputManutencaoEdit = converterMoedaParaNumero(document.getElementById("sim-manutencao-val")?.value);
  const taxaManutencaoContrato = inputManutencaoEdit > 0 ? inputManutencaoEdit : 25.00;

  // Subsídio
  const subsidioCalculado = 2099.00; 
  const inputSubsidioTela = document.getElementById("sim-subsidio-val");
  if (inputSubsidioTela) inputSubsidioTela.value = formatarMoeda(subsidioCalculado);

  // ===========================================
  // 1. MOTOR SAC
  // ===========================================
  const maxComprometimentoRenda = rendaBruta * 0.30;
  
  const numerador = maxComprometimentoRenda - valorDIFConstante - taxaManutencaoContrato;
  const denominador = (1 / numeroParcelas) + taxaNominalMensal + aliquotaMIP + aliquotaFGHAB;
  
  let valorFinanciado = 0;
  if (rendaBruta > 0 && numerador > 0) {
    const valorCalculadoPorRenda = numerador / denominador;
    const limite80PorCento = valorImovel * 0.80; 
    valorFinanciado = valorCalculadoPorRenda < limite80PorCento ? valorCalculadoPorRenda : limite80PorCento;
  }

  atualizarTextoSeExiste('sac-val-financiamento', formatarMoeda(valorFinanciado));

  const entradaTotalSac = Math.max(0, valorImovel - valorFinanciado);
  const entradaBrutaSac = Math.max(0, entradaTotalSac - subsidioCalculado - fgts - bomPagador);

  atualizarTextoSeExiste('sac-val-entrada-total', formatarMoeda(entradaTotalSac));
  atualizarTextoSeExiste('sac-val-entrada-bruta', formatarMoeda(entradaBrutaSac));
  atualizarTextoSeExiste('sac-val-subsidio', formatarMoeda(subsidioCalculado));
  atualizarTextoSeExiste('sac-val-fgts', formatarMoeda(fgts));
  atualizarTextoSeExiste('sac-val-bom-pagador', formatarMoeda(bomPagador));
  atualizarTextoSeExiste('sac-val-recursos', formatarMoeda(recursos));

  let saldoDevedor = valorFinanciado;
  const amortizacaoConstante = valorFinanciado / numeroParcelas;
  let cronogramaHTML = "";

  for (let mes = 1; mes <= numeroParcelas; mes++) {
    if (saldoDevedor <= 0) break;

    let jurosMes = saldoDevedor * taxaNominalMensal;
    let mipMes = saldoDevedor * aliquotaMIP; 
    let fghabMes = saldoDevedor * aliquotaFGHAB; 
    let difMes = valorDIFConstante;
    let manutencaoMes = taxaManutencaoContrato;
    let amortizacaoExtra = 0; 
    
    let amortizacaoTotalMes = amortizacaoConstante + amortizacaoExtra;
    if (amortizacaoTotalMes > saldoDevedor) {
      amortizacaoTotalMes = saldoDevedor;
    }

    let valorParcelaTotal = amortizacaoTotalMes + jurosMes + mipMes + fghabMes + difMes + manutencaoMes;

    if (mes === 1) {
      cronogramaHTML += `
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px 10px;">${mes}</td>
          <td style="padding: 8px 10px; font-weight: bold; color: #1e3a8a;">${formatarMoeda(valorParcelaTotal)}</td>
          <td style="padding: 8px 10px;">${formatarMoeda(amortizacaoTotalMes)}</td>
          <td style="padding: 8px 10px; background-color: #f0fdf4;">${formatarMoeda(amortizacaoExtra)}</td>
          <td style="padding: 8px 10px;">${formatarMoeda(jurosMes)}</td>
          <td style="padding: 8px 10px; font-size: 0.8rem; color: #6b7280;">MIP: ${formatarMoeda(mipMes)}<br>FGHAB: ${formatarMoeda(fghabMes)}<br>DFI: ${formatarMoeda(difMes)}<br>Manut: ${formatarMoeda(manutencaoMes)}</td>
          <td style="padding: 8px 10px; font-weight: bold;">${formatarMoeda(saldoDevedor - amortizacaoTotalMes)}</td>
        </tr>
      `;
    }
    saldoDevedor -= amortizacaoTotalMes;
  }

  const corpoTabela = document.getElementById("corpo-tabela-cronograma");
  if (corpoTabela) {
    corpoTabela.innerHTML = cronogramaHTML;
  }
}

window.onload = function() {
  inicializarMunicipios();
  configurarControleModal();
  simularFluxo();
};
