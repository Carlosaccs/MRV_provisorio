let DADOS_PLANILHA = [];
let pathAtivo = null;  
let imovelAtivo = null;  
let mapaAtivo = 'GSP'; 

const COL = {
    ID: 0, CATEGORIA: 1, ORDEM: 2, NOME: 3, NOME_FULL: 4, 
    ESTOQUE: 5, END: 6, TIPOLOGIAS: 7, ENTREGA: 8, 
    P_DE: 9, P_ATE: 10, OBRA: 11, LIMITADOR: 12, 
    REGIAO: 13, CASA_PAULISTA: 14, CAMPANHA: 15, 
    DESC_LONGA: 17, LOCALIZACAO: 19, MOBILIDADE: 20, 
    CULTURA_LAZER: 21, COMERCIO: 22, SAUDE_EDUCACAO: 23,   
    BOOK_CLIENTE: 24, BOOK_CORRETOR: 25     
};

async function iniciarApp() {
    try { await carregarPlanilha(); } catch (err) { console.error(err); }
}

function formatarLinkSeguro(url) {
    if (!url || url === "---") return "";
    return url.includes('drive.google.com') ? url.split('/view')[0] + '/preview' : url;
}

function copiarLink(url) {
    navigator.clipboard.writeText(formatarLinkSeguro(url));
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
                if (linha[i] === '"') aspas = !aspas;
                else if (linha[i] === ',' && !aspas) { colunas.push(campo.trim()); campo = ""; }
                else campo += linha[i];
            }
            colunas.push(campo.trim());
            if (!colunas[COL.NOME]) return null;
            return {
                id_path: colunas[COL.ID].toLowerCase().replace(/\s/g, ''),
                tipo: (colunas[COL.CATEGORIA] || "").toUpperCase().includes('COMPLEXO') ? 'N' : 'R',
                nome: colunas[COL.NOME],
                endereco: colunas[COL.END] || "",
                entrega: colunas[COL.ENTREGA] || "---",
                obra: colunas[COL.OBRA] || "0",
                p_de: colunas[COL.P_DE] || "---",
                p_ate: colunas[COL.P_ATE] || "---",
                estoque: colunas[COL.ESTOQUE] || "0",
                limitador: colunas[COL.LIMITADOR] || "---",
                casa_paulista: colunas[COL.CASA_PAULISTA] || "---",
                campanha: colunas[COL.CAMPANHA] || "",
                tipologiasH: colunas[COL.TIPOLOGIAS] || "",
                localizacao: colunas[COL.LOCALIZACAO] || "",
                mobilidade: colunas[COL.MOBILIDADE] || "",
                lazer: colunas[COL.CULTURA_LAZER] || "",
                comercio: colunas[COL.COMERCIO] || "",
                saude: colunas[COL.SAUDE_EDUCACAO] || "",
                linkCliente: colunas[COL.BOOK_CLIENTE] || "",
                linkCorretor: colunas[COL.BOOK_CORRETOR] || ""
            };
        }).filter(i => i !== null);
        desenharMapas(); gerarListaLateral();
    } catch (e) { console.error(e); }
}

function montarVitrine(selecionado, lista, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao}</div>`;
    html += `<div class="titulo-vitrine-faixa faixa-laranja">RES. ${selecionado.nome}</div>`;
    html += `<p style="font-size:0.65rem; margin-bottom:5px;">📍 ${selecionado.endereco}</p>`;

    if(selecionado.campanha) html += `<div class="box-campanha">${selecionado.campanha}</div>`;

    const fila = (l1, v1, l2, v2) => `
        <table class="grid-infos"><tr>
            <td class="box-argumento"><div class="box-inner"><label>${l1}</label><strong>${v1}</strong></div></td>
            <td class="box-argumento"><div class="box-inner"><label>${l2}</label><strong>${v2}</strong></div></td>
        </tr></table>`;

    html += fila('Entrega', selecionado.entrega, 'Obra', selecionado.obra + '%');
    html += fila('Plantas', selecionado.p_de + ' - ' + selecionado.p_ate, 'Estoque', selecionado.estoque + ' UN.');
    html += fila('Limitador', selecionado.limitador, 'C. Paulista', selecionado.casa_paulista);

    // Tabela de Preços
    if(selecionado.tipologiasH) {
        const linhas = selecionado.tipologiasH.split(';');
        if(linhas.length > 0) {
            const titulos = linhas[0].split(',');
            html += `<div class="tabela-precos-container"><div class="tabela-header">${titulos.map((t, i) => `<div class="col-tabela ${i==1?'col-laranja':''}">${t}</div>`).join('')}</div>`;
            html += linhas.slice(1).map(l => `<div class="tabela-row">${l.split(',').map((v, i) => `<div class="col-tabela ${i==1?'col-laranja':''}">${v}</div>`).join('')}</div>`).join('') + `</div>`;
        }
    }

    // Argumentos Coloridos (Restaurados)
    const criarDestaque = (lab, tex, corB, corF) => tex ? `<div class="box-colorida" style="border-left:4px solid ${corB}; background:${corF}"><label style="color:${corB}">${lab}</label><p>${tex}</p></div>` : "";
    html += criarDestaque('📍 Localização', selecionado.localizacao, '#f37021', '#fdf2e9');
    html += criarDestaque('🚍 Mobilidade', selecionado.mobilidade, '#2e7d32', '#f1f8e9');
    html += criarDestaque('🎭 Lazer', selecionado.lazer, '#1565c0', '#e3f2fd');
    html += criarDestaque('🛒 Comércio', selecionado.comercio, '#c62828', '#ffebee');

    // Materiais
    const card = (tit, url, ico) => {
        if(!url || url === "---") return "";
        const link = formatarLinkSeguro(url);
        return `<div class="card-material-item">
            <div class="card-material-left"><span>${ico}</span><span class="card-text">${tit}</span></div>
            <div class="card-material-right">
                <div class="container-abrir-preview">
                    <a href="${link}" target="_blank" class="card-btn-abrir">Abrir</a>
                    <div class="preview-hover-box"><iframe src="${link}"></iframe></div>
                </div>
                <button onclick="copiarLink('${url}')" class="card-btn-copiar">Copiar</button>
            </div>
        </div>`;
    };

    html += `<div style="margin-top:10px;"><label style="font-size:0.6rem; font-weight:bold; color:#888;">MATERIAIS DE APOIO</label>`;
    html += card('Book Cliente', selecionado.linkCliente, '📄') + card('Book Corretor', selecionado.linkCorretor, '💼') + `</div>`;

    painel.innerHTML = html;
}

// Funções de navegação (omitidas por brevidade, mas devem ser mantidas as do arquivo original)
function navegarVitrine(n) { const i = DADOS_PLANILHA.find(x => x.nome === n); if(i) montarVitrine(i, [], "SÃO PAULO"); }
function gerarListaLateral() { /* ... código da lista lateral ... */ }
function desenharMapas() { /* ... código dos mapas ... */ }
window.onload = iniciarApp;
