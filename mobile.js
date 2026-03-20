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
// BLOCO 200: RENDERIZAÇÃO DO MAPA (SVG) - ATUALIZADO
// ==========================================================================
function renderizarMapaPrincipal() {
    const container = document.getElementById('mapa-container');
    // Busca os dados do objeto MAPA_GSP ou MAPA_INTERIOR que estão no seu mrv-data.js
    const dadosRegiao = (regiaoAtiva === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    
    if (!dadosRegiao) return;

    const paths = dadosRegiao.paths.map(p => {
        // Se o imóvel for o selecionado, brilha em laranja, senão usa cinza
        const corAtiva = (p.name === imovelSelecionado) ? 'var(--mrv-laranja)' : '#777';
        
        return `
            <path 
                id="${p.id}" 
                d="${p.d}" 
                fill="${corAtiva}" 
                stroke="#fff" 
                stroke-width="1"
                onclick="cliqueNoMapa('${p.name}')"
                style="transition: fill 0.2s ease;">
            </path>`;
    }).join('');

    // Aplica o viewBox e o transform que já existem no seu mrv-data.js
    container.innerHTML = `
        <svg viewBox="${dadosRegiao.viewBox}" style="width:100%; height:100%;">
            <g transform="${dadosRegiao.transform || ''}">
                ${paths}
            </g>
        </svg>`;
}

// ==========================================================================
// BLOCO 300: LISTA DE BOTÕES (CARROSSEL) - ATUALIZADO
// ==========================================================================
function gerarListaBotões() {
    const lista = document.getElementById('lista-imoveis-mobile');
    if (!lista) return;

    // Filtra sua DADOS_PLANILHA para mostrar apenas o que pertence à região do mapa atual
    // Ajuste o nome 'regiao_mapa' se na sua planilha for diferente (ex: 'localizacao')
    const imoveisFiltrados = DADOS_PLANILHA.filter(item => item.regiao_mapa === regiaoAtiva);

    lista.innerHTML = imoveisFiltrados.map(item => `
        <div class="btRes" onclick="cliqueNoBotao('${item.name}')">
            <span>${item.name}</span>
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
