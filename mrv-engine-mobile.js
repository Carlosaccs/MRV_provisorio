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

            const nomeImovel = colunas[COL.NOME] || "";
            const idPath = (colunas[COL.ID] || "").toLowerCase().replace(/\s/g, '');
            const ordem = parseInt(colunas[COL.ORDEM]);

            if (!idPath || nomeImovel.length <= 1 || isNaN(ordem)) return null;
            const cat = (colunas[COL.CATEGORIA] || "").toUpperCase();
            
            return {
                id_path: idPath, tipo: cat.includes('COMPLEXO') ? 'N' : 'R',
                ordem: ordem, nome: nomeImovel, nomeFull: colunas[COL.NOME_FULL] || nomeImovel,
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

/* ==========================================================================
   LÓGICA DO MAPA E SELEÇÃO
   ========================================================================== */
function navegarVitrine(nome) { 
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome);
    if (imovel) comandoSelecao(imovel.id_path, null, imovel); 
}

function comandoSelecao(idPath, nomePath, fonte) {
    const idNorm = idPath.toLowerCase().replace(/\s/g, '');
    const noGSP = MAPA_GSP.paths.some(p => p.id.toLowerCase().replace(/\s/g, '') === idNorm);
    const noInterior = MAPA_INTERIOR.paths.some(p => p.id.toLowerCase().replace(/\s/g, '') === idNorm);
    
    if (noGSP && mapaAtivo !== 'GSP') trocarMapas(false);
    if (noInterior && mapaAtivo !== 'INTERIOR') trocarMapas(false);
    
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
        const isGSP = idNorm === "grandesaopaulo";
        let eventos = interativo ? `onclick="${isGSP ? 'trocarMapas(true)' : `comandoSelecao('${p.id}')`}"` : "";
        return `<path id="${id}-${idNorm}" d="${p.d}" class="${(temMRV || isGSP) && interativo ? 'commrv '+ativo : ''}" ${eventos}></path>`;
    }).join('');

    const escala = (mapaAtivo === 'GSP' && interativo) ? 'transform: scale(1.25); transform-origin: center;' : '';
    container.innerHTML = `<svg viewBox="${dados.viewBox}" preserveAspectRatio="xMidYMid meet" style="width:100%; height:100%; ${escala}"><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
}

function desenharMapas() {
    renderizarNoContainer('caixa-a', (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR, true);
    renderizarNoContainer('caixa-b', (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP, false);
    document.getElementById('caixa-b').onclick = () => trocarMapas(true);
}

function trocarMapas(completo) { 
    mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; 
    if (completo) { 
        pathAtivo = null; imovelAtivo = null; 
        document.getElementById('ficha-tecnica').innerHTML = `<div style="text-align:center; color:#ccc; margin-top:80px;"><p style="font-size:30px;">📍</p><p>Clique no mapa ou na lista</p></div>`;
        document.getElementById('cidade-titulo').innerText = "SELECIONE UMA REGIÃO NO MAPA";
    }
    desenharMapas(); gerarListaLateral(); 
}

/* FUNÇÃO ATUALIZADA: REMOVIDO O TEXTO DO ESTOQUE */
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
   CONSTRUÇÃO DA VITRINE (FICHA TÉCNICA) - MANTIDA ORIGINAL
   ========================================================================== */
function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao}</div>`;
    
    if (selecionado.tipo === 'R') {
        html += `<div class="titulo-vitrine-faixa faixa-laranja">RES. ${selecionado.nome.toUpperCase()}</div>`;
        html += `<div style="padding: 10px; background:#f9f9f9; border-radius:8px; border:1px solid #ddd; margin-bottom:10px;">
                    <p style="font-size:0.8rem;">📍 <strong>Endereço:</strong> ${selecionado.endereco}</p>
                    <p style="font-size:0.8rem; color:var(--mrv-verde); margin-top:5px;">🏗️ <strong>Obra:</strong> ${selecionado.obra}% | 🗓️ <strong>Entrega:</strong> ${selecionado.entrega}</p>
                    <p style="font-size:0.9rem; color:var(--mrv-laranja); font-weight:bold; margin-top:5px;">📊 Estoque: ${selecionado.estoque || "---"} UN.</p>
                 </div>`;
        // Restante da ficha técnica...
    }
    painel.innerHTML = html;
}

window.onload = iniciarApp;
