/* DASHBOARD MRV MOBILE - MOTOR LOGICO
   MARCAÇÃO POR BLOCOS (100-200-300...)
*/

// ==========================================================================
// BLOCO 100: VARIÁVEIS DE ESTADO (MEMÓRIA DO APP)
// ==========================================================================
let regiaoAtiva = 'GSP'; // Pode ser 'GSP' ou 'INTERIOR'
let sidebarAberta = false;
let imovelSelecionado = null;

// ==========================================================================
// BLOCO 110: INICIALIZAÇÃO (O QUE RODA AO ABRIR)
// ==========================================================================
window.onload = () => {
    console.log("App Mobile Iniciado");
    renderizarMapaPrincipal();
    renderizarMiniMapa();
    gerarListaBotões();
};

// ==========================================================================
// BLOCO 120: CONTROLES DE INTERFACE (MENU E TELA CHEIA)
// ==========================================================================
function toggleMenu() {
    sidebarAberta = !sidebarAberta;
    const sidebar = document.getElementById('sidebar-imoveis');
    if (sidebarAberta) {
        sidebar.classList.add('aberta');
    } else {
        sidebar.classList.remove('aberta');
    }
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// ==========================================================================
// BLOCO 200: RENDERIZAÇÃO DO MAPA (SVG)
// ==========================================================================
function renderizarMapaPrincipal() {
    const container = document.getElementById('mapa-container');
    const dadosRegiao = (regiaoAtiva === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    
    // Constrói o HTML do SVG
    const paths = dadosRegiao.paths.map(p => {
        const cor = (p.id === imovelSelecionado) ? 'var(--mrv-laranja)' : '#777';
        return `<path id="${p.id}" d="${p.d}" fill="${cor}" stroke="#fff" onclick="cliqueNoMapa('${p.id}')"></path>`;
    }).join('');

    container.innerHTML = `<svg viewBox="${dadosRegiao.viewBox}">${paths}</svg>`;
}

// ==========================================================================
// BLOCO 210: TROCA DE REGIÃO (ILHA)
// ==========================================================================
function trocarRegiao() {
    regiaoAtiva = (regiaoAtiva === 'GSP') ? 'INTERIOR' : 'GSP';
    renderizarMapaPrincipal();
    renderizarMiniMapa();
    gerarListaBotões(); // Atualiza a lista para a nova região
}

function renderizarMiniMapa() {
    const container = document.getElementById('mini-mapa-container');
    const dadosMini = (regiaoAtiva === 'GSP') ? MAPA_INTERIOR : MAPA_GSP;
    
    const paths = dadosMini.paths.map(p => `<path d="${p.d}" fill="#ccc"></path>`).join('');
    container.innerHTML = `<svg viewBox="${dadosMini.viewBox}">${paths}</svg>`;
}

// ==========================================================================
// BLOCO 300: LISTA DE BOTÕES (CARROSSEL)
// ==========================================================================
function gerarListaBotões() {
    const lista = document.getElementById('lista-imoveis-mobile');
    
    // Filtra os dados da mrv-data.js baseado na região ativa
    const imoveisFiltrados = DADOS_PLANILHA.filter(item => item.regiao_mapa === regiaoAtiva);

    lista.innerHTML = imoveisFiltrados.map(item => `
        <div class="btRes" onclick="cliqueNoBotao('${item.id_path}')">
            <span>${item.nome}</span>
            <span class="seta">›</span>
        </div>
    `).join('');
}

// ==========================================================================
// BLOCO 400: LÓGICA DE SELEÇÃO E FICHA TÉCNICA
// ==========================================================================
function cliqueNoBotao(id) {
    imovelSelecionado = id;
    renderizarMapaPrincipal(); // Pinta o mapa
    exibirFichaTecnica(id);
    toggleMenu(); // Fecha a lista após selecionar
}

function cliqueNoMapa(id) {
    imovelSelecionado = id;
    renderizarMapaPrincipal();
    exibirFichaTecnica(id);
}

function exibirFichaTecnica(id) {
    const ficha = document.getElementById('ficha-tecnica');
    const dados = DADOS_PLANILHA.find(item => item.id_path === id);
    
    if (dados) {
        ficha.innerHTML = `
            <h2 style="color:var(--mrv-verde)">${dados.nome}</h2>
            <p>${dados.descricao || 'Informações do residencial...'}</p>
            `;
    }
}
