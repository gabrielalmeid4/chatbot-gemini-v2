const typingForm = document.querySelector(".typing-form");
const chatContainer = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion");
const toggleThemeButton = document.querySelector("#theme-toggle-button");
const deleteChatButton = document.querySelector("#delete-chat-button");
const chatTypeElement = document.getElementById('chatType');
let chatTypeValue = chatTypeElement.value;


// Variáveis de estado
let userMessage = null;
let isResponseGenerating = false; // Indica se uma resposta está sendo gerada

// Configuração da API
const API_KEY = "AIzaSyDl8IHhDXss3cbGt5-DRZINXxefcbM7zRk"; // Sua chave de API aqui
const API_URL = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// Carregar tema e dados do chat do local storage ao carregar a página
const loadDataFromLocalstorage = () => {
  const savedChats = localStorage.getItem("saved-chats");
  const isLightMode = (localStorage.getItem("themeColor") === "light_mode");

  // Aplicar o tema armazenado
  document.body.classList.toggle("light_mode", isLightMode);
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

  // Restaurar os chats salvos ou limpar o contêiner de chat
  chatContainer.innerHTML = savedChats || '';
  document.body.classList.toggle("hide-header", savedChats);

  chatContainer.scrollTo(0, chatContainer.scrollHeight); // Rolar para o fim do contêiner
}

document.getElementById('chatType').addEventListener('change', (event) => {
  chatTypeValue = event.target.value; // Define o valor selecionado
  console.log("Tipo de chat selecionado:", chatTypeValue);
});

// Cria um novo elemento de mensagem e o retorna
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
}

// Adiciona evento para o envio do formulário
document.getElementById('formulario').addEventListener('submit', (evento) => {
  evento.preventDefault();
});

// Lida com o evento de upload do arquivo
document.getElementById('uploadButton').addEventListener('click', (evento) => {
  evento.preventDefault();
  
  // HTML para a mensagem de upload
  const html = `<div class="message-content">
                  <img class="avatar" src="images/gemini.svg" alt="Avatar Gemini">
                  <p class="text"></p>
                  <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                  </div>
                </div>
                <span onClick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  const textElement = incomingMessageDiv.querySelector(".text");
  const fileInput = document.getElementById('arquivo');
  const file = fileInput.files[0];
  
  if (!file) {
    alert('Por favor, selecione um arquivo');
    return;
  }

  console.log(file);
  const formData = new FormData();
  formData.append('image', file);

  // Fazer o upload do arquivo para o backend
  fetch('http://localhost:3000/upload', {
    method: 'POST',
    body: formData,
  })
  .then(response => response.json())
  .then(data => {
    if (data && data.description) {
      const resposta = data.description;
      chatContainer.appendChild(incomingMessageDiv);
      chatContainer.scrollTo(0, chatContainer.scrollHeight);
      showTypingEffect(resposta, textElement, incomingMessageDiv); // Exibir o efeito de digitação
    } else {
      document.getElementById('description').textContent = 'Erro: Nenhuma descrição recebida';
    }
  })
  .catch(error => {
    document.getElementById('description').innerText = 'Erro: ' + error.message;
    console.error('Erro:', error);
  }).finally(() => {
    incomingMessageDiv.classList.remove("loading"); // Remover animação de carregamento
  });
});

// Exibir efeito de digitação, mostrando as palavras uma a uma
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const words = text.split(' ');
  let currentWordIndex = 0;

  const typingInterval = setInterval(() => {
    // Adicionar cada palavra ao elemento de texto
    textElement.innerText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex++];
    incomingMessageDiv.querySelector(".icon").classList.add("hide");

    // Quando todas as palavras forem exibidas
    if (currentWordIndex === words.length) {
      clearInterval(typingInterval);
      isResponseGenerating = false;
      incomingMessageDiv.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("saved-chats", chatContainer.innerHTML); // Salvar chats no local storage
    }
    chatContainer.scrollTo(0, chatContainer.scrollHeight); // Rolar para o fim do contêiner
  }, 75);
}

// Busca uma resposta da API baseada na mensagem do usuário
const generateAPIResponse = async (incomingMessageDiv) => {
  let contexto = "Você é um assistente chatbot útil."
  if (chatTypeValue === "contexto") {
    contexto = `
Você é um assistente especializado em esclarecer dúvidas sobre o DEFCON, o sistema de alerta de prontidão das Forças Armadas dos Estados Unidos. Você deve fornecer informações claras e precisas sobre o que é o DEFCON, como os diferentes níveis funcionam, exemplos históricos de quando esses níveis foram alterados, e qualquer outra questão relevante sobre o tema. Seu objetivo é ajudar as pessoas a entenderem melhor a importância e a aplicação do sistema DEFCON.
Você deve responder apenas questões sobre DEFCON, caso o usuário pergunte sobre algo mais, esclaresça que você é um assitente especializado apenas em DEFCON
Segue abaixo algumas informações relevantes sobre o DEFCON para ajudar você a respoder as perguntas dos usuários
DEFCON - Perguntas e Respostas
O que é o DEFCON?
DEFCON, ou "Defense Readiness Condition," é um sistema de alerta usado pelas Forças Armadas dos Estados Unidos para indicar o nível de prontidão e risco de segurança nacional. Existem cinco níveis de DEFCON, sendo o nível 1 o mais alto estado de prontidão (guerra iminente) e o nível 5 o estado de menor risco (condição normal de paz).
Quais são os diferentes níveis de DEFCON e o que cada um significa?
DEFCON 5: Condição normal de prontidão, paz e tranquilidade.
DEFCON 4: Aumento na vigilância e segurança, operações de inteligência aumentadas, sem grandes ameaças.
DEFCON 3: Prontidão aumentada das Forças Armadas; algumas unidades de combate são mobilizadas. As forças aéreas podem ser colocadas em alerta.
DEFCON 2: Prontidão militar máxima, com todas as forças preparadas para um combate imediato; usado em situações de crise.
DEFCON 1: Estado de guerra iminente; forças militares prontas para combate total.
Quando foi a última vez que os EUA estiveram em DEFCON 2?
A última vez que os EUA estiveram em DEFCON 2 foi durante a Crise dos Mísseis de Cuba, em 1962. Este foi um dos momentos mais críticos da Guerra Fria, onde a possibilidade de um conflito nuclear entre os EUA e a União Soviética era iminente.
O DEFCON é usado por outros países além dos Estados Unidos?
Não, o sistema DEFCON é específico das Forças Armadas dos Estados Unidos. Outros países podem ter sistemas semelhantes para medir seu estado de prontidão militar, mas eles não usam a designação DEFCON.
O que significa estar em DEFCON 1?
Estar em DEFCON 1 significa que as Forças Armadas dos Estados Unidos estão em seu mais alto estado de prontidão, com a expectativa de que um conflito militar significativo, possivelmente envolvendo armas nucleares, seja iminente ou já esteja em andamento.
Como o DEFCON é determinado?
O nível DEFCON é decidido pelo Comando Estratégico dos EUA (USSTRATCOM), com base em uma avaliação contínua de ameaças globais, inteligência militar, e outros fatores relevantes que podem afetar a segurança nacional dos Estados Unidos.
O público é informado quando o DEFCON muda?
Normalmente, mudanças nos níveis de DEFCON não são divulgadas ao público para evitar pânico e manter a segurança operacional. As decisões sobre alterar os níveis DEFCON são geralmente classificadas e mantidas em segredo pelas autoridades de defesa.
Existem outras conferências de segurança além do DEFCON?
Sim, além do sistema de prontidão DEFCON, existe a conferência de segurança cibernética também chamada DEF CON, uma das maiores e mais conhecidas conferências de hackers do mundo, realizada anualmente em Las Vegas, Nevada. Além disso, há outros encontros, como a Black Hat, também voltada para segurança cibernética, entre outros eventos globais.
`
  }
  
  const textElement = incomingMessageDiv.querySelector(".text"); // Obter o elemento de texto

  try {
    // Enviar uma requisição POST para a API com a mensagem do usuário
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        contents: [
          { 
          role: "user", 
          parts: [{ text: userMessage }], 
        },
        {
          role: "model",
          parts: [{ text: contexto }] 
        }
      ] 
      }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error.message);

    // Obter a resposta da API e remover asteriscos
    const apiResponse = data?.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, '$1');
    showTypingEffect(apiResponse, textElement, incomingMessageDiv); // Exibir o efeito de digitação
  } catch (error) { // Tratamento de erros
    isResponseGenerating = false;
    textElement.innerText = error.message;
    textElement.parentElement.closest(".message").classList.add("error");
  } finally {
    incomingMessageDiv.classList.remove("loading"); // Remover o estado de carregamento
  }
}

// Exibir animação de carregamento enquanto aguarda resposta da API
const showLoadingAnimation = () => {
  const html = `<div class="message-content">
                  <img class="avatar" src="images/gemini.svg" alt="Avatar Gemini">
                  <p class="text"></p>
                  <div class="loading-indicator">
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                    <div class="loading-bar"></div>
                  </div>
                </div>
                <span onClick="copyMessage(this)" class="icon material-symbols-rounded">content_copy</span>`;

  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatContainer.appendChild(incomingMessageDiv);

  chatContainer.scrollTo(0, chatContainer.scrollHeight); // Rolar para o fim do contêiner
  generateAPIResponse(incomingMessageDiv); // Gerar resposta da API
}

// Copiar o texto da mensagem para a área de transferência
const copyMessage = (copyButton) => {
  const messageText = copyButton.parentElement.querySelector(".text").innerText;

  navigator.clipboard.writeText(messageText);
  copyButton.innerText = "done"; // Exibir ícone de confirmação
  setTimeout(() => copyButton.innerText = "content_copy", 1000); // Reverter ícone após 1 segundo
}

// Lidar com o envio de mensagens do usuário
const handleOutgoingChat = () => {
  userMessage = typingForm.querySelector(".typing-input").value.trim() || userMessage;
  if(!userMessage || isResponseGenerating) return; // Sair se não houver mensagem ou se a resposta estiver sendo gerada

  isResponseGenerating = true;

  const html = `<div class="message-content">
                  <img class="avatar" src="images/user.jpg" alt="Avatar do usuário">
                  <p class="text"></p>
                </div>`;

  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerText = userMessage;
  chatContainer.appendChild(outgoingMessageDiv);
  
  typingForm.reset(); // Limpar o campo de entrada
  document.body.classList.add("hide-header");
  chatContainer.scrollTo(0, chatContainer.scrollHeight); // Rolar para o fim do contêiner
  setTimeout(showLoadingAnimation, 500); // Exibir animação de carregamento após um atraso
}

// Alternar entre os temas claro e escuro
toggleThemeButton.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "light_mode" : "dark_mode");
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});

// Apagar todos os chats do local storage quando o botão for clicado
deleteChatButton.addEventListener("click", () => {
  if (confirm("Tem certeza de que deseja apagar todos os chats?")) {
    localStorage.removeItem("saved-chats");
    document.body.classList.remove("hide-header");
    chatContainer.innerHTML = ""; // Limpar o contêiner de chat
  }
});

// Carregar dados ao iniciar a página
loadDataFromLocalstorage();

// Adicionar eventos aos botões de sugestão
suggestions.forEach(suggestion => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector("p").innerText; // Definir a mensagem do usuário para a sugestão clicada
    handleOutgoingChat(); // Enviar a mensagem de sugestão
  });
});

// Lidar com o envio do chat ao pressionar Enter
typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutgoingChat(); // Lidar com o chat de saída
});
