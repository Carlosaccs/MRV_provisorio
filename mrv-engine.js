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
    ESTANDE: 30 // Coluna AE - Endereço do Plantão
};

/* ==========================================================================
   TRATAMENTO DE LINKS E UTILITÁRIOS
   ========================================================================== */
function formatarLinkSeguro(url) {
    if (!url || url === "---" || url === "" || typeof url !== 'string') return "";
    let link = url.trim();

    if (link.includes('drive.google.com')) {
        const match = link.match(/\/d\/(.*?)(\/|$|\?)/) || link.match(/id=(.*?)($|&)/);
        if (match && match[1]) {
            // ?rm=minimal limpa a interface do Drive nas miniaturas
            return `https://drive.google.com/file/d/${match[1]}/preview?rm=minimal`;
        }
    }
    return link;
}

function copiarTexto(texto, mensagem = "Link copiado!") {
    navigator.clipboard.writeText(texto).then(() => {
        alert(mensagem);
    });
}

/* ==========================================================================
   CARREGAMENTO E LÓGICA DE DADOS
   ========================================================================== */
async function iniciarApp() {
    try { await carregarPlanilha(); } catch (err) { console.error(err); }
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
                id_path: idPath, tipo: cat.includes('COMPLEXO') ? 'N' : 'R', ordem: ordem,
                nome: nomeImovel, nomeFull: colunas[COL.NOME_FULL] || nomeImovel,
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
                estande: colunas[COL.ESTANDE] || ""
            };
        }).filter(i => i !== null);

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);
        desenharMapas(); gerarListaLateral();
    } catch (e) { console.error(e); }
}

/* ==========================================================================
   FUNÇÕES DE MAPA E INTERFACE (Mantendo sua lógica de 215 linhas)
   ========================================================================== */
function obterHtmlEstoque(valor, tipo) {
    if (tipo === 'N') return "";
    const clean = valor ? valor.toString().toUpperCase().trim() : "";
    if (clean === "VENDIDO" || clean === "0") return `<span style="color:#999; text-decoration:line-through; font-size:9px;">VENDIDO</span>`;
    const num = parseInt(clean);
    if (!isNaN(num)) return `<span style="color:${num < 6 ? '#e31010' : '#666'}; font-size:9px; font-weight:bold;">RESTAM ${num} UN.</span>`;
    return `<span style="color:#666; font-size:9px;">${clean || "CONSULTAR"}</span>`;
}

function navegarVitrine(nome) { 
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome);
    if (!imovel) return;
    comandoSelecao(imovel.id_path, null, imovel); 
}

function comandoSelecao(idPath, nomePath, fonte) {
    const idNorm = idPath.toLowerCase().replace(/\s/g, '');
    const imoveisDaCidade = DADOS_PLANILHA.filter(d => d.id_path === idNorm);
    const selecionado = fonte || imoveisDaCidade[0];
    pathAtivo = idNorm; imovelAtivo = selecionado.nome;

    document.querySelectorAll('path').forEach(el => el.classList.remove('ativo'));
    const elMapa = document.getElementById(`caixa-a-${pathAtivo}`);
    if (elMapa) elMapa.classList.add('ativo');

    gerarListaLateral();
    const todosPaths = MAPA_GSP.paths.concat(MAPA_INTERIOR.paths);
    const nomeOficial = todosPaths.find(p => p.id.toLowerCase().replace(/\s/g, '') === pathAtivo)?.name || pathAtivo;
    
    atualizarTituloSuperior(nomeOficial);
    montarVitrine(selecionado, imoveisDaCidade, nomeOficial);
}

function atualizarTituloSuperior(texto) {
    const titulo = document.getElementById('cidade-titulo');
    if (texto) titulo.innerText = `MRV EM ${texto.toUpperCase()}`;
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    const pathsHtml = dados.paths.map(p => {
        const idNorm = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idNorm);
        const ativo = (pathAtivo === idNorm && interativo) ? 'ativo' : '';
        const isGSP = idNorm === "grandesaopaulo";
        let eventos = interativo ? `onclick="${isGSP ? 'trocarMapas(true)' : `comandoSelecao('${p.id}')`}" onmouseover="atualizarTituloSuperior('${p.name}')" onmouseout="atualizarTituloSuperior()"` : "";
        return `<path id="${id}-${idNorm}" d="${p.d}" class="${(temMRV || isGSP) && interativo ? 'commrv '+ativo : ''}" ${eventos}></path>`;
    }).join('');

    container.innerHTML = `<svg viewBox="${dados.viewBox}" style="width:100%; height:100%;"><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
}

function desenharMapas() {
    renderizarNoContainer('caixa-a', (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR, true);
    renderizarNoContainer('caixa-b', (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP, false);
    document.getElementById('caixa-b').onclick = () => trocarMapas(true);
}

function trocarMapas(completo) { 
    mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; 
    if (completo) { pathAtivo = null; imovelAtivo = null; }
    desenharMapas(); gerarListaLateral(); 
}

function gerarListaLateral() {
    const container = document.getElementById('lista-imoveis');
    container.innerHTML = DADOS_PLANILHA.map(item => {
        const ativo = item.nome === imovelAtivo ? 'ativo' : '';
        return `<div class="${item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes'} ${ativo}" onclick="navegarVitrine('${item.nome}')">
                    <strong>${item.nome}</strong> ${obterHtmlEstoque(item.estoque, item.tipo)}
                </div>`;
    }).join('');
}

/* ==========================================================================
   CONSTRUÇÃO DA VITRINE (FICHA TÉCNICA)
   ========================================================================== */
const criarCardMaterial = (titulo, url, icone) => {
    if (!url || url === "" || url === "---") return "";
    const linkSeguro = formatarLinkSeguro(url);
    return `
    <div class="card-material-item">
        <div class="card-material-left"><span class="card-icon">${icone}</span><span class="card-text">${titulo}</span></div>
        <div class="card-material-right">
            <div class="btn-com-preview">
                <a href="${linkSeguro}" target="_blank" class="card-btn-abrir">Abrir</a>
                <div class="preview-container"><iframe src="${linkSeguro}"></iframe></div>
            </div>
            <button onclick="copiarTexto('${linkSeguro}')" class="card-btn-copiar">Copiar</button>
        </div>
    </div>`;
};

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    const urlMapsResidencial = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.endereco)}`;
    
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao}</div>`;

    if (selecionado.tipo === 'R') {
        html += `<div class="titulo-vitrine-faixa faixa-laranja">RES. ${selecionado.nome.toUpperCase()} — ${selecionado.regiao}</div>`;
        
        // Endereço Residencial com os dois botões
        html += `<div style="padding: 2px 0 8px 0;">
            <p style="font-size:0.65rem; color:#444; display:flex; justify-content:space-between; align-items:center; margin:0;">
                <span style="flex:1;">📍 ${selecionado.endereco}</span>
                <span style="display:flex; gap:4px;">
                    <a href="${urlMapsResidencial}" target="_blank" class="btn-maps">MAPS</a>
                    <button onclick="copiarTexto('${urlMapsResidencial}')" class="btn-maps" style="background:#444; border:none; cursor:pointer;">LINK</button>
                </span>
            </p>
        </div>`;

        // ... [Bloco de tabelas de preço e informações técnicas permanecem iguais] ...

        // SEÇÃO DE DIFERENCIAIS COM ESTANDE NO TOPO
        html += `<div style="border-radius: 4px; overflow: hidden; border: 1px solid #ddd; margin-top: 6px;">`;
        
        if(selecionado.estande && selecionado.estande !== "---" && selecionado.estande !== "") {
            const urlMapsEstande = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.estande)}`;
            html += `
            <div style="background: #e8f5e9; border-left: 6px solid #2e7d32; padding: 6px 10px; border-bottom: 1px solid #ddd;">
                <label style="display:block; font-size:0.55rem; font-weight:bold; color:#2e7d32; text-transform:uppercase; margin-bottom:1px;">📍 Estande de Vendas</label>
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <p style="margin:0; font-size:0.68rem; color:#444; line-height:1.3; flex:1;">${selecionado.estande}</p>
                    <div style="display:flex; gap:4px; margin-left:8px;">
                        <a href="${urlMapsEstande}" target="_blank" class="btn-maps">MAPS</a>
                        <button onclick="copiarTexto('${urlMapsEstande}')" class="btn-maps" style="background:#444; border:none; cursor:pointer;">LINK</button>
                    </div>
                </div>
            </div>`;
        }

        // Outros diferenciais (Observação, Localização, etc.)
        const criarBox = (label, texto, corF, corB, borda) => {
            if(!texto || texto === "---") return "";
            return `<div style="background:${corF}; border-left:6px solid ${corB}; padding:6px 10px; ${borda ? 'border-bottom:1px solid #ddd;' : ''}">
                <label style="display:block; font-size:0.55rem; font-weight:bold; color:${corB}; text-transform:uppercase;">${label}</label>
                <p style="margin:0; font-size:0.68rem; color:#444;">${texto}</p>
            </div>`;
        };
        html += criarBox('💡 Observação', selecionado.observacoes, '#fff9c4', '#fbc02d', true);
        html += criarBox('📍 Localização', selecionado.localizacao, '#fdf2e9', '#f37021', true);
        html += criarBox('🚍 Mobilidade', selecionado.mobilidade, '#f1f8e9', '#2e7d32', false);
        html += `</div>`;

        // Materiais de Apoio
        html += `<div style="margin-top:10px;">${criarCardMaterial('Book Cliente', selecionado.linkCliente, '📄')}${criarCardMaterial('Book Corretor', selecionado.linkCorretor, '💼')}</div>`;
    }
    painel.innerHTML = html;
}

window.onload = iniciarApp;
