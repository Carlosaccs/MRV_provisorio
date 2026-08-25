// ===========================================
// TESTE DIAGNÓSTICO DO BOTÃO SPEEDSIM
// ===========================================
document.addEventListener("DOMContentLoaded", function() {
  console.log("Script de teste carregado com sucesso!");
  
  // Procura qualquer elemento no topo que tenha o texto do SpeedSim
  const elementos = document.querySelectorAll("button, a, div, span");
  let encontrado = false;

  elementos.forEach(el => {
    if (el.textContent && el.textContent.toUpperCase().includes("SPEEDSIM")) {
      encontrado = true;
      
      // 1. Destaca o botão visualmente com uma borda vermelha grossa
      el.style.border = "4px solid red";
      el.style.backgroundColor = "yellow"; // Fundo amarelo para destacar bem
      
      // 2. Adiciona o evento de clique com um popup simples de aviso
      el.addEventListener("click", function(event) {
        event.preventDefault();
        event.stopPropagation();
        alert("Sucesso! O clique no botão do SpeedSim foi capturado pelo JavaScript!");
      });
    }
  });

  if (!encontrado) {
    console.warn("Aviso: Nenhum elemento com o texto 'SPEEDSIM' foi encontrado na árvore DOM no momento do carregamento.");
  }
});
