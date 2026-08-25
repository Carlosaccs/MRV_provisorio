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
  const valImovelInput = converterMoedaParaNumero(document.getElementById("sim-val-imovel").value);
  const valAvaliacaoInput = converterMoedaParaNumero(document.getElementById("sim-val-avaliacao").value);
  
  const valorImovel = tipoBaseImovel === "avaliacao" ? valAvaliacaoInput : valImovelInput;
  const rendaBruta = converterMoedaParaNumero(document.getElementById("sim-renda").value);

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
  const dataNascStr = document.getElementById("sim-data-nasc").value; 
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

  // 0.5. Número de parcelas
  const prazoInput = parseInt(document.getElementById("sim-prazo-finan").value) || 420;
  const numeroParcelas = prazoInput;

  // 0.6. Redutor
  const selectRedutor = document.getElementById("sim-redutor");
  const redutorCotista = selectRedutor ? selectRedutor.value : "Sim"; 

  // 0.7. Tabela Oficial de Taxas Caixa
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

  function obterTaxaAnualPROCX(valorImov, tetoImov, renda, redutor) {
    let subsetor = (valorImov <= tetoImov) ? tabelaTaxasFaixas : tabelaTaxasFaixas.slice(6);
    let faixaEncontrada = subsetor.find(f => renda <= f.limite) || subsetor[subsetor.length - 1];
    return (redutor.toLowerCase() === "sim" || redutor.toLowerCase() === "com redutor") ? faixaEncontrada.cotista : faixaEncontrada.naoCotista;
  }

  const taxaAnualNominal = obterTaxaAnualPROCX(valorImovel, tetoImovel, rendaBruta, redutorCotista);
  const taxaNominalMensal = taxaAnualNominal / 12;

  const inputTaxaTopo = document.getElementById("sim-taxa-juros");
  if (inputTaxaTopo) inputTaxaTopo.value = (taxaAnualNominal * 100).toFixed(2).replace(".", ",");

  const inputTaxaMensalTopo = document.getElementById("sim-taxa-juros-mensal");
  if (inputTaxaMensalTopo) inputTaxaMensalTopo.value = (taxaNominalMensal * 100).toFixed(4).replace(".", ",");

  // 0.8. Tabela MIP
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

  function obterMIP(idadeCliente) {
    let mIPEncontrado = tabelaMIP[0];
    for (let i = 0; i < tabelaMIP.length; i++) {
      if (idadeCliente >= tabelaMIP[i].idadeLimite) {
        mIPEncontrado = tabelaMIP[i];
      }
    }
    return mIPEncontrado.aliquota;
  }

  const aliquotaMIP = obterMIP(idade);
  const inputMipTela = document.getElementById("sim-mip-taxa");
  if (inputMipTela) inputMipTela.value = (aliquotaMIP * 100).toFixed(3).replace(".", ",");

  // 0.9. FGHAB e Valores Fixos (DFI)
  const aliquotaFGHAB = 0.000196; 
  const valorDIFConstante = valorImovel * (0.00028 / 100);
  const taxaManutencaoContrato = 25.00;

  // ===========================================
  // 1. MOTOR SAC
  // ===========================================
  const maxComprometimentoRenda = rendaBruta * 0.30;
  
  const numerador = maxComprometimentoRenda - valorDIFConstante - taxaManutencaoContrato;
  const denominador = (1 / numeroParcelas) + taxaNominalMensal + aliquotaMIP + aliquotaFGHAB;
  
  const valorCalculadoPorRenda = numerador / denominador;
  const limite80PorCento = valorImovel * 0.80;
  
  const valorFinanciado = valorCalculadoPorRenda < limite80PorCento ? valorCalculadoPorRenda : limite80PorCento;
  
  const inputFinanciadoTela = document.getElementById("sim-val-financiado");
  if (inputFinanciadoTela) inputFinanciadoTela.value = formatarMoeda(valorFinanciado);

  // Geração do Cronograma SAC sincronizado com o HTML
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

    saldoDevedor -= amortizacaoTotalMes;
  }

  const corpoTabela = document.getElementById("corpo-tabela-cronograma");
  if (corpoTabela) {
    corpoTabela.innerHTML = cronogramaHTML;
  }

  // ===========================================
  // 2. MOTOR PRICE (RESERVADO PARA O PRÓXIMO PASSO)
  // ===========================================
  // Futuramente implementaremos o bloco PRICE aqui, 
  // calculando a prestação fixa pela tabela francesa.
}

window.onload = function() {
  inicializarMunicipios();
  simularFluxo();
};
