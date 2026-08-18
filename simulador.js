// ==========================================
// FUNÇÕES DE CONTROLE DO MODAL (ABRIR / FECHAR)
// ==========================================

function abrirSpeedSim() {
    var modal = document.getElementById('modal-speedsim');
    if (modal) {
        modal.style.display = 'block';
        // Executa a simulação inicial ao abrir para atualizar valores padrão
        simularFluxo();
    } else {
        console.error("Erro: Elemento '#modal-speedsim' não foi encontrado no HTML.");
    }
}

function fecharSpeedSim() {
    var modal = document.getElementById('modal-speedsim');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Fechar ao clicar fora da caixa do modal
window.addEventListener('click', function(event) {
    var modal = document.getElementById('modal-speedsim');
    if (event.target === modal) {
        fecharSpeedSim();
    }
});


// ==========================================
// FUNÇÕES AUXILIARES DE FORMATAÇÃO E MOEDA
// ==========================================

function converterMoedaParaNumero(valor) {
    if (!valor) return 0;
    if (typeof valor === 'number') return valor;
    var limpo = valor.replace(/[^\d,-]/g, '').replace(',', '.');
    return parseFloat(limpo) || 0;
}

function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function mascararMoeda(i) {
    if (!i) return;
    var v = i.value.replace(/\D/g, '');
    v = (v / 100).toFixed(2) + '';
    v = v.replace(".", ",");
    v = v.replace(/(\d)(\d{3})(\d{3}),/g, "$1.$2.$3,");
    v = v.replace(/(\d)(\d{3}),/g, "$1.$2,");
    i.value = "R$ " + v;
}


// ==========================================
// FUNÇÃO PRINCIPAL DE SIMULAÇÃO (FLUXO)
// ==========================================

function simularFluxo() {
    // 1. LEITURA DOS INPUTS SUPERIORES
    var valImovelInput = document.getElementById('sim-val-imovel') ? document.getElementById('sim-val-imovel').value : '';
    var valImovel = converterMoedaParaNumero(valImovelInput);

    var valAvaliacaoInput = document.getElementById('sim-val-avaliacao') ? document.getElementById('sim-val-avaliacao').value : '';
    var valAvaliacao = converterMoedaParaNumero(valAvaliacaoInput);

    var bomPagadorInput = document.getElementById('sim-bom-pagador') ? document.getElementById('sim-bom-pagador').value : '';
    var bomPagador = converterMoedaParaNumero(bomPagadorInput);

    var rendaInput = document.getElementById('sim-renda') ? document.getElementById('sim-renda').value : '';
    var renda = converterMoedaParaNumero(rendaInput);

    var fgtsInput = document.getElementById('sim-fgts') ? document.getElementById('sim-fgts').value : '';
    var fgts = converterMoedaParaNumero(fgtsInput);

    // LEITURA DO NOVO CAMPO RECURSOS (antigo sim-sinal)
    var recursosInput = document.getElementById('sim-recursos') ? document.getElementById('sim-recursos').value : '';
    var recursos = converterMoedaParaNumero(recursosInput);

    // 2. ATUALIZAÇÃO DOS CAMPOS DE REC. PRÓPRIOS NOS CARDS (SAC E PRICE)
    var sacValRecursos = document.getElementById('sac-val-recursos');
    if (sacValRecursos) {
        sacValRecursos.textContent = formatarMoeda(recursos);
    }

    var priceValRecursos = document.getElementById('price-val-recursos');
    if (priceValRecursos) {
        priceValRecursos.textContent = formatarMoeda(recursos);
    }

    // 3. LEITURA DOS CAMPOS DE ATO
    var sacInputAto = document.getElementById('sac-input-ato');
    var sacAtoVal = sacInputAto ? converterMoedaParaNumero(sacInputAto.value) : 0;

    var priceInputAto = document.getElementById('price-input-ato');
    var priceAtoVal = priceInputAto ? converterMoedaParaNumero(priceInputAto.value) : 0;

    // 4. CÁLCULO DA PORCENTAGEM DO ATO SOBRE O VALOR DO IMÓVEL
    if (valImovel > 0) {
        if (document.getElementById('sac-pct-ato')) {
            var sacPct = ((sacAtoVal / valImovel) * 100).toFixed(1) + '%';
            document.getElementById('sac-pct-ato').value = sacPct;
        }
        if (document.getElementById('price-pct-ato')) {
            var pricePct = ((priceAtoVal / valImovel) * 100).toFixed(1) + '%';
            document.getElementById('price-pct-ato').value = pricePct;
        }
    }

    // 5. LEITURA DOS PARÂMETROS DE PARCELAMENTO
    var sacParcSinal = parseInt(document.getElementById('sac-parc-sinal') ? document.getElementById('sac-parc-sinal').value : 5) || 1;
    var priceParcSinal = parseInt(document.getElementById('price-parc-sinal') ? document.getElementById('price-parc-sinal').value : 5) || 1;

    var sacParcLiquida = parseInt(document.getElementById('sac-parc-liquida') ? document.getElementById('sac-parc-liquida').value : 30) || 1;
    var priceParcLiquida = parseInt(document.getElementById('price-parc-liquida') ? document.getElementById('price-parc-liquida').value : 30) || 1;

    // 6. CÁLCULOS DO SISTEMA SAC
    var sacFinanciamento = converterMoedaParaNumero(document.getElementById('sac-val-financiamento') ? document.getElementById('sac-val-financiamento').textContent : '0');
    var sacSubsidio = converterMoedaParaNumero(document.getElementById('sac-val-subsidio') ? document.getElementById('sac-val-subsidio').textContent : '0');

    var sacEntradaTotal = valImovel - sacFinanciamento;
    var sacEntradaBruta = valImovel - (sacFinanciamento + sacSubsidio + fgts + bomPagador);
    var sacSaldoRecursos = recursos - sacEntradaBruta;
    
    var sacSinal = sacEntradaBruta; 
    var sacParcSinalVal = sacSinal / sacParcSinal;

    var sacEntradaLiquida = Math.max(0, sacEntradaBruta - sacAtoVal - sacSinal);
    var sacParcLiquidaVal = sacEntradaLiquida / sacParcLiquida;

    // Atualização de telas SAC
    if (document.getElementById('sac-val-entrada-total')) document.getElementById('sac-val-entrada-total').textContent = formatarMoeda(sacEntradaTotal);
    if (document.getElementById('sac-val-entrada-bruta')) document.getElementById('sac-val-entrada-bruta').textContent = formatarMoeda(sacEntradaBruta);
    if (document.getElementById('sac-val-saldo-rec')) document.getElementById('sac-val-saldo-rec').textContent = formatarMoeda(sacSaldoRecursos);
    if (document.getElementById('sac-val-sinal')) document.getElementById('sac-val-sinal').textContent = formatarMoeda(sacSinal);
    if (document.getElementById('sac-val-parc-sinal')) document.getElementById('sac-val-parc-sinal').textContent = formatarMoeda(sacParcSinalVal);
    if (document.getElementById('sac-val-entrada-liquida')) document.getElementById('sac-val-entrada-liquida').textContent = formatarMoeda(sacEntradaLiquida);
    if (document.getElementById('sac-val-parc-liquida')) document.getElementById('sac-val-parc-liquida').textContent = formatarMoeda(sacParcLiquidaVal);

    // 7. CÁLCULOS DO SISTEMA PRICE
    var priceFinanciamento = converterMoedaParaNumero(document.getElementById('price-val-financiamento') ? document.getElementById('price-val-financiamento').textContent : '0');
    var priceSubsidio = converterMoedaParaNumero(document.getElementById('price-val-subsidio') ? document.getElementById('price-val-subsidio').textContent : '0');

    var priceEntradaTotal = valImovel - priceFinanciamento;
    var priceEntradaBruta = valImovel - (priceFinanciamento + priceSubsidio + fgts + bomPagador);
    var priceSaldoRecursos = recursos - priceEntradaBruta;

    var priceSinal = priceEntradaBruta;
    var priceParcSinalVal = priceSinal / priceParcSinal;

    var priceEntradaLiquida = Math.max(0, priceEntradaBruta - priceAtoVal - priceSinal);
    var priceParcLiquidaVal = priceEntradaLiquida / priceParcLiquida;

    // Atualização de telas PRICE
    if (document.getElementById('price-val-entrada-total')) document.getElementById('price-val-entrada-total').textContent = formatarMoeda(priceEntradaTotal);
    if (document.getElementById('price-val-entrada-bruta')) document.getElementById('price-val-entrada-bruta').textContent = formatarMoeda(priceEntradaBruta);
    if (document.getElementById('price-val-saldo-rec')) document.getElementById('price-val-saldo-rec').textContent = formatarMoeda(priceSaldoRecursos);
    if (document.getElementById('price-val-sinal')) document.getElementById('price-val-sinal').textContent = formatarMoeda(priceSinal);
    if (document.getElementById('price-val-parc-sinal')) document.getElementById('price-val-parc-sinal').textContent = formatarMoeda(priceParcSinalVal);
    if (document.getElementById('price-val-entrada-liquida')) document.getElementById('price-val-entrada-liquida').textContent = formatarMoeda(priceEntradaLiquida);
    if (document.getElementById('price-val-parc-liquida')) document.getElementById('price-val-parc-liquida').textContent = formatarMoeda(priceParcLiquidaVal);
}
