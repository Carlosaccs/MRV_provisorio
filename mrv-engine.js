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
    OBSERVACOES: 18, 
    DESC_LONGA: 17, 
    LOCALIZACAO: 19, MOBILIDADE: 20, CULTURA_LAZER: 21,    
    COMERCIO: 22, SAUDE_EDUCACAO: 23,
    BOOK_CLIENTE: 24, BOOK_CORRETOR: 25,
    LINKS_VIDEOS: 26,   
    LINKS_PLANTAS: 27,  
    LINKS_IMPLANT: 28,  
    LINKS_DIVERSOS: 29  
};

/* ==========================================================================
   INICIALIZAÇÃO E CARREGAMENTO
   ========================================================================== */
async function iniciarApp() {
    try { await carregarPlanilha(); } catch (err) { console.error(err); }
}

function formatarLinkSeguro(url) {
    if (!url || url === "---" || url === "") return "";
    if (url.includes('drive.google.com')) {
        return url.split('/view')[0].split('/edit')[0] + '/preview';
    }
    return url;
}

function copiarLink(url) {
    const linkSeguro = formatarLinkSeguro(url);
    navigator.clipboard.writeText(linkSeguro);
    alert("Link seguro copiado!");
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
                linksDiversos: colunas[COL.LINKS_DIVERSOS] || ""
            };
        }).filter(i => i !== null);

        DADOS_PLANILHA.sort((a, b) => a.ordem - b.ordem);
        desenharMapas(); gerarListaLateral();
    } catch (e) { console.error(e); }
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
    if (texto) { 
        titulo.innerText = `MRV EM ${texto.toUpperCase()}`; 
    } 
    else if (pathAtivo) {
        const todosPaths = MAPA_GSP.paths.concat(MAPA_INTERIOR.paths);
        const nomeFixo = todosPaths.find(p => p.id.toLowerCase().replace(/\s/g, '') === pathAtivo)?.name || "";
        titulo.innerText = `MRV EM ${nomeFixo.toUpperCase()}`;
    } else { 
        titulo.innerText = "SELECIONE UMA REGIÃO NO MAPA"; 
    }
}

function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    container.style.display = "flex";
    container.style.alignItems = "center";
    container.style.justifyContent = "center";
    container.style.overflow = "hidden";

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
    <div class="card-material-item" style="padding: 4px 8px; margin-bottom: 4px; min-height: 32px;">
        <div class="card-material-left" style="gap: 8px;">
            <span class="card-icon" style="font-size: 0.8rem;">${icone}</span>
            <span class="card-text" style="font-size: 0.65rem;">${titulo}</span>
        </div>
        <div class="card-material-right" style="position: relative; gap: 4px;">
            <a href="${linkSeguro}" target="_blank" class="card-btn-abrir" style="padding: 2px 8px; font-size: 0.6rem;">Abrir</a>
            <button onclick="copiarLink('${url}')" class="card-btn-copiar" style="padding: 2px 8px; font-size: 0.6rem;">Copiar</button>
        </div>
    </div>`;
};

const extrairLinks = (campo, icone) => {
    if(!campo || campo === "---") return "";
    let htmlTemp = "";
    const grupos = campo.split(';').map(g => g.trim()).filter(g => g !== "");
    grupos.forEach(g => {
        const partes = g.split(',').map(p => p.trim());
        if(partes.length >= 2) htmlTemp += criarCardMaterial(partes[0], partes[1], icone);
    });
    return htmlTemp;
};

function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    const outros = listaDaCidade.filter(i => i.nome !== selecionado.nome);
    const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.endereco)}`;
    
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao}</div>`;
    
    if(outros.length > 0) {
        html += `<div style="margin-bottom:6px;">${outros.map(i => `
            <button class="${i.tipo === 'N' ? 'separador-complexo-btn' : 'btRes'}" style="width:100%;" onclick="navegarVitrine('${i.nome}')">
                <strong>${i.nome}</strong> ${obterHtmlEstoque(i.estoque, i.tipo)}
            </button>`).join('')}</div><hr style="border:0; border-top:1px solid #eee; margin:6px 0;">`;
    }

    const estiloFaixa = `display: flex !important; align-items: center !important; justify-content: center !important; width: 100% !important; text-align: center !important; line-height: normal !important; height: 32px; border-radius: 4px; margin-bottom: 4px; font-weight: bold; font-size: 0.85rem; color: white;`;

    if (selecionado.tipo === 'R') {
        html += `<div class="titulo-vitrine-faixa faixa-laranja" style="${estiloFaixa}">
            RES. ${selecionado.nome.toUpperCase()}   —   ${selecionado.regiao}
        </div>`;
        
        html += `<div style="padding: 2px 0 5px 0;"><p style="font-size:0.65rem; color:#444; display:flex; justify-content:space-between; align-items:center; margin:0;"><span>📍 ${selecionado.endereco}</span><a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a></p></div>`;
        
        html += `<div style="background: #f9f9f9; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; margin-bottom: 4px;">`;
        
        if(selecionado.campanha && selecionado.campanha !== "---" && selecionado.campanha !== "") {
            html += `<div style="background: #fff5f5; color: #e31010; font-weight: bold; font-size: 0.7rem; text-align: center; padding: 4px; border-bottom: 1px solid #ddd;">${selecionado.campanha}</div>`;
        }

        const linhaInfo = (l1, v1, l2, v2, borda) => `
            <div style="display: flex; width: 100%; ${borda ? 'border-bottom: 1px solid #ddd;' : ''}">
                <div style="flex: 1; padding: 4px 8px; border-right: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
                    <label style="font-size: 0.55rem; font-weight: bold; color: #008d36; text-transform: uppercase;">${l1}</label>
                    <strong style="font-size: 0.65rem; color: #333;">${v1}</strong>
                </div>
                <div style="flex: 1; padding: 4px 8px; display: flex; justify-content: space-between; align-items: center;">
                    <label style="font-size: 0.55rem; font-weight: bold; color: #008d36; text-transform: uppercase;">${l2}</label>
                    <strong style="font-size: 0.65rem; color: #333;">${v2}</strong>
                </div>
            </div>`;
        html += linhaInfo('Entrega', selecionado.entrega, 'Obra', selecionado.obra + '%', true);
        html += linhaInfo('Plantas', selecionado.p_de + ' - ' + selecionado.p_ate, 'Estoque', (selecionado.estoque || "---") + ' UN.', true);
        html += linhaInfo('Limitador', selecionado.limitador, 'C. Paulista', selecionado.casa_paulista, false);
        html += `</div>`;

        if(selecionado.tipologiasH) {
            const linhas = selecionado.tipologiasH.split(';').map(l => l.trim()).filter(l => l !== "");
            if(linhas.length > 0) {
                const titulos = linhas[0].split(',').map(t => t.trim());
                const dados = linhas.slice(1);
                html += `
                <div class="tabela-precos-container" style="margin-top:2px; margin-bottom:8px;">
                    <div class="tabela-header" style="min-height: 28px;">
                        ${titulos.map((t, idx) => `<div class="col-tabela ${idx === 1 ? 'col-laranja' : ''}" style="padding: 4px;">${t}</div>`).join('')}
                    </div>
                    <div class="tabela-corpo">
                        ${dados.map(linhaStr => {
                            const cols = linhaStr.split(',').map(c => c.trim());
                            if(cols.length <= 1) return "";
                            return `<div class="tabela-row" style="min-height: 28px;">
                                ${cols.map((v, idx) => `<div class="col-tabela ${idx === 1 ? 'col-laranja' : ''}" style="padding: 4px;">${idx === 0 ? `<strong>${v}</strong>` : v}</div>`).join('')}
                            </div>`;
                        }).join('')}
                    </div>
                </div>`;
            }
        }

        html += `<div style="border-radius: 4px; overflow: hidden; border: 1px solid #ddd; margin-top: 6px;">`;
        const criarBoxDiferencial = (label, texto, corFundo, corBorda, temBorda) => {
            if(!texto || texto === "---" || texto === "") return "";
            return `
            <div style="background: ${corFundo}; border-left: 6px solid ${corBorda}; padding: 6px 10px; ${temBorda ? 'border-bottom: 1px solid #ddd;' : ''}">
                <label style="display:block; font-size:0.55rem; font-weight:bold; color:${corBorda}; text-transform:uppercase; margin-bottom:1px;">${label}</label>
                <p style="margin:0; font-size:0.68rem; color:#444; line-height:1.3;">${texto}</p>
            </div>`;
        };
        
        html += criarBoxDiferencial('💡 Observação Importante', selecionado.observacoes, '#fff9c4', '#fbc02d', true);
        html += criarBoxDiferencial('📍 Localização', selecionado.localizacao, '#fdf2e9', '#f37021', true);
        html += criarBoxDiferencial('🚍 Mobilidade', selecionado.mobilidade, '#f1f8e9', '#2e7d32', true);
        html += criarBoxDiferencial('🎭 Cultura e Lazer', selecionado.lazer, '#e3f2fd', '#1565c0', true);
        html += criarBoxDiferencial('🛒 Comércio', selecionado.comercio, '#ffebee', '#c62828', true);
        html += criarBoxDiferencial('🏥 Saúde e Educação', selecionado.saude, '#f3e5f5', '#6a1b9a', false);
        html += `</div>`;

        let materiaisHtml = "";
        materiaisHtml += criarCardMaterial('Book Cliente', selecionado.linkCliente, '📄');
        materiaisHtml += criarCardMaterial('Book Corretor', selecionado.linkCorretor, '💼');
        materiaisHtml += extrairLinks(selecionado.linksVideos, '🎬');
        materiaisHtml += extrairLinks(selecionado.linksPlantas, '📐');
        materiaisHtml += extrairLinks(selecionado.linksImplant, '📍');
        materiaisHtml += extrairLinks(selecionado.linksDiversos, '✨');

        if (materiaisHtml !== "") {
            html += `<div style="margin-top: 10px;">
                <label style="display:block; font-size:0.6rem; font-weight:bold; color:#888; text-transform:uppercase; margin-bottom:4px; border-bottom:1px solid #eee;">MATERIAIS DE APOIO</label>
                ${materiaisHtml}
            </div>`;
        }

        if(selecionado.descLonga) {
             html += `<div style="margin-top:8px; font-size:0.7rem; color:#666; line-height:1.4; border-top:1px solid #eee; padding-top:4px;">${selecionado.descLonga}</div>`;
        }
    } else {
        html += `<div class="titulo-vitrine-faixa faixa-preta" style="${estiloFaixa}">
            ${selecionado.nomeFull.toUpperCase()}   —   ${selecionado.regiao}
        </div>`;
        html += `<div class="box-complexo-full" style="padding: 5px 0;">
                    <p style="font-size:0.7rem; color:#444; margin-bottom:10px;"><span>📍 ${selecionado.endereco}</span> <a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a></p>
                    <div style="font-size:0.75rem; color:#444; line-height:1.5; text-align:justify;">${selecionado.descLonga}</div>
                 </div>`;
        
        let materiaisComplexo = extrairLinks(selecionado.linksImplant, '📍');
        if (materiaisComplexo !== "") {
            html += `<div style="margin-top: 10px; padding: 0 5px;">
                <label style="display:block; font-size:0.6rem; font-weight:bold; color:#888; text-transform:uppercase; margin-bottom:4px; border-bottom:1px solid #eee;">MATERIAIS DO COMPLEXO</label>
                ${materiaisComplexo}
            </div>`;
        }
    }
    painel.innerHTML = html;
}

/* ==========================================================================
   LÓGICA DO MODAL (BOTAO SOBRE)
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById("modal-sobre");
    const btn = document.getElementById("btn-sobre");
    const span = document.querySelector(".modal-close");

    if(btn) {
        btn.onclick = () => { 
            if(modal) {
                // Atualizamos o conteúdo do modal antes de abrir
                const modalBody = modal.querySelector(".modal-body") || modal;
                modalBody.innerHTML = `
                    <div style="text-align: center; padding: 10px;">
                        <h2 style="color: #008d36; margin-top: 0;">Sobre o Projeto</h2>
                        <p style="font-size: 0.85rem; color: #444; line-height: 1.5;">Esse dashboard foi feito para acessarmos de forma rápida informações básicas dos residenciais MRV durante atendimento a leads.</p>
                        
                        <div style="background: #fff9c4; border-radius: 8px; padding: 15px; margin: 20px 0; border: 1px solid #fbc02d;">
                            <p style="font-size: 0.8rem; color: #444; margin: 0;">As informações podem estar desatualizadas e até erradas, então caso encontre algum erro ou se você tiver algum material que está faltando nele como books ou vídeos, por favor, envie pra mim pelo whatsapp através do botão abaixo:</p>
                        </div>

                        <a href="https://wa.me/5511995824961" target="_blank" style="display: inline-flex; align-items: center; justify-content: center; background-color: #25D366; color: white; text-decoration: none; padding: 12px 25px; border-radius: 50px; font-weight: bold; font-size: 1rem; transition: background 0.3s; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <svg style="width: 20px; height: 20px; margin-right: 10px; fill: white;" viewBox="0 0 24 24">
                                <path d="M12.031 6.172c-2.32 0-4.582.902-6.368 2.535a9.07 9.07 0 0 0-2.483 5.485c-.09 1.48.243 2.923.957 4.195l-.946 3.454 3.535-.927c1.233.673 2.62 1.028 4.025 1.03h.004c2.316 0 4.58-.901 6.367-2.534 1.787-1.632 2.77-3.805 2.77-6.12 0-2.314-.982-4.488-2.77-6.12a9.143 9.143 0 0 0-6.391-2.598zm4.61 11.53c-.198.558-1.157 1.066-1.597 1.127-.44.06-1.01.076-2.146-.35-1.135-.427-2.222-1.255-3.022-2.115-.8-.859-1.503-2.242-1.503-3.626 0-1.385.72-2.064 1-2.353.28-.29.613-.362.813-.362.2 0 .4-.002.573.006.182.008.428-.069.67.51.242.578.828 2.023.898 2.169.07.146.117.315.02.51-.097.193-.146.314-.29.485-.146.17-.306.383-.437.513-.145.146-.296.306-.128.598.168.29.743 1.226 1.594 1.983.85.757 1.564 1.016 1.86.136.296.118.572.118.773 0 .201-.118.573-.284.774-.2.2-.44.536-.66.797-.22.261-.264.445-.06.772.2.327 1.34 2.213 1.34 2.213.118.193.19.314.302.43.112.118.232.118.43.02.198-.098 1.137-.468 1.436-.628.298-.16.398-.13.548.118.15.248.57 1.26.65 1.42.08.16.08.31.02.43s-.32.26-.52.41z"/>
                            </svg>
                            Carlos Custódio
                        </a>
                    </div>`;
                modal.style.display = "block"; 
            }
        };
    }
    if(span) {
        span.onclick = () => { if(modal) modal.style.display = "none"; };
    }
    window.onclick = (event) => {
        if (event.target == modal) { modal.style.display = "none"; }
    };
});

window.onload = iniciarApp;
