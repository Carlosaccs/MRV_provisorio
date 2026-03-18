/* ==========================================================================
   CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
   ========================================================================== */
let DADOS_PLANILHA = [];
let pathAtivo = null;  
let imovelAtivo = null;  
let mapaAtivo = 'GSP'; 

const COL = {
    ID: 0, CATEGORIA: 1, ORDEM: 2, NOME: 3, NOME_FULL: 4, 
    ESTOQUE: 5, END: 6, TIPOLOGIAS: 7, ENTREGA: 8, 
    P_DE: 9, P_ATE: 10, OBRA: 11, LIMITADOR: 12, 
    REGIAO: 13, CASA_PAULISTA: 14, CAMPANHA: 15, 
    OBSERVACOES: 18, DESC_LONGA: 17, 
    LOCALIZACAO: 19, MOBILIDADE: 20, CULTURA_LAZER: 21,    
    COMERCIO: 22, SAUDE_EDUCACAO: 23,
    BOOK_CLIENTE: 24, BOOK_CORRETOR: 25,
    LINKS_VIDEOS: 26, LINKS_PLANTAS: 27,  
    LINKS_IMPLANT: 28, LINKS_DIVERSOS: 29,
    PLANTAO_VENDAS: 30 
};

/* ==========================================================================
   INICIALIZAÇÃO E CARREGAMENTO
   ========================================================================== */
async function iniciarApp() {
    try { await carregarPlanilha(); } catch (err) { console.error(err); }
}

function formatarLinkSeguro(url) {
    if (!url || url === "---" || url === "" || typeof url !== 'string') return "";
    let link = url.trim();
    if (link.includes('drive.google.com')) {
        const match = link.match(/\/d\/(.*?)(\/|$|\?)/) || link.match(/id=(.*?)($|&)/);
        if (match && match[1]) {
            return `https://drive.google.com/file/d/${match[1]}/preview`;
        }
    }
    return link;
}

function obterIdDrive(url) {
    if (!url || !url.includes('drive.google.com')) return null;
    const match = url.match(/\/d\/(.*?)(\/|$|\?)/) || url.match(/id=(.*?)($|&)/);
    return match ? match[1] : null;
}

function copiarLink(url) {
    const linkSeguro = formatarLinkSeguro(url);
    navigator.clipboard.writeText(linkSeguro);
    alert("Link copiado com sucesso!");
}

async function carregarPlanilha() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0&v=${new Date().getTime()}`;
    try {
        const response = await fetch(URL_CSV);
        let texto = await response.text();
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

            const idPath = (colunas[COL.ID] || "").toLowerCase().replace(/\s/g, '');
            if (!idPath || (colunas[COL.NOME] || "").length <= 1) return null;
            
            return {
                id_path: idPath, tipo: (colunas[COL.CATEGORIA] || "").includes('COMPLEXO') ? 'N' : 'R',
                ordem: parseInt(colunas[COL.ORDEM]) || 999, nome: colunas[COL.NOME], 
                nomeFull: colunas[COL.NOME_FULL], estoque: colunas[COL.ESTOQUE], 
                endereco: colunas[COL.END], entrega: colunas[COL.ENTREGA], 
                obra: colunas[COL.OBRA], tipologiasH: colunas[COL.TIPOLOGIAS], 
                regiao: colunas[COL.REGIAO], casa_paulista: colunas[COL.CASA_PAULISTA],
                observacoes: colunas[COL.OBSERVACOES], localizacao: colunas[COL.LOCALIZACAO],
                linkCliente: colunas[COL.BOOK_CLIENTE], linkCorretor: colunas[COL.BOOK_CORRETOR],
                linksVideos: colunas[COL.LINKS_VIDEOS]
            };
        }).filter(i => i !== null).sort((a, b) => a.ordem - b.ordem);

        desenharMapas(); gerarListaLateral();
    } catch (e) { console.error(e); }
}

/* ==========================================================================
   LÓGICA DO MAPA E SELEÇÃO
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
    
    const todosPaths = MAPA_GSP.paths.concat(MAPA_INTERIOR.paths);
    const nomeOficial = todosPaths.find(p => p.id.toLowerCase().replace(/\s/g, '') === pathAtivo)?.name || pathAtivo;
    document.getElementById('cidade-titulo').innerText = `MRV EM ${nomeOficial.toUpperCase()}`;
    
    montarVitrine(selecionado, imoveisDaCidade, nomeOficial);
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    const pathsHtml = dados.paths.map(p => {
        const idNorm = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idNorm);
        const ativo = (pathAtivo === idNorm && interativo) ? 'ativo' : '';
        let eventos = interativo ? `onclick="comandoSelecao('${p.id}')"` : "";
        return `<path id="${id}-${idNorm}" d="${p.d}" class="${temMRV && interativo ? 'commrv '+ativo : ''}" ${eventos}></path>`;
    }).join('');
    container.innerHTML = `<svg viewBox="${dados.viewBox}"><g>${pathsHtml}</g></svg>`;
}

function desenharMapas() {
    renderizarNoContainer('caixa-a', (mapaAtivo === 'GSP' ? MAPA_GSP : MAPA_INTERIOR), true);
    renderizarNoContainer('caixa-b', (mapaAtivo === 'GSP' ? MAPA_INTERIOR : MAPA_GSP), false);
    document.getElementById('caixa-b').onclick = () => {
        mapaAtivo = (mapaAtivo === 'GSP' ? 'INTERIOR' : 'GSP');
        desenharMapas();
    };
}

function gerarListaLateral() {
    const container = document.getElementById('lista-imoveis');
    container.innerHTML = DADOS_PLANILHA.map(item => {
        const ativo = item.nome === imovelAtivo ? 'ativo' : '';
        // REMOVIDO O ESTOQUE DA LISTA LATERAL COMO SOLICITADO
        return `<div class="${item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes'} ${ativo}" onclick="navegarVitrine('${item.nome}')">
                    <strong>${item.nome}</strong>
                </div>`;
    }).join('');
}

/* ==========================================================================
   CONSTRUÇÃO DA VITRINE (FICHA TÉCNICA)
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
            <button onclick="copiarLink('${url}')" class="card-btn-copiar">Link</button>
        </div>
    </div>`;
}

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.endereco)}`;
    
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao.toUpperCase()}</div>`;
    
    html += `<div class="faixa-laranja">RES. ${selecionado.nome.toUpperCase()}</div>`;
    html += `<div style="padding: 5px; font-size:0.7rem; color:#444;">
                <p>📍 ${selecionado.endereco} <a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a></p>
             </div>`;

    html += `<div style="background:#f9f9f9; border:1px solid #ddd; border-radius:4px; margin-bottom:10px;">
                <div style="display:flex; border-bottom:1px solid #ddd;">
                    <div style="flex:1; padding:8px; border-right:1px solid #ddd;">
                        <label style="display:block; font-size:0.5rem; color:var(--mrv-verde); font-weight:bold;">ENTREGA</label>
                        <strong>${selecionado.entrega}</strong>
                    </div>
                    <div style="flex:1; padding:8px;">
                        <label style="display:block; font-size:0.5rem; color:var(--mrv-verde); font-weight:bold;">OBRA</label>
                        <strong>${selecionado.obra}%</strong>
                    </div>
                </div>
                <div style="display:flex;">
                    <div style="flex:1; padding:8px; border-right:1px solid #ddd;">
                        <label style="display:block; font-size:0.5rem; color:var(--mrv-verde); font-weight:bold;">ESTOQUE</label>
                        <strong style="color:var(--mrv-laranja)">${selecionado.estoque} UN.</strong>
                    </div>
                    <div style="flex:1; padding:8px;">
                        <label style="display:block; font-size:0.5rem; color:var(--mrv-verde); font-weight:bold;">CASA PAULISTA</label>
                        <strong>${selecionado.casa_paulista}</strong>
                    </div>
                </div>
             </div>`;

    if(selecionado.tipologiasH) {
        const linhas = selecionado.tipologiasH.split(';').map(l => l.trim()).filter(l => l !== "");
        if(linhas.length > 0) {
            const titulos = linhas[0].split(',');
            html += `<div class="tabela-precos-container">
                        <div class="tabela-header">${titulos.map(t => `<div class="col-tabela">${t}</div>`).join('')}</div>
                        <div class="tabela-corpo">${linhas.slice(1).map(l => `<div class="tabela-row">${l.split(',').map(v => `<div class="col-tabela">${v}</div>`).join('')}</div>`).join('')}</div>
                     </div>`;
        }
    }

    html += `<div style="background:#fff9c4; border-left:5px solid #fbc02d; padding:8px; font-size:0.75rem; margin-bottom:10px;">
                <label style="display:block; font-size:0.5rem; font-weight:bold; color:#fbc02d;">OBSERVAÇÕES</label>
                ${selecionado.observacoes}
             </div>`;

    html += criarCardMaterial('Book Cliente', selecionado.linkCliente, '📄');
    html += criarCardMaterial('Book Corretor', selecionado.linkCorretor, '💼');
    
    painel.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById("modal-sobre");
    const btn = document.getElementById("btn-sobre");
    const span = document.querySelector(".modal-close");
    if(btn) btn.onclick = () => { modal.style.display = "block"; };
    if(span) span.onclick = () => { modal.style.display = "none"; };
});

window.onload = iniciarApp;
