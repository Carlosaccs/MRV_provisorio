// ===========================================
// TESTE DE CAPTURA GLOBAL DE CLIQUE (DIAGNÓSTICO)
// ===========================================

// Tenta aplicar o destaque assim que a página carregar e a cada 1 segundo (caso o menu seja dinâmico)
function forcarDestaqueBotao() {
  const elementos = document.querySelectorAll("button, a, div, span, header *");
  elementos.forEach(el => {
    // Procura por qualquer texto que lembre SpeedSim ou Simulador
    const texto = el.textContent ? el.textContent.toUpperCase() : "";
    if (texto.includes("SPEEDSIM") || texto.includes("SIMULADOR DE MCMV")) {
      // Destaca para vermos se ele achou
      el.style.border = "4px solid red";
      el.style.backgroundColor = "yellow";
      
      // Remove eventos antigos duplicados clonando o nó se necessário, ou apenas injeta o click
      if (!el.dataset.testado) {
        el.dataset.testado = "true";
        el.addEventListener("click", function(e) {
          e.preventDefault();
          e.stopPropagation();
          alert("BOTAO CLICADO COM SUCESSO! O elemento encontrado foi: " + el.tagName);
        }, true); // Captura na fase de subida/descida para garantir
      }
    }
  });
}

// Executa no carregamento e mapeia cliques globais na barra superior
document.addEventListener("DOMContentLoaded", function() {
  setInterval(forcarDestaqueBotao, 1000);
});

// Captura de segurança global para ver se o clique chega ao documento
document.addEventListener("click", function(e) {
  console.log("Clique detectado no elemento:", e.target);
});
