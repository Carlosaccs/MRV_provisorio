let DADOS_PLANILHA = [];
let pathSelecionado = null; 
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

const COL = {
    ID: 0, CATEGORIA: 1, ORDEM: 2, NOME: 3, NOME_FULL: 4, 
    ESTOQUE: 5, END: 6, ENTREGA: 8, P_DE: 9, P_ATE: 10, 
    OBRA: 11, LIMITADOR: 12, REGIAO: 13, CASA_PAULISTA: 14, 
    CAMPANHA: 15, DESC_LONGA: 17
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
        const linhas = texto.split('\n').slice(1);

        DADOS_PLANILHA = linhas.map(linha => {
            const c = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.replace(/"/g, '').trim());
            return {
                id_path: (c[COL.ID] || "").toLowerCase().replace(/\s/g, ''),
                tipo: (c[COL.CATEGORIA] || "").toUpperCase().includes('COMPLEXO') ? 'N' : 'R',
                ordem: parseInt(c[COL.ORDEM]) || 999,
                nome: c[COL.NOME] || "",
                nomeFull: c[COL.NOME_FULL] || c[COL.NOME] || "",
                endereco: c[COL.END] || "",
                entrega: c[COL.ENTREGA] || "---",
                obra: c[COL.OBRA] || "0",
                regiao: c[COL.REGIAO] || "---",
                p_de: c[COL.P_DE] || "---",
                p_ate: c[COL.P_ATE] || "---",
                limitador: c[COL.LIMITADOR] || "---",
                casa_paulista: c[COL.CASA_PAULISTA] || "---",
                estoque: c[COL.ESTOQUE] || "",
                campanha: c[COL.CAMPANHA] || "",
                descLonga: c[COL.DESC_LONGA] || ""
            };
        }).filter(i => i.nome.length > 2).sort((a,b) => a.ordem - b.ordem);

        gerarListaLateral(); // CORREÇÃO: Chama a função que popula a esquerda
        desenharMapas();
    } catch (e) { console.error("Erro CSV:", e); }
}

function gerarListaLateral() {
    const container = document.querySelector('.sidebar-esq');
    if (!container) return;
    
    container.innerHTML = DADOS_PLANILHA.map(item => {
        const classe = item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes';
        return `<div class="${classe}" onclick="navegarVitrine('${item.nome}', '${item.regiao}')">
                    <strong>${item.nome}</strong>
                    ${item.tipo === 'R' ? obterHtmlEstoque(item.estoque, 'R') : ''}
                </div>`;
    }).join('');
}

function obterHtmlEstoque(valor, tipo) {
    if (tipo === 'N') return "";
    const clean = valor.toUpperCase();
    if (clean === "" || clean === "CONSULTAR") return `<span class="badge-estoque" style="color:#666">CONSULTAR</span>`;
    if (clean === "VENDIDO" || clean === "0") return `<span class="badge-estoque" style="color:#999; text-decoration:line-through;">VENDIDO</span>`;
    const num = parseInt(clean);
    const cor = num < 6 ? "#e31010" : "#666";
    return `<span class="badge-estoque" style="color:${cor}">${isNaN(num) ? clean : 'RESTAM ' + num + ' UN.'}</span>`;
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container || !dados) return;
    
    const pathsHtml = dados.paths.map(p => {
        const idNorm = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idNorm);
        const isAtivo = pathSelecionado === idNorm && interativo;
        
        return `<path id="${id}-${idNorm}" 
                d="${p.d}" 
                class="${temMRV ? 'commrv' : ''} ${isAtivo ? 'ativo' : ''}" 
                onclick="${interativo ? `cliqueNoMapa('${p.id}', '${p.name}', ${temMRV})` : 'trocarMapas()'}"
                onmouseover="${interativo ? `hoverNoMapa('${p.name}')` : ''}" 
                onmouseout="resetTitulo()"></path>`;
    }).join('');
    
    container.innerHTML = `<svg viewBox="${dados.viewBox}"><g>${pathsHtml}</g></svg>`;
}

function comandoSelecao(idPath, nomePath, fonte) {
    pathSelecionado = idPath.toLowerCase().replace(/\s/g, '');
    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === pathSelecionado);
    
    desenharMapas(); // Atualiza o laranja no mapa
    
    if (imoveis.length > 0) {
        const selecionado = fonte || imoveis[0];
        nomeSelecionado = nomePath || selecionado.regiao;
        document.getElementById('cidade-titulo').innerText = nomeSelecionado;
        montarVitrine(selecionado, imoveis, nomeSelecionado);
    }
}

function montarVitrine(sel, lista, regiao) {
    const painel = document.getElementById('ficha-tecnica');
    let html = `<div class="vitrine-topo">MRV EM ${regiao.toUpperCase()}</div><div class="vitrine-scroll">`;
    
    html += lista.map(item => `
        <button class="btRes ${item.nome === sel.nome ? 'ativo' : ''}" onclick="navegarVitrine('${item.nome}', '${regiao}')">
            <strong>${item.nome}</strong> ${obterHtmlEstoque(item.estoque, item.tipo)}
        </button>
    `).join('');

    if (sel.tipo === 'R') {
        html += `<hr><div style="background:var(--mrv-laranja); color:white; padding:8px; border-radius:4px; text-align:center; font-weight:bold; margin-top:10px;">RES. ${sel.nome}</div>`;
        html += `<p style="font-size:0.65rem; margin:10px 0;">📍 ${sel.endereco} <a href="https://www.google.com/maps/search/${encodeURIComponent(sel.endereco)}" target="_blank" class="btn-maps">MAPS</a></p>`;
        // ... (resto das fileiras de dados mantidas)
    }
    
    html += `</div>`;
    painel.innerHTML = html;
}

function cliqueNoMapa(id, nome, tem) { if(tem) comandoSelecao(id, nome); }
function navegarVitrine(n, r) { const i = DADOS_PLANILHA.find(x => x.nome === n); if(i) comandoSelecao(i.id_path, r, i); }
function hoverNoMapa(n) { document.getElementById('cidade-titulo').innerText = n; }
function resetTitulo() { document.getElementById('cidade-titulo').innerText = nomeSelecionado || "Selecione uma região"; }
function trocarMapas() { mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; pathSelecionado = null; desenharMapas(); }
function desenharMapas() { 
    renderizarNoContainer('caixa-a', mapaAtivo === 'GSP' ? MAPA_GSP : MAPA_INTERIOR, true);
    renderizarNoContainer('caixa-b', mapaAtivo === 'GSP' ? MAPA_INTERIOR : MAPA_GSP, false);
}

iniciarApp();
