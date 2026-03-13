function montarVitrine(selecionado, listaDaCidade, nomeRegiao) {
    const painel = document.getElementById('ficha-tecnica');
    if(!painel) return;
    
    const urlMaps = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selecionado.endereco)}`;
    
    // Organização: Complexos primeiro, depois os demais que não são o selecionado
    const listaOrdenada = [...listaDaCidade].sort((a, b) => (a.tipo === 'N' ? -1 : 1));
    const listaBotoesSuperior = listaOrdenada.filter(i => i.nome !== selecionado.nome);
    
    let html = `<div class="vitrine-topo">MRV EM ${nomeRegiao.toUpperCase()}</div>`;
    
    // Renderiza os botões (BTRES) que ficaram acima
    html += `<div style="margin-bottom:10px;">${listaBotoesSuperior.map(item => {
                const classe = item.tipo === 'N' ? 'separador-complexo-btn' : 'btRes';
                return `<button class="${classe}" onclick="navegarVitrine('${item.nome}', '${nomeRegiao}')"><strong>${item.nome}</strong> ${item.tipo === 'R' ? obterHtmlEstoque(item.estoque, item.tipo) : ''}</button>`;
            }).join('')}</div>`;

    // Linha de separação idêntica ao que você já usa
    html += `<hr style="border:0; border-top:1px solid #ddd; margin:15px 0 20px 0;">`;

    if (selecionado.tipo === 'R') {
        // --- NOVO PASSO: FAIXA LARANJA DO RESIDENCIAL ---
        // Usamos a mesma classe do complexo, mas forçamos o fundo laranja e texto escuro
        html += `<div class="separador-complexo-btn" style="width:100% !important; margin:0 !important; border-radius:4px; cursor:default; height:36px !important; background-color: var(--mrv-laranja) !important; color: #333 !important; text-shadow: none;">RES. ${selecionado.nome.toUpperCase()}</div>`;
        
        // Endereço e Botão MAPS (Idêntico ao layout do Complexo)
        html += `<div style="padding: 10px 0;">
                    <p style="font-size:0.65rem; color:#444; display:flex; justify-content:space-between; align-items:center;">
                        <span>📍 ${selecionado.endereco}</span>
                        <a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a>
                    </p>
                 </div>`;
        
        // Paramos aqui conforme solicitado para testar a estrutura.
    } else {
        // Mantém a lógica do Complexo que já estava funcionando
        html += `<div class="separador-complexo-btn" style="width:100% !important; margin:0 !important; border-radius:4px 4px 0 0; cursor:default; height:36px !important; pointer-events:none;">${selecionado.nomeFull}</div>`;
        html += `<div style="padding: 10px 0;"><p style="font-size:0.65rem; color:#444; display:flex; justify-content:space-between; align-items:center;"><span>📍 ${selecionado.endereco}</span><a href="${urlMaps}" target="_blank" class="btn-maps">MAPS</a></p></div>`;
        const desc = (selecionado.descLonga || "").split('\n').map(p => `<p style="margin-bottom:8px;">${p.trim()}</p>`).join('');
        html += `<div class="box-argumento" style="border-left-color: #00713a; background:#f9f9f9; margin-top:0; border-radius:0 0 4px 4px;"><label>Sobre o Complexo</label>${desc}</div>`;
    }
    
    painel.innerHTML = html;
}
