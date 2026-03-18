let DADOS_PLANILHA = [];
let pathAtivo = null;  
let imovelAtivo = null;  
let mapaAtivo = 'GSP'; 

const COL = {
    ID: 0, CATEGORIA: 1, ORDEM: 2, NOME: 3, NOME_FULL: 4, 
    ESTOQUE: 5, END: 6, TIPOLOGIAS: 7, ENTREGA: 8, 
    P_DE: 9, P_ATE: 10, OBRA: 11, REGIAO: 13, 
    CASA_PAULISTA: 14, CAMPANHA: 15, OBSERVACOES: 18, 
    LOCALIZACAO: 19, BOOK_CLIENTE: 24, BOOK_CORRETOR: 25,
    LINKS_VIDEOS: 26, PLANTAO_VENDAS: 30 
};

async function iniciarApp() {
    await carregarPlanilha();
}

async function carregarPlanilha() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0&v=${new Date().getTime()}`;
    try {
        const response = await fetch(URL_CSV);
        const texto = await response.text();
        const linhas = texto.split(/\r?\n/).slice(1);

        DADOS_PLANILHA = linhas.map(linha => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Split respeitando aspas
            if (!c[COL.ID]) return null;
            return {
                id_path: c[COL.ID].toLowerCase().replace(/\s/g, ''),
                tipo: c[COL.CATEGORIA].includes('COMPLEXO') ? 'N' : 'R',
                ordem: parseInt(c[COL.ORDEM]),
                nome: c[COL.NOME],
                estoque: c[COL.ESTOQUE],
                entrega: c[COL.ENTREGA],
                regiao: c[COL.REGIAO]
            };
        }).filter(i => i !== null).sort((a,b) => a.ordem - b.ordem);

        desenharMapas();
        gerarListaLateral();
    } catch (e) { console.error(e); }
}

function navegarVitrine(nome) { 
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome);
    if (imovel) {
        comandoSelecao(imovel.id_path, null, imovel);
        // FECHA O MENU AO CLICAR
        if(typeof toggleMenu === 'function') toggleMenu();
    }
}

function comandoSelecao(idPath, nomePath, fonte) {
    pathAtivo = idPath.toLowerCase().replace(/\s/g, '');
    const imoveisDaCidade = DADOS_PLANILHA.filter(d => d.id_path === pathAtivo);
    const selecionado = fonte || imoveisDaCidade[0];
    imovelAtivo = selecionado.nome;

    document.querySelectorAll('path').forEach(el => el.classList.remove('ativo'));
    const elMapa = document.getElementById(`caixa-a-${pathAtivo}`);
    if (elMapa) elMapa.classList.add('ativo');

    gerarListaLateral();
    montarVitrine(selecionado, imoveisDaCidade, pathAtivo);
}

function gerarListaLateral() {
    const container = document.getElementById('lista-imoveis');
    container.innerHTML = DADOS_PLANILHA.map(item => {
        const ativo = item.nome === imovelAtivo ? 'ativo' : '';
        const classe = item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes';
        return `<div class="${classe} ${ativo}" onclick="navegarVitrine('${item.nome}')">
                    <strong>${item.nome}</strong>
                </div>`;
    }).join('');
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    const pathsHtml = dados.paths.map(p => {
        const idNorm = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idNorm);
        return `<path id="${id}-${idNorm}" d="${p.d}" class="${temMRV && interativo ? 'commrv' : ''}" onclick="comandoSelecao('${p.id}')"></path>`;
    }).join('');
    container.innerHTML = `<svg viewBox="${dados.viewBox}"><g>${pathsHtml}</g></svg>`;
}

function desenharMapas() {
    renderizarNoContainer('caixa-a', (mapaAtivo === 'GSP' ? MAPA_GSP : MAPA_INTERIOR), true);
    renderizarNoContainer('caixa-b', (mapaAtivo === 'GSP' ? MAPA_INTERIOR : MAPA_GSP), false);
}

function montarVitrine(selecionado, lista, regiao) {
    const painel = document.getElementById('ficha-tecnica');
    painel.innerHTML = `
        <div class="vitrine-topo">RESIDENCIAL SELECIONADO</div>
        <div style="padding:15px;">
            <h2 style="color:var(--mrv-verde)">${selecionado.nome}</h2>
            <p><strong>Estoque:</strong> ${selecionado.estoque} UN.</p>
            <p><strong>Região:</strong> ${selecionado.regiao}</p>
            <p><strong>Entrega:</strong> ${selecionado.entrega}</p>
        </div>`;
}

window.onload = iniciarApp;
