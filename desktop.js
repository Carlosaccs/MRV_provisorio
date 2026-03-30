/* ==========================================================================
   CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
   ========================================================================== */
let DADOS_PLANILHA = [];
let pathAtivo = null;  
let imovelAtivo = null;  
let mapaAtivo = 'GSP'; 

// Mapeamento sincronizado com a estrutura da planilha
const COL = {
    ID: 0, CATEGORIA: 1, ORDEM: 2, 
    NOME: 4, NOME_FULL: 5,  
    ESTOQUE: 6, END: 7, TIPOLOGIAS: 8, ENTREGA: 9, 
    P_DE: 10, P_ATE: 11, OBRA: 12, LIMITADOR: 13, 
    REGIAO: 14, CASA_PAULISTA: 15, CAMPANHA: 16, 
    DESC_LONGA: 18, OBSERVACOES: 19, 
    LOCALIZACAO: 20, MOBILIDADE: 21, CULTURA_LAZER: 22,    
    COMERCIO: 23, SAUDE_EDUCACAO: 24,
    BOOK_CLIENTE: 25, BOOK_CORRETOR: 26,
    LINKS_VIDEOS: 27, LINKS_PLANTAS: 28,  
    LINKS_IMPLANT: 29, LINKS_DIVERSOS: 30,
    ESTANDE: 31 
};

/* ==========================================================================
   INICIALIZAÇÃO E UTILITÁRIOS
   ========================================================================== */
async function iniciarApp() {
    try { await carregarPlanilha(); } catch (err) { console.error(err); }
}

// FUNÇÃO DE SEGURANÇA: Transforma links do Drive em visualização limpa
function formatarLinkSeguro(url) {
    if (!url || url === "---" || url === "" || typeof url !== 'string') return "#";
    let link = url.trim();
    if (link.includes('drive.google.com')) {
        return link.replace(/\/view.*|\/edit.*|\?usp=sharing/g, "") + "/preview";
    }
    return link;
}

function copiarTexto(texto, msg = "Copiado para a área de transferência!") {
    if (!texto || texto === "" || texto === "#") return;
    navigator.clipboard.writeText(texto).then(() => {
        alert(msg);
    }).catch(err => { console.error('Erro ao copiar: ', err); });
}

/* ==========================================================================
   CARREGAMENTO DE DADOS (AGORA USANDO MAPA-SP.JS)
   ========================================================================== */
async function carregarPlanilha() {
    try {
        // Usa a URL_PLANILHA que vem do mapa-SP.js
        const response = await fetch(`${URL_PLANILHA}&cache_buster=${Date.now()}`);
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

            if (!idPath || nomeImovel.length <= 1) return null;

            return {
                id_path: idPath,
                tipo: (colunas[COL.CATEGORIA] || "").toUpperCase().includes('COMPLEXO') ? 'N' : 'R',
                ordem: ordem || 999,
                nome: nomeImovel,
                nomeFull: colunas[COL.NOME_FULL] || nomeImovel,
                estoque: colunas[COL.ESTOQUE],
                endereco: colunas[COL.END] || "",
                entrega: colunas[COL.ENTREGA] || "---",
                obra: colunas[COL.OBRA] || "0",
                tipologiasH: colunas[COL.TIPOLOGIAS] || "", 
                regiao: colunas[COL.REGIAO] || "---",
                p_de: colunas[COL.P_DE] || "---",
                p_ate: colunas[COL.P_ATE] || "---",
                limitador: colunas[COL.LIMITADOR] || "---",
                casa_paulista: colunas[COL.CASA_PAULISTA] || "---",
                campanha: colunas[COL.CAMPANHA] || "",
                observacoes: colunas[COL.OBSERVACOES] || "", 
                descLonga: colunas[COL.DESC_LONGA] || "",
                localizacao: colunas[COL.LOCALIZACAO] || "",
                mobilidade: colunas[COL.MOBILIDADE] || "",
                lazer: colunas[COL.CULTURA_LAZER] || "",
                comercio: colunas[COL.COMERCIO] || "",
                saude: colunas[COL.SAUDE_EDUCACAO] || "",
                linkCliente: colunas[COL.BOOK_CLIENTE] || "",
                linkCorretor: colunas[COL.BOOK_CORRETOR] || "",
                linksVideos: colunas[COL.LINKS_VIDEOS] || "",
                linksPlantas: colunas[COL.LINKS_PLANTAS] || "",
                linksImplant: colunas[COL.LINKS_IMPLANT] || "",
                linksDiversos: colunas[COL.LINKS_DIVERSOS] || "",
                estande: colunas[COL.ESTANDE] || ""
            };
        }).filter(i => i !== null);

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);
        desenharMapas(); gerarListaLateral();
    } catch (e) { console.error("Erro ao carregar:", e); }
}

/* ==========================================================================
   LÓGICA DO MAPA E SELEÇÃO
   ========================================================================== */
function obterHtmlEstoque(valor, tipo) {
    if (tipo === 'N') return "";
    const clean = valor ? valor.toString().toUpperCase().trim() : "";
    if (clean === "VENDIDO" || clean === "0") return `<span style="color:#999; text-decoration:line-through; font-size:9px;">VENDIDO</span>`;
    const num = parseInt(clean);
    if (!isNaN(num)) return `<span style="color:${num < 6 ? '#e31010' : '#666'}; font-size:9px; font-weight:bold;">RESTAM ${num} UN.</span>`;
    return `<span style="color:#666; font-size:9px;">${clean || "CONSULTAR"}</span>`;
}

function detectarClasseZona(nome) {
    const n = nome.toUpperCase();
    if (n.startsWith("ZO ")) return "btn-zo";
    if (n.startsWith("ZL ")) return "btn-zl";
    if (n.startsWith("ZN ")) return "btn-zn";
    if (n.startsWith("ZS ")) return "btn-zs";
    return ""; 
}

function navegarVitrine(nome) { 
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome);
    if (!imovel) return;
    comandoSelecao(imovel.id_path, null, imovel); 
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
    
    atualizarTituloSuperior(nomeOficial);
    montarVitrine(selecionado, imoveisDaCidade, nomeOficial);
}

function atualizarTituloSuperior(texto) {
    const titulo = document.getElementById('cidade-titulo');
    if (texto) { titulo.innerText = `MRV EM ${texto.toUpperCase()}`; } 
    else if (pathAtivo) {
        const todosPaths = MAPA_GSP.paths.concat(MAPA_INTERIOR.paths);
        const nomeFixo = todosPaths.find(p => p.id.toLowerCase().replace(/\s/g, '') === pathAtivo)?.name || "";
        titulo.innerText = `MRV EM ${nomeFixo.toUpperCase()}`;
    } else { titulo.innerText = "SELECIONE UMA REGIÃO NO MAPA"; }
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    container.style.display = "flex"; container.style.alignItems = "center";
    container.style.justifyContent = "center"; container.style.overflow = "hidden";

    const pathsHtml = dados.paths.map(p => {
        const idNorm = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idNorm);
        const ativo = (pathAtivo === idNorm && interativo) ? 'ativo' : '';
        const isGSP = idNorm === "grandesaopaulo";
        let eventos = "";
        if (interativo) {
            if (isGSP) { eventos = `onclick="trocarMapas(true)" onmouseover="atualizarTituloSuperior('GRANDE SÃO PAULO')" onmouseout="atualizarTituloSuperior()"`; } 
            else { eventos = `onclick="comandoSelecao('${p.id}')" onmouseover="atualizarTituloSuperior('${p.name}')" onmouseout="atualizarTituloSuperior()"`; }
        }
        return `<path id="${id}-${idNorm}" d="${p.d}" class="${(temMRV || isGSP) && interativo ? 'commrv '+ativo : ''}" ${eventos}></path>`;
    }).join('');

    const escala = (mapaAtivo === 'GSP' && interativo) ? 'transform: scale(1.25); transform-origin: center;' : '';

    container.innerHTML = `
        <svg viewBox="${dados.viewBox}" preserveAspectRatio="xMidYMid meet" style="width:100%; height:100%; ${escala}">
            <g transform="${dados.transform || ''}">
                ${pathsHtml}
            </g>
        </svg>`;
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

function gerarListaLateral() {
    const container = document.getElementById('lista-imoveis');
    container.innerHTML = DADOS_PLANILHA.map(item => {
        const ativo = item.nome === imovelAtivo ? 'ativo' : '';
        const classeZona = detectarClasseZona(item.nome); 
        
        return `<div class="${item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes'} ${ativo} ${classeZona}" onclick="navegarVitrine('${item.nome}')">
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
        <div class="card-material-left">
            <span class="card-icon">${icone}</span>
            <span class="card-text">${titulo.toUpperCase()}</span>
        </div>
        <div class="card-material-right">
            <button onclick="window.open('${linkSeguro}','_blank')" class="card-btn-abrir">ABRIR</button>
            <button onclick="copiarTexto('${linkSeguro}')" class="card-btn-copiar">COPIAR</button>
        </div>
    </div>`;
};

const extrairLinks = (campo, icone) => {
    if(!campo || campo === "---" || !campo.includes(",")) return "";
    let htmlTemp = "";
    const grupos = campo.split(';');
    grupos.forEach(g => {
        const partes = g.split(',');
        if(partes.length >= 2) htmlTemp += criarCardMaterial(partes[0].trim(), partes[1].trim(), icone);
    });
    return htmlTemp;
};

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    const outros = listaDaCidade.filter(i => i.nome !== selecionado.nome);
    const urlMapsResidencial = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.endereco)}`;
    
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao}</div>`;
    
    if(outros.length > 0) {
        html += `<div style="margin-bottom:6px; display:flex; flex-direction:column; gap:2px;">${outros.map(i => {
            const classeZ = detectarClasseZona(i.nome);
            return `<button class="${i.tipo === 'N' ? 'separador-complexo-btn' : 'btRes'} ${classeZ}" style="width:100%;" onclick="navegarVitrine('${i.nome}')">
                <strong>${i.nome}</strong> ${obterHtmlEstoque(i.estoque, i.tipo)}
            </button>`}).join('')}</div><hr style="border:0; border-top:1px solid #eee; margin:6px 0;">`;
    }

    if (selecionado.tipo === 'R') {
        html += `<div class="titulo-vitrine-faixa faixa-laranja">RES. ${selecionado.nome.toUpperCase()}</div>`;
        html += `
        <div style="padding: 5px 0;">
            <div style="font-size:0.75rem; color:#444; display:flex; justify-content:space-between; align-items:center; gap:10px;">
                <span style="flex:1; font-weight:bold;">📍 ${selecionado.endereco.toUpperCase()}</span>
                <div style="display:flex; gap:3px;">
                    <button onclick="window.open('${urlMapsResidencial}','_blank')" class="btn-maps" style="background:#4285F4; border:none; color:white; padding:4px 8px; border-radius:3px; font-size:0.6rem; cursor:pointer; font-weight:bold;">MAPS</button>
                    <button onclick="copiarTexto('${urlMapsResidencial}')" class="btn-maps" style="background:#444; border:none; color:white; padding:4px 8px; border-radius:3px; font-size:0.6rem; cursor:pointer; font-weight:bold;">COPIAR</button>
                </div>
            </div>
        </div>`;

        // Bloco de Informações Rápidas
        html += `<div style="background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; margin-bottom: 8px;">`;
        if(selecionado.campanha && selecionado.campanha !== "---" && selecionado.campanha !== "") {
            html += `<div style="background: #fff5f5; color: #e31010; font-weight: 900; font-size: 0.75rem; text-align: center; padding: 6px; border-bottom: 1px solid #ddd;">${selecionado.campanha.toUpperCase()}</div>`;
        }
        
        const linhaInfo = (l1, v1, l2, v2, borda) => `
            <div style="display: flex; width: 100%; ${borda ? 'border-bottom: 1px solid #ddd;' : ''}">
                <div style="flex: 1; padding: 6px 8px; border-right: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
                    <label style="font-size: 0.55rem; font-weight: bold; color: #008d36;">${l1.toUpperCase()}</label>
                    <strong style="font-size: 0.7rem; color: #333;">${v1}</strong>
                </div>
                <div style="flex: 1; padding: 6px 8px; display: flex; justify-content: space-between; align-items: center;">
                    <label style="font-size: 0.55rem; font-weight: bold; color: #008d36;">${l2.toUpperCase()}</label>
                    <strong style="font-size: 0.7rem; color: #333;">${v2}</strong>
                </div>
            </div>`;
        
        html += linhaInfo('Entrega', selecionado.entrega, 'Obra', selecionado.obra + '%', true);
        html += linhaInfo('Plantas', selecionado.p_de + '-' + selecionado.p_ate + 'm²', 'Estoque', (selecionado.estoque || "---"), true);
        html += linhaInfo('Limitador', selecionado.limitador, 'C. Paulista', selecionado.casa_paulista, false);
        html += `</div>`;

        // Tabela de Preços
        if(selecionado.tipologiasH && selecionado.tipologiasH.includes(";")) {
            const linhas = selecionado.tipologiasH.split(';');
            const titulos = linhas[0].split(',');
            const dados = linhas.slice(1);
            html += `
            <div class="tabela-precos-container">
                <div class="tabela-header" style="display:grid; grid-template-columns: 0.6fr 1fr 0.8fr 0.8fr; background:#eee; font-size:0.55rem; font-weight:bold; padding:4px;">
                    ${titulos.map(t => `<div style="text-align:center">${t.toUpperCase()}</div>`).join('')}
                </div>
                ${dados.map(lStr => {
                    const c = lStr.split(',');
                    return `<div style="display:grid; grid-template-columns: 0.6fr 1fr 0.8fr 0.8fr; border-bottom:1px solid #eee; padding:4px; font-size:0.65rem; align-items:center;">
                        <div style="font-weight:bold">${c[0]}</div>
                        <div style="background:#ff8c00; color:white; text-align:center; border-radius:2px; font-weight:bold">${c[1]}</div>
                        <div style="text-align:right; color:#666">${c[2]}</div>
                        <div style="text-align:right; color:#666">${c[3]}</div>
                    </div>`;
                }).join('')}
            </div>`;
        }

        // Diferenciais e Localização
        const criarBoxDiferencial = (label, texto, corBorda) => {
            if(!texto || texto === "---" || texto === "") return "";
            return `
            <div style="margin-top:8px; border-radius: 4px; overflow: hidden; border: 1px solid #ddd; border-left: 5px solid ${corBorda}; background:#fff;">
                <div style="background:#f4f4f4; padding:3px 8px; font-size:0.55rem; font-weight:bold; color:${corBorda}; border-bottom:1px solid #ddd;">${label.toUpperCase()}</div>
                <div style="padding:8px; font-size:0.75rem; color:#444; line-height:1.3;">${texto.toUpperCase()}</div>
            </div>`;
        };

        html += criarBoxDiferencial('💡 Observação Importante', selecionado.observacoes, '#e31010');
        if(selecionado.estande) html += criarBoxDiferencial('📍 Estande de Vendas', selecionado.estande, '#2e7d32');
        html += criarBoxDiferencial('📍 Localização', selecionado.localizacao, '#f37021');
        html += criarBoxDiferencial('🚍 Mobilidade', selecionado.mobilidade, '#2e7d32');
        html += criarBoxDiferencial('🎭 Cultura e Lazer', selecionado.lazer, '#1565c0');
        html += criarBoxDiferencial('🛒 Comércio', selecionado.comercio, '#c62828');
        html += criarBoxDiferencial('🏥 Saúde e Educação', selecionado.saude, '#6a1b9a');

        // Materiais
        let mats = "";
        mats += criarCardMaterial('Book Cliente', selecionado.linkCliente, '📄');
        mats += criarCardMaterial('Book Corretor', selecionado.linkCorretor, '💼');
        mats += extrairLinks(selecionado.linksVideos, '🎬');
        mats += extrairLinks(selecionado.linksPlantas, '📐');
        mats += extrairLinks(selecionado.linksImplant, '📍');
        mats += extrairLinks(selecionado.linksDiversos, '✨');
        
        if (mats !== "") {
            html += `<div style="margin-top: 15px; border-top: 1px solid #ddd; padding-top:10px;">
                <label style="display:block; font-size:0.6rem; font-weight:bold; color:#888; margin-bottom:5px;">MATERIAIS DE APOIO</label>
                ${mats}
            </div>`;
        }
    } else {
        // --- VISUAL PARA COMPLEXO (TIPO N) ---
        html += `<div class="titulo-vitrine-faixa faixa-preta">${selecionado.nomeFull.toUpperCase()}</div>`;
        html += `<div style="padding:10px; background:#f9f9f9; border-radius:4px; font-size:0.8rem; color:#444; line-height:1.5; text-align:justify; margin-bottom:10px;">${selecionado.descLonga}</div>`;
        html += extrairLinks(selecionado.linksImplant, '📍');
    }
    painel.innerHTML = html;
}

/* ==========================================================================
   LÓGICA DO MODAL (SOBRE) E WINDOW LOAD
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById("modal-sobre");
    const btn = document.getElementById("btn-sobre");
    const span = document.querySelector(".modal-close");
    if(btn && modal) btn.onclick = () => { modal.style.display = "block"; };
    if(span && modal) span.onclick = () => { modal.style.display = "none"; };
    window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };
});

window.onload = iniciarApp;
