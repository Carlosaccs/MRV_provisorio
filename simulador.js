// ===========================================
// MOTOR DE CÁLCULO E MÁSCARAS (SIMULADOR)
// ===========================================

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

function simularFluxo() {
  const rendaBruta = converterMoedaParaNumero(document.getElementById("sim-renda")?.value);
  const valorImovel = converterMoedaParaNumero(document.getElementById("sim-val-imovel")?.value);
  const fgts = converterMoedaParaNumero(document.getElementById("sim-fgts")?.value);
  const prazoInput = parseInt(document.getElementById("sim-prazo-finan")?.value) || 420;

  // Subsídio MCMV básico estimado
  const subsidioCalculado = (rendaBruta > 0 && rendaBruta <= 4400) ? Math.max(0, 55000 - (rendaBruta * 5)) : 0;
  const elSubsidio = document.getElementById("sim-subsidio-val");
  if (elSubsidio) elSubsidio.value = "R$ " + formatarMoeda(subsidioCalculado);

  // Taxas e Comprometimento
  const taxaAnualNominal = (rendaBruta > 4000) ? 0.0766 : 0.055;
  const taxaMensal = taxaAnualNominal / 12;
  const maxComprometimento = rendaBruta * 0.30;
  
  const denominador = (1 / prazoInput) + taxaMensal + 0.0002 + 0.000196;
  let valorFinanciado = 0;

  if (rendaBruta > 0 && maxComprometimento > 0) {
    let calcRenda = (maxComprometimento - 25.00) / denominador;
    let limite80 = valorImovel * 0.80;
    valorFinanciado = Math.min(calcRenda, limite80);
    if (valorFinanciado < 0) valorFinanciado = 0;
  }

  // Cálculos de Entrada
  const entradaTotal = Math.max(0, valorImovel - valorFinanciado);
  const entradaBruta = Math.max(0, entradaTotal - subsidioCalculado - fgts);

  // Atualizar campos visuais se existirem na tela
  const elFin = document.getElementById("sac-val-financiamento");
  if (elFin) elFin.textContent = formatarMoeda(valorFinanciado);

  const elEntTotal = document.getElementById("sac-val-entrada-total");
  if (elEntTotal) elEntTotal.textContent = formatarMoeda(entradaTotal);

  const elSub = document.getElementById("sac-val-subsidio");
  if (elSub) elSub.textContent = formatarMoeda(subsidioCalculado);

  const elEntLiq = document.getElementById("sac-val-entrada-liquida");
  if (elEntLiq) elEntLiq.textContent = formatarMoeda(entradaBruta);

  // Gerar Tabela Unificada Comparativa (Exemplo primeiras 60 parcelas)
  let htmlTabela = "";
  let saldoSac = valorFinanciado;
  let saldoPrice = valorFinanciado;
  let amortConstante = valorFinanciado / prazoInput;
  let pmtPrice = valorFinanciado > 0 ? (valorFinanciado * taxaMensal) / (1 - Math.pow(1 + taxaMensal, -prazoInput)) : 0;

  for (let m = 1; m <= Math.min(prazoInput, 60); m++) {
    if (saldoSac <= 0 && saldoPrice <= 0) break;

    let jurosSac = saldoSac * taxaMensal;
    let parcelaSac = amortConstante + jurosSac + (saldoSac * 0.0002) + 25.00;
    saldoSac -= amortConstante;

    let jurosPrice = saldoPrice * taxaMensal;
    let amortPrice = pmtPrice - jurosPrice;
    let parcelaPrice = pmtPrice + (saldoPrice * 0.0002) + 25.00;
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
