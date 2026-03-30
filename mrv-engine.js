/* =============================================================================
   01. CONFIGURAÇÕES E MAPEAMENTO DA PLANILHA
============================================================================= 
*/
let DADOS_PLANILHA = [];
let pathAtivo = null;  
let imovelAtivo = null;  
let mapaAtivo = 'GSP'; 

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

/* =============================================================================
   02. CARREGAMENTO DOS DADOS (GOOGLE SHEETS)
============================================================================= 
*/
async function iniciarApp() {
    try { 
        await carregarPlanilha(); 
    } catch (err) { 
        console.error("Erro ao iniciar:", err);
        document.getElementById('lista-imoveis').innerText = "Erro ao carregar dados.";
    }
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
                id_path: idPath,
                tipo: cat.includes('COMPLEXO') ? 'N' : 'R',
                ordem: ordem,
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
        desenharMapas(); 
        gerarListaLateral();
    } catch (e) { 
        console.error("Erro no CSV:", e); 
    }
}

/* =============================================================================
   03. LÓGICA DE DESENHO E RENDERIZAÇÃO DO MAPA
============================================================================= 
*/
function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container || !dados) return;

    container.innerHTML = ""; // Limpa antes de desenhar
    
    const pathsHtml = dados.paths.map(p => {
        const idNorm = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idNorm);
        const ativo = (pathAtivo === idNorm && interativo) ? 'ativo' : '';
        const isGSP = idNorm === "grandesaopaulo";
        
        let eventos = "";
        if (interativo) {
            if (isGSP) { 
                eventos = `onclick="trocarMapas(true)" onmouseover="atualizarTituloSuperior('GRANDE SÃO PAULO')" onmouseout="atualizarTituloSuperior()"`; 
            } else { 
                eventos = `onclick="comandoSelecao('${p.id}')" onmouseover="atualizarTituloSuperior('${p.name}')" onmouseout="atualizarTituloSuperior()"`; 
            }
        }
        
        return `<path id="${id}-${idNorm}" d="${p.d}" class="${(temMRV || isGSP) && interativo ? 'commrv '+ativo : p.class}" ${eventos}></path>`;
    }).join('');

    // Ajuste de escala: Seus dados pedem um zoom manual para preencher a div cinza
    const scaleFactor = interativo ? 1.18 : 1.0;

    const svgElement = `
        <svg viewBox="${dados.viewBox}" preserveAspectRatio="xMidYMid meet" style="width:100%; height:100%;">
            <g transform="${dados.transform || ''}" style="transform: scale(${scaleFactor}); transform-origin: center;">
                ${pathsHtml}
            </g>
        </svg>`;
    
    container.innerHTML = svgElement;
}

function desenharMapas() {
    const dadosA = (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    const dadosB = (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP;
    
    renderizarNoContainer('caixa-a', dadosA, true);
    renderizarNoContainer('caixa-b', dadosB, false);
    
    document.getElementById('caixa-b').onclick = () => trocarMapas(true);
}

function trocarMapas(completo) { 
    mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; 
    if (completo) { 
        pathAtivo = null; imovelAtivo = null; 
        const painel = document.getElementById('ficha-tecnica');
        if(painel) painel.innerHTML = `<div style="text-align:center; color:#ccc; margin-top:80px;"><p style="font-size:30px;">📍</p><p>Clique no mapa ou na lista</p></div>`;
        document.getElementById('cidade-titulo').innerText = "SELECIONE UMA REGIÃO NO MAPA";
    }
    desenharMapas(); 
    gerarListaLateral(); 
}

/* =============================================================================
   04. LÓGICA DE SELEÇÃO E VITRINE
============================================================================= 
*/
function comandoSelecao(idPath, nomePath, fonte) {
    const idNorm = idPath.toLowerCase().replace(/\s/g, '');
    pathAtivo = idNorm;
    
    const imoveisDaCidade = DADOS_PLANILHA.filter(d => d.id_path === pathAtivo);
    const selecionado = fonte || imoveisDaCidade[0];
    
    if (selecionado) imovelAtivo = selecionado.nome;

    document.querySelectorAll('path').forEach(el => el.classList.remove('ativo'));
    const elA = document.getElementById(`caixa-a-${pathAtivo}`);
    if (elA) elA.classList.add('ativo');

    gerarListaLateral();
    
    const todosPaths = MAPA_GSP.paths.concat(MAPA_INTERIOR.paths);
    const pathObjeto = todosPaths.find(p => p.id.toLowerCase().replace(/\s/g, '') === pathAtivo);
    const nomeOficial = pathObjeto ? pathObjeto.name : pathAtivo;
    
    atualizarTituloSuperior(nomeOficial);
    if (selecionado) montarVitrine(selecionado, imoveisDaCidade, nomeOficial);
}

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    if(!painel) return;
    
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao}</div>`;
    
    if (selecionado.tipo === 'R') {
        html += `<div class="titulo-vitrine-faixa faixa-laranja">RES. ${selecionado.nome.toUpperCase()}</div>`;
        html += `<div style="padding:10px; font-size:0.8rem;">📍 ${selecionado.endereco}</div>`;
        // ... (resto da lógica de vitrine simplificada para garantir o carregamento)
    } else {
        html += `<div class="titulo-vitrine-faixa faixa-preta">${selecionado.nomeFull.toUpperCase()}</div>`;
    }
    
    painel.innerHTML = html;
}

/* =============================================================================
   05. LISTA LATERAL E UTILITÁRIOS
============================================================================= 
*/
function gerarListaLateral() {
    const container = document.getElementById('lista-imoveis');
    if (!container) return;
    container.innerHTML = DADOS_PLANILHA.map(item => {
        const ativo = item.nome === imovelAtivo ? 'ativo' : '';
        return `<div class="btRes ${ativo}" onclick="navegarVitrine('${item.nome}')">
                    <strong>${item.nome}</strong>
                </div>`;
    }).join('');
}

function navegarVitrine(nome) { 
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome);
    if (imovel) comandoSelecao(imovel.id_path, null, imovel); 
}

function atualizarTituloSuperior(texto) {
    const titulo = document.getElementById('cidade-titulo');
    if (titulo) titulo.innerText = texto ? `MRV EM ${texto.toUpperCase()}` : "SELECIONE UMA REGIÃO NO MAPA";
}

window.onload = iniciarApp;
