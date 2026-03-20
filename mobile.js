
let mapaAtivo = 'GSP'; // GSP ou INTERIOR
let menuAberto = false;
let escalaZoom = 1;

// 1. INICIALIZAÇÃO
function iniciarMobile() {
    renderizarMapaPrincipal();
    renderizarMiniMapa();
    gerarMenuCarrossel();
}

// 2. CONTROLE DO MENU (PUXAR/EMPURRAR)
function toggleMenu() {
    menuAberto = !menuAberto;
    document.getElementById('drawer-menu').classList.toggle('aberto', menuAberto);
}

// 3. TROCA DE MAPAS (ILHA)
function alternarMapa() {
    mapaAtivo = (mapaAtivo === 'GSP') ? 'INTERIOR' : 'GSP';
    renderizarMapaPrincipal();
    renderizarMiniMapa();
    escalaZoom = 1;
    aplicarZoom();
}

// 4. LÓGICA DE RENDERIZAÇÃO (REDUZIDA PARA PERFORMANCE)
function renderizarMapaPrincipal() {
    const container = document.getElementById('caixa-mapa-principal');
    const dados = (mapaAtivo === 'GSP') ? MAPA_GSP : MAPA_INTERIOR;
    
    let pathsHtml = dados.paths.map(p => {
        return `<path id="main-${p.id}" d="${p.d}" fill="#777" stroke="#fff" onclick="selecionarImovel('${p.id}')"></path>`;
    }).join('');

    container.innerHTML = `<svg viewBox="${dados.viewBox}" onclick="resetZoom()">${pathsHtml}</svg>`;
}

function renderizarMiniMapa() {
    const container = document.getElementById('mini-mapa');
    const dadosMini = (mapaAtivo === 'GSP') ? MAPA_INTERIOR : MAPA_GSP;
    
    let pathsHtml = dadosMini.paths.map(p => `<path d="${p.d}" fill="#aaa"></path>`).join('');
    container.innerHTML = `<svg viewBox="${dadosMini.viewBox}">${pathsHtml}</svg>`;
}

// 5. ZOOM (SIMULADO PARA CLIQUE E GESTO)
function resetZoom() {
    escalaZoom = 1;
    aplicarZoom();
}

function aplicarZoom() {
    const el = document.getElementById('caixa-mapa-principal');
    el.style.transform = `scale(${escalaZoom})`;
}

// 6. FULL SCREEN (ESTILO YOUTUBE)
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        document.getElementById('icon-zoom').innerText = "⛶";
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            document.getElementById('icon-zoom').innerText = "⛶";
        }
    }
}

function gerarMenuCarrossel() {
    const container = document.getElementById('lista-imoveis-mobile');
    // Aqui usamos os seus DADOS_PLANILHA do mrv-data.js
    // Exemplo simplificado:
    container.innerHTML = DADOS_PLANILHA.map(item => `
        <div class="btRes" onclick="selecionarImovel('${item.id_path}')">
            <span>${item.nome}</span>
            <span class="seta">›</span>
        </div>
    `).join('');
}

window.onload = iniciarMobile;
