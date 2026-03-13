let DADOS_PLANILHA = [];
let mapaAtivo = 'GSP';

const COL = {
    ID: 0, CATEGORIA: 1, ORDEM: 2, NOME: 3, NOME_FULL: 4, 
    ESTOQUE: 5, END: 6, TIPOLOGIAS: 7, ENTREGA: 8, 
    P_DE: 9, P_ATE: 10, OBRA: 11, LIMITADOR: 12, 
    REGIAO: 13, CASA_PAULISTA: 14, DOCUMENTOS: 15, 
    DICA: 16, DESC_LONGA: 17, CAMPANHA: 15
};

async function iniciarApp() {
    // Garante que o container não fique branco
    const f = document.getElementById('ficha-tecnica');
    if(f) f.innerHTML = `<div style="text-align:center; color:#ccc; margin-top:100px;"><p style="font-size: 30px;">📍</p><p>Carregando dados...</p></div>`;
    
    await carregarPlanilha();
}

async function carregarPlanilha() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0&v=${new Date().getTime()}`;
    
    try {
        const response = await fetch(URL_CSV);
        const texto = await response.text();
        const linhas = texto.split(/\r?\n/);

        DADOS_PLANILHA = linhas.slice(1).map(linha => {
            const col = linha.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/); // Split por vírgula respeitando aspas
            return {
                id_path: col[COL.ID] ? col[COL.ID].toLowerCase().replace(/\s/g, '').trim() : "",
                tipo: (col[COL.CATEGORIA] || "").toUpperCase().includes('COMPLEXO') ? 'N' : 'R',
                ordem: parseInt(col[COL.ORDEM]) || 999,
                nome: col[COL.NOME] || "",
                nomeFull: col[COL.NOME_FULL] || col[COL.NOME] || "",
                estoque: col[COL.ESTOQUE] || "",
                endereco: col[COL.END] || "",
                entrega: col[COL.ENTREGA] || "---",
                obra: col[COL.OBRA] || "0",
                regiao: col[COL.REGIAO] || "---",
                p_de: col[COL.P_DE] || "---",
                p_ate: col[COL.P_ATE] || "---",
                limitador: col[COL.LIMITADOR] || "---",
                casa_paulista: col[COL.CASA_PAULISTA] || "---",
                campanha: col[COL.CAMPANHA] || "",
                descLonga: col[COL.DESC_LONGA] || ""
            };
        }).filter(i => i.nome.length > 2);

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);
        
        gerarListaLateral();
        desenharMapas();
        resetTitulo();
    } catch (e) { 
        console.error("Erro CSV:", e); 
        document.getElementById('ficha-tecnica').innerHTML = "Erro ao carregar dados.";
    }
}

function gerarListaLateral() {
    const container = document.querySelector('.sidebar-esq');
    if (!container) return;
    
    container.innerHTML = DADOS_PLANILHA.map(item => {
        const classe = item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes';
        return `<div class="${classe}" data-nome="${item.nome}" onclick="navegarVitrine('${item.nome}', '${item.regiao}')">
                    <strong>${item.nome}</strong>
                    ${item.tipo === 'R' ? obterHtmlEstoque(item.estoque) : ''}
                </div>`;
    }).join('');
}

function desenharMapas() {
    renderizarNoContainer('caixa-a', (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR, true);
    renderizarNoContainer('caixa-b', (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP, false);
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container || !dados) return;

    const pathsHtml = dados.paths.map(p => {
        const idNorm = p.id.toLowerCase().replace(/\s/g, '').trim();
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idNorm);
        const isGSP = idNorm === "grandesaopaulo";
        
        let classe = (temMRV || isGSP) && interativo ? 'commrv' : '';
        const acoes = interativo ? 
            `onclick="cliqueNoMapa('${p.id}', '${p.name}', ${temMRV || isGSP})"` : 
            `onclick="trocarMapas()"`;

        return `<path id="path-${idNorm}" data-id="${idNorm}" name="${p.name}" d="${p.d}" class="${classe}" ${acoes} onmouseover="hoverNoMapa('${p.name}')" onmouseout="resetTitulo()"></path>`;
    }).join('');

    container.innerHTML = `<svg viewBox="${dados.viewBox}" style="width:100%; height:100%;"><g>${pathsHtml}</g></svg>`;
}

function comandoSelecao(idPath, nomeRegiao, imovelManual) {
    const idNorm = idPath.toLowerCase().replace(/\s/g, '').trim();
    
    // 1. Limpa destaques anteriores
    document.querySelectorAll('.ativo').forEach(el => el.classList.remove('ativo'));

    // 2. Destaca no Mapa
    const elMapa = document.getElementById(`path-${idNorm}`);
    if (elMapa) elMapa.classList.add('ativo');

    // 3. Destaca na Lista Lateral
    const imovelAlvo = imovelManual || DADOS_PLANILHA.find(d => d.id_path === idNorm);
    if (imovelAlvo) {
        const elLista = document.querySelector(`[data-nome="${imovelAlvo.nome}"]`);
        if (elLista) elLista.classList.add('ativo');
        
        document.getElementById('cidade-titulo').innerText = nomeRegiao || imovelAlvo.regiao;
        montarVitrine(imovelAlvo, DADOS_PLANILHA.filter(d => d.id_path === idNorm), nomeRegiao || imovelAlvo.regiao);
    }
}

function navegarVitrine(nome, regiao) {
    const imovel = DADOS_PLANILHA.find(i => i.nome === nome);
    if (imovel) comandoSelecao(imovel.id_path, regiao, imovel);
}

function cliqueNoMapa(id, nome, tem) {
    if (id.toLowerCase() === "grandesaopaulo") { trocarMapas(); return; }
    if (tem) comandoSelecao(id, nome);
}

function trocarMapas() {
    mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP';
    desenharMapas();
    limparInterface();
}

function limparInterface() {
    document.getElementById('cidade-titulo').innerText = "Selecione uma região";
    document.getElementById('ficha-tecnica').innerHTML = `<div style="text-align:center; color:#ccc; margin-top:100px;"><p style="font-size: 30px;">📍</p><p>Clique em algum Residencial ou em alguma região verde do mapa</p></div>`;
}

function hoverNoMapa(nome) { document.getElementById('cidade-titulo').innerText = nome; }
function resetTitulo() { document.getElementById('cidade-titulo').innerText = "Selecione uma região"; }

function obterHtmlEstoque(v) {
    const n = parseInt(v);
    if (isNaN(n) || n === 0) return `<span class="badge-estoque">VENDIDO</span>`;
    return `<span class="badge-estoque" style="color:${n < 6 ? 'red' : '#666'}">RESTAM ${n} UN.</span>`;
}

// Inicializa
iniciarApp();
