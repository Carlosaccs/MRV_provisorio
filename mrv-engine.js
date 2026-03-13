function renderizarNoContainer(id, dados, interativo) {
    const container = document.getElementById(id);
    const pathsHtml = dados.paths.map(p => {
        const idNorm = p.id.toLowerCase().replace(/\s/g, '');
        const temMRV = DADOS_PLANILHA.some(d => d.id_path === idNorm);
        const ativo = (pathAtivo === idNorm && interativo) ? 'ativo' : '';
        const isGSP = idNorm === "grandesaopaulo";
        
        // Eventos: Clique seleciona, MouseOver apenas informa o nome
        const eventos = interativo ? `
            onclick="${isGSP ? "trocarMapas(true)" : `comandoSelecao('${p.id}')`}"
            onmouseover="informarRegiao('${p.name}')"
        ` : "";

        return `<path id="${id}-${idNorm}" d="${p.d}" name="${p.name}" class="${(temMRV || isGSP) && interativo ? 'commrv '+ativo : ativo}" ${eventos}></path>`;
    }).join('');
    container.innerHTML = `<svg viewBox="${dados.viewBox}"><g transform="${dados.transform || ''}">${pathsHtml}</g></svg>`;
}

// Nova função para atualizar o título no Hover (passar o mouse)
function informarRegiao(nome) {
    if (nome) {
        document.getElementById('cidade-titulo').innerText = nome.toUpperCase();
    }
}

// Ajuste na Montagem da Vitrine (Removi margens que podiam empurrar a caixa)
function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    const outros = listaDaCidade.filter(i => i.nome !== selecionado.nome);
    const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.endereco)}`;
    
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao}</div>`;
    
    if(outros.length > 0) {
        html += `<div style="margin-bottom:10px; max-height:150px; overflow-y:auto;">${outros.map(i => `
            <button class="${i.tipo === 'N' ? 'separador-complexo-btn' : 'btRes'}" style="width:100%;" onclick="navegarVitrine('${i.nome}')">
                <strong>${i.nome}</strong> ${obterHtmlEstoque(i.estoque, i.tipo)}
            </button>`).join('')}</div>`;
    }

    if (selecionado.tipo === 'R') {
        // ... (Mantenha o HTML do Residencial igual ao anterior)
    } else {
        html += `<div class="titulo-vitrine-faixa faixa-preta">${selecionado.nomeFull}</div>`;
        html += `
            <div class="box-complexo-full">
                <label style="padding:10px 15px 0; color:var(--mrv-preto); font-size: 0.6rem; font-weight: bold; text-transform: uppercase;">Sobre o Complexo</label>
                <div class="scroll-texto-complexo">
                    <p>${selecionado.descLonga}</p>
                </div>
            </div>`;
    }
    painel.innerHTML = html;
}
