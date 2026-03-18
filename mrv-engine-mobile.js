/* ==========================================================================
   VARIÁVEIS GLOBAIS E MAPEAMENTO DE COLUNAS
   ========================================================================== */
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

/* ==========================================================================
   FUNÇÕES DE APOIO (LINKS E CLIPBOARD)
   ========================================================================== */
function formatarLinkSeguro(url) {
    if (!url || url === "---" || url === "" || typeof url !== 'string') return "";
    let link = url.trim();
    if (link.includes('drive.google.com')) {
        const match = link.match(/\/d\/(.*?)(\/|$|\?)/) || link.match(/id=(.*?)($|&)/);
        if (match && match[1]) return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return link;
}

function copiarLink(url) {
    const linkSeguro = formatarLinkSeguro(url);
    navigator.clipboard.writeText(linkSeguro);
    alert("Link copiado para a área de transferência!");
}

/* ==========================================================================
   CARREGAMENTO DE DADOS
   ========================================================================== */
async function iniciarApp() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0&v=${new Date().getTime()}`;
    try {
        const response = await fetch(URL_CSV);
        const texto = await response.text();
        const linhasPuras = texto.split(/\r?\n/);

        DADOS_PLANILHA = linhasPuras.slice(1).map(linha => {
            const colunas = []; let campo = "", aspas = false;
            for (let i = 0; i < linha.length; i++) {
                const char = linha[i];
                if (char === '"') aspas = !aspas;
                else if (char === ',' && !aspas) { colunas.push(campo.trim()); campo = ""; }
                else { campo += char; }
            }
            colunas.push(campo.trim());
            if (!colunas[COL.ID] || (colunas[COL.NOME] || "").length <= 1) return null;
            
            return {
                id_path: colunas[COL.ID].toLowerCase().replace(/\s/g, ''),
                tipo: colunas[COL.CATEGORIA].includes('COMPLEXO') ? 'N' : 'R',
                ordem: parseInt(colunas[COL.ORDEM]) || 999,
                nome: colunas[COL.NOME],
                nomeFull: colunas[COL.NOME_FULL],
                estoque: colunas[COL.ESTOQUE],
                endereco: colunas[COL.END],
                tipologiasH: colunas[COL.TIPOLOGIAS],
                entrega: colunas[COL.ENTREGA],
                obra: colunas[COL.OBRA],
                regiao: colunas[COL.REGIAO],
                casa_paulista: colunas[COL.CASA_PAULISTA],
                observacoes: colunas[COL.OBSERVACOES],
                linkCliente: colunas[COL.BOOK_CLIENTE],
                linkCorretor: colunas[COL.BOOK_CORRETOR]
            };
        }).filter(i => i !== null).sort((a, b) => a.ordem - b.ordem);

        desenharMapas();
        gerarListaLateral();
    } catch (e) { console.error(e); }
}

/* ==========================================================================
   INTERAÇÃO COM O MAPA E LISTA
   ========================================================================== */
function navegarVitrine(nome) { 
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome);
    if (imovel) comandoSelecao(imovel.id_path, null, imovel); 
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
    montarVitrine(selecionado);
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    const pathsHtml = dados.paths.map(p => {
        const idNorm = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idNorm);
        const ativo = (pathAtivo === idNorm && interativo) ? 'ativo' : '';
        return `<path id="${id}-${idNorm}" d="${p.d}" class="${temMRV && interativo ? 'commrv '+ativo : ''}" ${interativo ? `onclick="comandoSelecao('${p.id}')"` : ''}></path>`;
    }).join('');
    container.innerHTML = `<svg viewBox="${dados.viewBox}"><g>${pathsHtml}</g></svg>`;
}

function desenharMapas() {
    renderizarNoContainer('caixa-a', (mapaAtivo === 'GSP' ? MAPA_GSP : MAPA_INTERIOR), true);
    renderizarNoContainer('caixa-b', (mapaAtivo === 'GSP' ? MAPA_INTERIOR : MAPA_GSP), false);
}

function gerarListaLateral() {
    const container = document.getElementById('lista-imoveis');
    container.innerHTML = DADOS_PLANILHA.map(item => {
        const ativo = item.nome === imovelAtivo ? 'ativo' : '';
        return `<div class="${item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes'} ${ativo}" onclick="navegarVitrine('${item.nome}')">
                    <strong>${item.nome}</strong>
                </div>`;
    }).join('');
}

/* ==========================================================================
   CONSTRUÇÃO DA VITRINE (AQUI ESTAVA O ERRO)
   ========================================================================== */
function criarCardMaterial(titulo, url, icone) {
    if (!url || url === "" || url === "---") return "";
    return `
    <div class="card-material-item">
        <div style="display:flex; align-items:center;">
            <span style="margin-right:8px;">${icone}</span>
            <span style="font-size:0.75rem; font-weight:bold;">${titulo}</span>
        </div>
        <div>
            <a href="${formatarLinkSeguro(url)}" target="_blank" class="card-btn-abrir">Abrir</a>
            <button onclick="copiarLink('${
