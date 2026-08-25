// ===========================================
// CONTROLE DE ABERTURA E FECHAMENTO DO MODAL
// ===========================================
function abrirSpeedSim() {
  const modal = document.getElementById("modal-speedsim");
  if (modal) {
    modal.style.display = "block";
    simularFluxo();
  }
}

function fecharSpeedSim() {
  const modal = document.getElementById("modal-speedsim");
  if (modal) {
    modal.style.display = "none";
  }
}

// Vincula automaticamente ao botão da barra superior pelo texto
document.addEventListener("DOMContentLoaded", function() {
  const botoes = document.querySelectorAll("button, a, div");
  botoes.forEach(el => {
    if (el.textContent && el.textContent.includes("SPEEDSIM SIMULADOR DE MCMV")) {
      el.addEventListener("click", function(e) {
        e.preventDefault();
        abrirSpeedSim();
      });
    }
  });
});

// ===========================================
// DADOS E MÁSCARAS
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
  return num.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// ===========================================
// MOTOR DE CÁLCULO PRINCIPAL
// ===========================================
function simularFluxo() {
  const tetoImovel = 275000; // Teto padrão ou referência

  const tipoBaseImovel = document.querySelector('input[name="base-financiamento"]:checked')?.value || "imovel";
  const valImovelInput = converterMoedaParaNumero(document.getElementById("sim-val-imovel")?.value);
  const valAvaliacaoInput = converterMoedaParaNumero(document.getElementById("sim-val-avaliacao")?.value);
  
  const valorImovel = tipoBaseImovel === "avaliacao" ? valAvaliacaoInput : valImovelInput;
  const rendaBruta = converterMoedaParaNumero(document.getElementById("sim-renda")?.value);

  const fgts = converterMoedaParaNumero(document.getElementById("sim-fgts")?.value);
  const recursos = converterMoedaParaNumero(document.getElementById("sim-recursos")?.value);
  const bomPagador = converterMoedaParaNumero(document.getElementById("sim-bom-pagador")?.value);

  // Subsídio MCMV básico estimado
  const subsidioCalculado = (rendaBruta > 0 && rendaBruta <= 4400) ? Math.max(0, 55000 - (rendaBruta * 5)) : 0;
  const elSubsidio = document.getElementById("sim-subsidio-val");
  if (elSubsidio) elSubsidio.value = "R$ " + formatarMoeda(subsidioCalculado);

  // Idade e Prazo
  const dataNascStr = document.getElementById("sim-data-nasc")?.value;
  let idade = 30;
  if (dataNascStr) {
    const partes = dataNascStr.split("-");
    idade = new Date().getFullYear() - parseInt(partes[0]);
  }
  const prazoInput = parseInt(document.getElementById("sim-prazo-finan")?.value) || 420;

  // Taxas e Seguros aproximados
  const optRedutor = document.querySelector('input[name="opt-redutor"]:checked')?.value || "sim";
  let taxaAnualNominal = (optRedutor === "sim") ? 0.055 : 0.06;
  if (rendaBruta > 4000) taxaAnualNominal = 0.0766;
  const taxaMensal = taxaAnualNominal / 12;

  const aliquotaMIP = 0.0002;
  const aliquotaFGHAB = 0.000196;
  const taxaManutencao = 25.00;

  // Limite de Comprometimento (30%)
  const maxComprometimento = rendaBruta * 0.30;
  const denominador = (1 / prazoInput) + taxaMensal + aliquotaMIP + aliquotaFGHAB;
  let valorFinanciado = 0;

  if (rendaBruta > 0 && maxComprometimento > 0) {
    let calcRenda = (maxComprometimento - taxaManutencao) / denominador;
    let limite80 = valorImovel * 0.80;
    valorFinanciado = Math.min(calcRenda, limite80);
    if (valorFinanciado < 0) valorFinanciado = 0;
  }

  // Cálculos de Entrada
  const entradaTotal = Math.max(0, valorImovel - valorFinanciado);
  const entradaBruta = Math.max(0, entradaTotal - subsidioCalculado - fgts - bomPagador);
  const saldoRecursos = Math.max(0, recursos);
  const entradaLiquida = Math.max(0, entradaBruta - saldoRecursos);

  // Parcelas de Sinal e Líquida
  const parcSinalQtd = parseInt(document.getElementById("sac-parc-sinal")?.value) || 5;
  const valAto = converterMoedaParaNumero(document.getElementById("sac-input-ato")?.value);
  const pctAto = valorImovel > 0 ? (valAto / valorImovel) * 100 : 0;
  
  const valSinal = Math.max(0, entradaBruta * 0.2); // Exemplo proporcional
  const valParcSinal = parcSinalQtd > 0 ? valSinal / parcSinalQtd : 0;

  const parcLiquidaQtd = parseInt(document.getElementById("sac-parc-liquida")?.value) || 30;
  const valParcLiquida = parcLiquidaQtd > 0 ? entradaLiquida / parcLiquidaQtd : 0;

  // Atualizar campos SAC
  document.getElementById("sac-val-financiamento").textContent = formatarMoeda(valorFinanciado);
  document.getElementById("sac-val-entrada-total").textContent = formatarMoeda(entradaTotal);
  document.getElementById("sac-val-subsidio").textContent = formatarMoeda(subsidioCalculado);
  document.getElementById("sac-val-fgts").textContent = formatarMoeda(fgts);
  document.getElementById("sac-val-bom-pagador").textContent = formatarMoeda(bomPagador);
  document.getElementById("sac-val-entrada-bruta").textContent = formatarMoeda(entradaBruta);
  document.getElementById("sac-val-recursos").textContent = formatarMoeda(recursos);
  document.getElementById("sac-val-saldo-rec").textContent = formatarMoeda(saldoRecursos);
  document.getElementById("sac-pct-ato").value = pctAto.toFixed(1) + "%";
  document.getElementById("sac-val-sinal").textContent = formatarMoeda(valSinal);
  document.getElementById("sac-val-parc-sinal").textContent = formatarMoeda(valParcSinal);
  document.getElementById("sac-val-entrada-liquida").textContent = formatarMoeda(entradaLiquida);
  document.getElementById("sac-val-parc-liquida").textContent = formatarMoeda(valParcLiquida);

  // Atualizar campos PRICE (Espelhando valores base para comparação)
  document.getElementById("price-val-financiamento").textContent = formatarMoeda(valorFinanciado);
  document.getElementById("price-val-entrada-total").textContent = formatarMoeda(entradaTotal);
  document.getElementById("price-val-subsidio").textContent = formatarMoeda(subsidioCalculado);
  document.getElementById("price-val-fgts").textContent = formatarMoeda(fgts);
  document.getElementById("price-val-bom-pagador").textContent = formatarMoeda(bomPagador);
  document.getElementById("price-val-entrada-bruta").textContent = formatarMoeda(entradaBruta);
  document.getElementById("price-val-recursos").textContent = formatarMoeda(recursos);
  document.getElementById("price-val-saldo-rec").textContent = formatarMoeda(saldoRecursos);
  document.getElementById("price-pct-ato").value = pctAto.toFixed(1) + "%";
  document.getElementById("price-val-sinal").textContent = formatarMoeda(valSinal);
  document.getElementById("price-val-parc-sinal").textContent = formatarMoeda(valParcSinal);
  document.getElementById("price-val-entrada-liquida").textContent = formatarMoeda(entradaLiquida);
  document.getElementById("price-val-parc-liquida").textContent = formatarMoeda(valParcLiquida);

  // Métricas Totais
  document.getElementById("res-sac-inicial").textContent = "R$ " + formatarMoeda(valorFinanciado * 1.4);
  document.getElementById("res-sac-amortizado").textContent = "R$ " + formatarMoeda(valorFinanciado);
  document.getElementById("res-sac-diferenca").textContent = "R$ 0,00";

  document.getElementById("res-price-inicial").textContent = "R$ " + formatarMoeda(valorFinanciado * 1.6);
  document.getElementById("res-price-amortizado").textContent = "R$ " + formatarMoeda(valorFinanciado);
  document.getElementById("res-price-diferenca").textContent = "R$ 0,00";

  // Gerar Tabela Unificada Comparativa
  let htmlTabela = "";
  let saldoSac = valorFinanciado;
  let saldoPrice = valorFinanciado;
  let amortConstante = valorFinanciado / prazoInput;
  
  // Coeficiente Price
  let i = taxaMensal;
  let pmtPrice = valorFinanciado > 0 ? (valorFinanciado * i) / (1 - Math.pow(1 + i, -prazoInput)) : 0;

  for (let m = 1; m <= Math.min(prazoInput, 60); m++) {
    if (saldoSac <= 0 && saldoPrice <= 0) break;

    let jurosSac = saldoSac * taxaMensal;
    let parcelaSac = amortConstante + jurosSac + (saldoSac * aliquotaMIP) + taxaManutencao;
    saldoSac -= amortConstante;

    let jurosPrice = saldoPrice * taxaMensal;
    let amortPrice = pmtPrice - jurosPrice;
    let parcelaPrice = pmtPrice + (saldoPrice * aliquotaMIP) + taxaManutencao;
    saldoPrice -= amortPrice;

    htmlTabela += `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="text-align: center; padding: 6px;">${m}</td>
        <td style="text-align: center; background-color: #fffde7;"><input type="text" placeholder="R$ 0,00" style="width: 85px; text-align: right; font-size: 0.75rem;" oninput="mascararMoeda(this)"></td>
        <td style="background-color: #f0fdf4; padding: 6px;">R$ ${formatarMoeda(parcelaSac)}</td>
        <td style="background-color: #f0fdf4; padding: 6px;">R$ ${formatarMoeda(jurosSac)}</td>
        <td style="background-color: #f0fdf4; padding: 6px;">R$ ${formatarMoeda(Math.max(0, saldoSac))}</td>
        <td style="background-color: #fafafa; padding: 6px; border-left: 2px solid #ddd;">R$ ${formatarMoeda(parcelaPrice)}</td>
        <td style="background-color: #fafafa; padding: 6px;">R$ ${formatarMoeda(jurosPrice)}</td>
        <td style="background-color: #fafafa; padding: 6px;">R$ ${formatarMoeda(Math.max(0, saldoPrice))}</td>
      </tr>
    `;
  }

  const tbody = document.getElementById("tabela-unificada-body");
  if (tbody) tbody.innerHTML = htmlTabela;
}

function imprimirResultado(tipo) {
  window.print();
}
