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

/* LISTA LATERAL SEM ESTOQUE */
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
   CONSTRUÇÃO DA VITRINE (FICHA TÉCNICA) - COMPLETA
   ========================================================================== */
const criarCardMaterial = (titulo, url, icone) => {
    if (!url || url === "" || url === "---") return "";
    const linkSeguro = formatarLinkSeguro(url);
    const fileId = obterIdDrive(url);
    const thumbUrl = fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w300` : "";

    return `
    <div class="card-material-item">
        <div class="card-material-left">
            <span class="card-icon">${icone}</span>
            <span class="card-text">${titulo}</span>
        </div>
        <div class="card-material-right">
            <div class="container-btn-abrir">
                <a href="${linkSeguro}" target="_blank" class="card-btn-abrir">Abrir</a>
                ${thumbUrl ? `<div class="hover-preview"><img src="${thumbUrl}" alt="Preview"></div>` : ''}
            </div>
            <button onclick="copiarLink('${url}')" class="card-btn-copiar">Copiar</button>
        </div>
    </div>`;
};

const extrairLinks = (campo, icone) => {
    if(!campo || campo === "---") return "";
    let htmlTemp = "";
    const grupos = campo.split(';').map(g => g.trim()).filter(g => g !== "");
    grupos.forEach(g => {
        const partes = g.split(',').map(p => p.trim());
        if(partes.length >= 2) htmlTemp += criarCardMaterial(partes[0], partes[1], icone);
    });
    return htmlTemp;
};

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    const outros = listaDaCidade.filter(i => i.nome !== selecionado.nome);
    const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.endereco)}`;
    
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao}</div>`;
    
    if(outros.length > 0) {
        html += `<div style="margin-bottom:6px;">${outros.map(i => `
            <button class="${i.tipo === 'N' ? 'separador-complexo-btn' : 'btRes'}" style="width:100%; height:40px; margin-bottom:4px;" onclick="navegarVitrine('${i.nome}')">
                <strong>${i.nome}</strong>
            </button>`).join('')}</div><hr style="border:0; border-top:1px solid #eee; margin:6px 0;">`;
    }

    if (selecionado.tipo === 'R') {
        html += `<div class="titulo-vitrine-faixa faixa-laranja">RES. ${selecionado.nome.toUpperCase()} — ${selecionado.regiao}</div>`;
        html += `<div style="padding: 2px 0 5px 0;"><p style="font-size:0.65rem; color:#444; display:flex; justify-content:space-between; align-items:center; margin:0;"><span>📍 ${selecionado.endereco}</span><a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a></p></div>`;
        html += `<div style="background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; margin-bottom: 4px;">`;
        
        const linhaInfo = (l1, v1, l2, v2, borda) => `
            <div style="display: flex; width: 100%; ${borda ? 'border-bottom: 1px solid #ddd;' : ''}">
                <div style="flex: 1; padding: 4px 8px; border-right: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
                    <label style="font-size: 0.55rem; font-weight: bold; color: #008d36; text-transform: uppercase;">${l1}</label>
                    <strong style="font-size: 0.65rem; color: #333;">${v1}</strong>
                </div>
                <div style="flex: 1; padding: 4px 8px; display: flex; justify-content: space-between; align-items: center;">
                    <label style="font-size: 0.55rem; font-weight: bold; color: #008d36; text-transform: uppercase;">${l2}</label>
                    <strong style="font-size: 0.65rem; color: #333;">${v2}</strong>
                </div>
            </div>`;
        html += linhaInfo('Entrega', selecionado.entrega, 'Obra', selecionado.obra + '%', true);
        html += linhaInfo('Estoque', (selecionado.estoque || "---") + ' UN.', 'C. Paulista', selecionado.casa_paulista, false);
        html += `</div>`;

        if(selecionado.tipologiasH) {
            const linhas = selecionado.tipologiasH.split(';').map(l => l.trim()).filter(l => l !== "");
            if(linhas.length > 0) {
                const titulos = linhas[0].split(',').map(t => t.trim());
                html += `<div class="tabela-precos-container"><div class="tabela-header">${titulos.map((t, idx) => `<div class="col-tabela" style="${idx === 1 ? 'background:#ff8c00;color:white;' : ''}">${t}</div>`).join('')}</div>
                <div class="tabela-corpo">${linhas.slice(1).map(lStr => {
                    const cs = lStr.split(',').map(c => c.trim()); if(cs.length <= 1) return "";
                    return `<div class="tabela-row">${cs.map((v, i) => `<div class="col-tabela" style="${i === 1 ? 'background:#ff8c00;color:white;' : ''}">${i === 0 ? `<strong>${v}</strong>` : v}</div>`).join('')}</div>`;
                }).join('')}</div></div>`;
            }
        }

        const boxDif = (lb, tx, cf, cb, bd) => {
            if(!tx || tx === "---") return "";
            return `<div style="background:${cf}; border-left:6px solid ${cb}; padding:6px 10px; ${bd ? 'border-bottom:1px solid #ddd;' : ''}"><label style="display:block; font-size:0.55rem; font-weight:bold; color:${cb}; text-transform:uppercase;">${lb}</label><p style="margin:0; font-size:0.68rem; color:#444;">${tx}</p></div>`;
        };
        html += `<div style="border:1px solid #ddd; border-radius:4px; overflow:hidden;">${boxDif('💡 Observação', selecionado.observacoes, '#fff9c4', '#fbc02d', true)}${boxDif('📍 Localização', selecionado.localizacao, '#fdf2e9', '#f37021', true)}</div>`;

        let mat = criarCardMaterial('Book Cliente', selecionado.linkCliente, '📄') + criarCardMaterial('Book Corretor', selecionado.linkCorretor, '💼') + extrairLinks(selecionado.linksVideos, '🎬');
        if(mat) html += `<div style="margin-top:10px;"><label style="display:block; font-size:0.6rem; font-weight:bold; color:#888; border-bottom:1px solid #eee; margin-bottom:4px;">MATERIAIS</label>${mat}</div>`;
    }
    painel.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById("modal-sobre");
    const btn = document.getElementById("btn-sobre");
    const span = document.querySelector(".modal-close");
    if(btn) btn.onclick = () => { if(modal) modal.style.display = "block"; };
    if(span) span.onclick = () => { if(modal) modal.style.display = "none"; };
});

window.onload = iniciarApp;
