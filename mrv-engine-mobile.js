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

async function iniciarApp() {
    try { await carregarPlanilha(); } catch (err) { console.error(err); }
}

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
    alert("Link copiado!");
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
                id_path: idPath, tipo: (colunas[COL.CATEGORIA] || "").toUpperCase().includes('COMPLEXO') ? 'N' : 'R',
                ordem: parseInt(colunas[COL.ORDEM]), nome: colunas[COL.NOME], nomeFull: colunas[COL.NOME_FULL],
                estoque: colunas[COL.ESTOQUE], endereco: colunas[COL.END], entrega: colunas[COL.ENTREGA],
                obra: colunas[COL.OBRA], tipologiasH: colunas[COL.TIPOLOGIAS], regiao: colunas[COL.REGIAO],
                p_de: colunas[COL.P_DE], p_ate: colunas[COL.P_ATE], limitador: colunas[COL.LIMITADOR],
                casa_paulista: colunas[COL.CASA_PAULISTA], campanha: colunas[COL.CAMPANHA],
                observacoes: colunas[COL.OBSERVACOES], descLonga: colunas[COL.DESC_LONGA],
                localizacao: colunas[COL.LOCALIZACAO], mobilidade: colunas[COL.MOBILIDADE],
                lazer: colunas[COL.CULTURA_LAZER], comercio: colunas[COL.COMERCIO],
                saude: colunas[COL.SAUDE_EDUCACAO], linkCliente: colunas[COL.BOOK_CLIENTE],
                linkCorretor: colunas[COL.BOOK_CORRETOR], linksVideos: colunas[COL.LINKS_VIDEOS],
                linksPlantas: colunas[COL.LINKS_PLANTAS], linksImplant: colunas[COL.LINKS_IMPLANT],
                linksDiversos: colunas[COL.LINKS_DIVERSOS], plantaoVendas: colunas[COL.PLANTAO_VENDAS]
            };
        }).filter(i => i !== null);

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);
        desenharMapas(); gerarListaLateral();
    } catch (e) { console.error(e); }
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

function navegarVitrine(nome) { 
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome);
    if (imovel) comandoSelecao(imovel.id_path, null, imovel); 
}

function comandoSelecao(idPath, nomePath, fonte) {
    const idNorm = idPath.toLowerCase().replace(/\s/g, '');
    pathAtivo = idNorm;
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
    container.innerHTML = `<svg viewBox="${dados.viewBox}" preserveAspectRatio="xMidYMid meet"><g>${pathsHtml}</g></svg>`;
}

function desenharMapas() {
    renderizarNoContainer('caixa-a', (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR, true);
    renderizarNoContainer('caixa-b', (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP, false);
    document.getElementById('caixa-b').onclick = () => { 
        mapaAtivo = (mapaAtivo === 'GSP' ? 'INTERIOR' : 'GSP'); 
        desenharMapas(); 
    };
}

// A função montarVitrine foi adaptada do desktop para manter a riqueza de detalhes
function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao}</div>`;
    
    if (selecionado.tipo === 'R') {
        html += `<div class="titulo-vitrine-faixa faixa-laranja">RES. ${selecionado.nome.toUpperCase()}</div>`;
        html += `<div style="background:#f9f9f9; padding:8px; border-radius:8px; font-size:0.7rem; margin-bottom:10px; border:1px solid #ddd;">
                    <p>📍 ${selecionado.endereco}</p>
                    <p>🏗️ Obra: ${selecionado.obra}% | 🗓️ Entrega: ${selecionado.entrega}</p>
                 </div>`;
        
        // Exemplo de como o estoque aparece aqui na ficha técnica
        html += `<div style="background:white; border-left:4px solid var(--mrv-laranja); padding:5px 10px; margin-bottom:10px; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
                    <label style="font-size:0.6rem; font-weight:bold; color:var(--mrv-laranja);">UNIDADES EM ESTOQUE</label>
                    <p style="font-size:0.9rem; font-weight:bold;">${selecionado.estoque || "Consultar"} Unidades</p>
                 </div>`;

        if(selecionado.linkCliente) {
            html += `<a href="${formatarLinkSeguro(selecionado.linkCliente)}" target="_blank" class="card-material-item" style="text-decoration:none;">
                        <span class="card-text">📄 Book do Cliente</span>
                        <span class="card-btn-abrir">Abrir</span>
                     </a>`;
        }
    }
    painel.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById("modal-sobre");
    const btn = document.getElementById("btn-sobre");
    const span = document.querySelector(".modal-close");
    if(btn) btn.onclick = () => modal.style.display = "block";
    if(span) span.onclick = () => modal.style.display = "none";
});

window.onload = iniciarApp;
