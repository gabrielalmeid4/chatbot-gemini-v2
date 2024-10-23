const typingForm = document.querySelector(".typing-form");
const chatContainer = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion");
const toggleThemeButton = document.querySelector("#theme-toggle-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

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

// Lidar com o envio do chat ao pressionar Enter
typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutgoingChat(); // Lidar com o chat de saída
});
