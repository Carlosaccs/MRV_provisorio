/* ==========================================================================
   MOTOR MOBILE - ESTRATÉGIA MODO PAISAGEM
   ========================================================================== */
let DADOS_PLANILHA = [];
let pathAtivo = null;  
let imovelAtivo = null;  
let mapaAtivo = 'GSP'; 

// Mapeamento das colunas (Igual ao Desktop)
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

/* 1. DETECTOR DE ORIENTAÇÃO (GIRAR TELA) */
function verificarOrientacao() {
    const wrapper = document.querySelector('.wrapper');
    // Se a altura for maior que a largura, o celular está de pé
    if (window.innerHeight > window.innerWidth) {
        document.body.insertAdjacentHTML('afterbegin', `
            <div id="aviso-girar" style="position:fixed; top:0; left:0; width:100%; height:100%; background:var(--mrv-verde); color:white; z-index:10000; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:20px;">
                <div style="font-size: 50px; margin-bottom: 20px;">🔄</div>
                <h2>POR FAVOR, GIRE O CELULAR</h2>
                <p>Para uma melhor experiência, utilize o dashboard com o aparelho na horizontal.</p>
            </div>
        `);
    } else {
        const aviso = document.getElementById('aviso-girar');
        if (aviso) aviso.remove();
    }
}

window.addEventListener("orientationchange", () => setTimeout(verificarOrientacao, 200));
window.addEventListener("resize", verificarOrientacao);

/* 2. FUNÇÕES DE APOIO (IGUAIS AO DESKTOP) */
async function iniciarApp() {
    verificarOrientacao();
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

function obterIdDrive(url) {
    if (!url || !url.includes('drive.google.com')) return null;
    const match = url.match(/\/d\/(.*?)(\/|$|\?)/) || url.match(/id=(.*?)($|&)/);
    return match ? match[1] : null;
}

function copiarLink(url) {
    const linkSeguro = formatarLinkSeguro(url);
    navigator.clipboard.writeText(linkSeguro);
    alert("Link copiado!");
}

/* 3. CARREGAMENTO DE DADOS */
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

            const nomeImovel = colunas[COL.NOME] || "";
            const idPath = (colunas[COL.ID] || "").toLowerCase().replace(/\s/g, '');
            if (!idPath || nomeImovel.length <= 1) return null;
            
            return {
                id_path: idPath, tipo: (colunas[COL.CATEGORIA] || "").toUpperCase().includes('COMPLEXO') ? 'N' : 'R',
                ordem: parseInt(colunas[COL.ORDEM]), nome: nomeImovel, nomeFull: colunas[COL.NOME_FULL] || nomeImovel,
                estoque: colunas[COL.ESTOQUE], endereco: colunas[COL.END] || "",
                entrega: colunas[COL.ENTREGA] || "---", obra: colunas[COL.OBRA] || "0",
                tipologiasH: colunas[COL.TIPOLOGIAS] || "", regiao: colunas[COL.REGIAO] || "---",
                p_de: colunas[COL.P_DE] || "---", p_ate: colunas[COL.P_ATE] || "---",
                limitador: colunas[COL.LIMITADOR] || "---", casa_paulista: colunas[COL.CASA_PAULISTA] || "---",
                campanha: colunas[COL.CAMPANHA] || "", observacoes: colunas[COL.OBSERVACOES] || "", 
                descLonga: colunas[COL.DESC_LONGA] || "", localizacao: colunas[COL.LOCALIZACAO] || "",
                mobilidade: colunas[COL.MOBILIDADE] || "", lazer: colunas[COL.CULTURA_LAZER] || "",
                comercio: colunas[COL.COMERCIO] || "", saude: colunas[COL.SAUDE_EDUCACAO] || "",
                linkCliente: colunas[COL.BOOK_CLIENTE] || "", linkCorretor: colunas[COL.BOOK_CORRETOR] || "",
                linksVideos: colunas[COL.LINKS_VIDEOS] || "", linksPlantas: colunas[COL.LINKS_PLANTAS] || "",
                linksImplant: colunas[COL.LINKS_IMPLANT] || "", linksDiversos: colunas[COL.LINKS_DIVERSOS] || "",
                plantaoVendas: colunas[COL.PLANTAO_VENDAS] || ""
            };
        }).filter(i => i !== null);

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);
        desenharMapas(); gerarListaLateral();
    } catch (e) { console.error(e); }
}

/* 4. LÓGICA DE MAPA (ESTILO PAISAGEM) */
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

function desenharMapas() {
    renderizarNoContainer('caixa-a', (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR, true);
    renderizarNoContainer('caixa-b', (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP, false);
    document.getElementById('caixa-b').onclick = () => trocarMapas(true);
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    const pathsHtml = dados.paths.map(p => {
        const idNorm = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idNorm);
        const ativo = (pathAtivo === idNorm && interativo) ? 'ativo' : '';
        const isGSP = idNorm === "grandesaopaulo";
        let eventos = interativo ? (isGSP ? `onclick="trocarMapas(true)"` : `onclick="comandoSelecao('${p.id}')"`) : "";
        return `<path id="${id}-${idNorm}" d="${p.d}" class="${(temMRV || isGSP) && interativo ? 'commrv '+ativo : ''}" ${eventos}></path>`;
    }).join('');

    container.innerHTML = `<svg viewBox="${dados.viewBox}"><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
}

function trocarMapas(completo) { 
    mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; 
    if (completo) { pathAtivo = null; imovelAtivo = null; }
    desenharMapas(); gerarListaLateral(); 
}

function navegarVitrine(nome) { 
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome);
    if (imovel) comandoSelecao(imovel.id_path, null, imovel); 
}

function gerarListaLateral() {
    const container = document.getElementById('lista-imoveis');
    container.innerHTML = DADOS_PLANILHA.map(item => {
        const ativo = item.nome === imovelAtivo ? 'ativo' : '';
        const clean = item.estoque ? item.estoque.toString().toUpperCase().trim() : "";
        let estoqueHtml = item.tipo === 'N' ? "" : (clean === "VENDIDO" || clean === "0" ? `<span style="font-size:8px;">VENDIDO</span>` : `<span style="font-size:8px;">${clean} UN.</span>`);
        
        return `<div class="${item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes'} ${ativo}" onclick="navegarVitrine('${item.nome}')">
                    <strong>${item.nome}</strong> ${estoqueHtml}
                </div>`;
    }).join('');
}

/* 5. VITRINE (IGUAL DESKTOP, MAS COM AJUSTES DE TAMANHO MOBILE) */
const criarCardMaterial = (titulo, url, icone) => {
    if (!url || url === "" || url === "---") return "";
    const linkSeguro = formatarLinkSeguro(url);
    const fileId = obterIdDrive(url);
    const thumbUrl = fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w300` : "";

    return `
    <div class="card-material-item">
        <div class="card-material-left"><span class="card-icon">${icone}</span><span class="card-text">${titulo}</span></div>
        <div class="card-material-right">
            <div class="container-btn-abrir">
                <a href="${linkSeguro}" target="_blank" class="card-btn-abrir">Abrir</a>
                ${thumbUrl ? `<div class="hover-preview"><img src="${thumbUrl}"></div>` : ''}
            </div>
            <button onclick="copiarLink('${url}')" class="card-btn-copiar">Copiar</button>
        </div>
    </div>`;
};

const extrairLinks = (campo, icone) => {
    if(!campo || campo === "---") return "";
    return campo.split(';').map(g => {
        const partes = g.split(',').map(p => p.trim());
        return partes.length >= 2 ? criarCardMaterial(partes[0], partes[1], icone) : "";
    }).join('');
};

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    const outros = listaDaCidade.filter(i => i.nome !== selecionado.nome);
    const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.endereco)}`;
    
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao}</div>`;
    
    if (selecionado.tipo === 'R') {
        html += `<div class="titulo-vitrine-faixa faixa-laranja">${selecionado.nome.toUpperCase()}</div>`;
        html += `<div style="margin-bottom:8px; font-size:0.6rem;">📍 ${selecionado.endereco} <a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a></div>`;
        
        // Dados rápidos (Entrega, Obra, etc)
        html += `<div style="background:#f9f9f9; border:1px solid #ddd; border-radius:4px; font-size:0.65rem; margin-bottom:8px;">
                    <div style="display:flex; border-bottom:1px solid #ddd; padding:4px;">
                        <div style="flex:1;"><b>Entrega:</b> ${selecionado.entrega}</div>
                        <div style="flex:1;"><b>Obra:</b> ${selecionado.obra}%</div>
                    </div>
                    <div style="display:flex; padding:4px;">
                        <div style="flex:1;"><b>Estoque:</b> ${selecionado.estoque}</div>
                        <div style="flex:1;"><b>C. Paulista:</b> ${selecionado.casa_paulista}</div>
                    </div>
                 </div>`;

        let mat = criarCardMaterial('Book Cliente', selecionado.linkCliente, '📄') + 
                  criarCardMaterial('Book Corretor', selecionado.linkCorretor, '💼') + 
                  extrairLinks(selecionado.linksVideos, '🎬') + 
                  extrairLinks(selecionado.linksPlantas, '📐');
        
        html += mat ? `<div style="margin-top:5px;">${mat}</div>` : "";
    } else {
        html += `<div class="titulo-vitrine-faixa faixa-preta">${selecionado.nomeFull}</div><div class="box-complexo-full">${selecionado.descLonga}</div>`;
    }
    painel.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById("modal-sobre");
    document.getElementById("btn-sobre").onclick = () => modal.style.display = "block";
    document.querySelector(".modal-close").onclick = () => modal.style.display = "none";
});

window.onload = iniciarApp;
