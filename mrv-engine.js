let DADOS_PLANILHA = [];
let pathSelecionado = null;
let nomeSelecionado = ""; 
let mapaAtivo = 'GSP'; 

const COL = {
    ID: 0, CATEGORIA: 1, ORDEM: 2, NOME: 3, NOME_FULL: 4, 
    ESTOQUE: 5, END: 6, TIPOLOGIAS: 7, ENTREGA: 8, 
    P_DE: 9, P_ATE: 10, OBRA: 11, LIMITADOR: 12, 
    REG: 13, CASA_PAULISTA: 14, DOCUMENTOS: 15, 
    DICA: 16, DESC_LONGA: 17, BK_CLI: 24
};

// Função principal de inicialização
async function iniciarApp() {
    console.log("Iniciando App...");
    try {
        // 1. Carrega os dados primeiro
        await carregarPlanilha();
        
        // 2. Só desenha os mapas se os dados existirem e as variáveis de mapa estiverem prontas
        if (typeof MAPA_GSP !== 'undefined' && typeof MAPA_INTERIOR !== 'undefined') {
            desenharMapas();
        } else {
            console.error("Arquivos de mapa (mrv-data.js) não encontrados!");
        }

        // 3. Chama a função que está no seu HTML para criar os botões da esquerda
        if (typeof gerarListaLateral === 'function') {
            gerarListaLateral();
        }
    } catch (err) { 
        console.error("Erro crítico na inicialização:", err); 
    }
}

async function carregarPlanilha() {
    const SHEET_ID = "15V194P2JPGCCPpCTKJsib8sJuCZPgtbNb-rtgNaLS7E";
    const URL_CSV = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0&v=${new Date().getTime()}`;
    
    const response = await fetch(URL_CSV);
    const texto = await response.text();
    
    const linhas = [];
    let linhaAtual = "", dentroDeAspas = false;

    for (let i = 0; i < texto.length; i++) {
        const char = texto[i];
        if (char === '"') dentroDeAspas = !dentroDeAspas;
        if ((char === '\n' || char === '\r') && !dentroDeAspas) {
            if (linhaAtual.trim()) linhas.push(linhaAtual);
            linhaAtual = "";
        } else { linhaAtual += char; }
    }

    DADOS_PLANILHA = linhas.slice(1).map(linha => {
        const colunas = [];
        let campo = "", aspas = false;
        for (let i = 0; i < linha.length; i++) {
            const char = linha[i];
            if (char === '"') aspas = !aspas;
            else if (char === ',' && !aspas) { colunas.push(campo.trim()); campo = ""; }
            else { campo += char; }
        }
        colunas.push(campo.trim());
        const catLimpa = colunas[COL.CATEGORIA]?.toUpperCase() || "";

        return {
            id_path: colunas[COL.ID]?.toLowerCase().replace(/\s/g, ''),
            tipo: catLimpa.includes('COMPLEXO') ? 'N' : 'R',
            ordem: parseInt(colunas[COL.ORDEM]) || 999,
            nome: colunas[COL.NOME] || "",
            nomeFull: colunas[COL.NOME_FULL] || colunas[COL.NOME] || "",
            cidade: colunas[COL.ID] || "",
            estoque: colunas[COL.ESTOQUE] || "0",
            endereco: colunas[COL.END] || "",
            tipologias_raw: colunas[COL.TIPOLOGIAS] || "",
            entrega: colunas[COL.ENTREGA] || "",
            p_de: colunas[COL.P_DE] || "-",
            p_ate: colunas[COL.P_ATE] || "-",
            obra: colunas[COL.OBRA] || "0",
            limitador: colunas[COL.LIMITADOR] || "-",
            reg_mrv: colunas[COL.REG] || "-",
            casa_paulista: colunas[COL.CASA_PAULISTA] || "-",
            documentos: colunas[COL.DOCUMENTOS] || "",
            dica: colunas[COL.DICA] || "",
            descLonga: colunas[COL.DESC_LONGA] || "",
            book: colunas[COL.BK_CLI] || ""
        };
    }).filter(i => i.nome && i.nome.length > 2);

    DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);
    console.log("Planilha carregada com sucesso:", DADOS_PLANILHA.length, "itens.");
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    if (!container || !dados) return;
    
    if (!interativo) { 
        container.style.cursor = "pointer"; 
        container.onclick = trocarMapas; 
    }
    
    const pathsHtml = dados.paths.map(p => {
        const idPath = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idPath);
        const clique = interativo ? `onclick="comandoSelecao('${p.id}', '${p.name}')"` : "";
        return `<path id="${id}-${p.id}" d="${p.d}" class="${temMRV && interativo ? 'commrv' : ''}" ${clique}></path>`;
    }).join('');

    container.innerHTML = `<svg viewBox="${dados.viewBox}" preserveAspectRatio="xMidYMid meet" style="width:100%; height:100%;"><g>${pathsHtml}</g></svg>`;
}

function desenharMapas() {
    renderizarNoContainer('caixa-a', (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR, true);
    renderizarNoContainer('caixa-b', (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP, false);
}

function comandoSelecao(idPath, nomePath, fonte) {
    const idBusca = idPath.toLowerCase().replace(/\s/g, '');
    const imoveis = DADOS_PLANILHA.filter(d => d.id_path === idBusca);
    if (imoveis.length > 0) {
        const selecionado = (fonte && fonte.nome) ? fonte : imoveis[0];
        nomeSelecionado = nomePath || selecionado.cidade;
        document.getElementById('cidade-titulo').innerText = nomeSelecionado;
        
        // Marca o botão da esquerda como ativo
        document.querySelectorAll('.btRes, .separador-complexo-btn').forEach(btn => btn.classList.remove('ativo'));
        const btnId = `btn-esq-${selecionado.nome.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const btn = document.getElementById(btnId);
        if (btn) btn.classList.add('ativo');

        montarVitrine(selecionado, imoveis, nomeSelecionado);
    }
}

// Funções de apoio
function trocarMapas() { mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP'; desenharMapas(); }
function obterHtmlEstoque(v, t) { return t === 'N' ? "" : `<span class="badge-estoque">RESTAM ${v} UN.</span>`; }
function navegarVitrine(nome, reg) { const i = DADOS_PLANILHA.find(x => x.nome === nome); if(i) comandoSelecao(i.id_path, reg, i); }

// Inicia automaticamente
iniciarApp();
