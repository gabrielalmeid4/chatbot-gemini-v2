// Importações necessárias
const express = require('express'); 
const multer = require('multer'); 
const { GoogleGenerativeAI } = require('@google/generative-ai'); 
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const path = require('path');
const cors = require('cors'); 
const dotenv = require('dotenv'); 

// Cria o app Express
const app = express();

// Habilita o CORS
app.use(cors({
  origin: '*',
}));

// Configura o multer para armazenar os arquivos na pasta 'uploads/'
const upload = multer({ dest: 'uploads/' });
const port = 3000; // Porta do servidor

// Chave da API do Google Generative AI
const API_KEY = "AIzaSyDl8IHhDXss3cbGt5-DRZINXxefcbM7zRk"

// Instancia o gerenciador de arquivos para lidar com uploads para a API Gemini
const fileManager = new GoogleAIFileManager(API_KEY);

// Rota para verificar se o servidor está funcionando
app.get('/', (req, res) => {
  res.send('Servidor está funcionando!');
});

// Rota para fazer upload e processar a imagem
app.post('/upload', upload.single('image'), async (req, res) => {
  const filePath = path.join(__dirname, req.file.path); // Obtem o caminho do arquivo enviado
  const mimeType = req.file.mimetype; // Obtem o tipo MIME do arquivo

  try {
    // Faz o upload da imagem para a API Gemini usando o GoogleAIFileManager
    const uploadResult = await fileManager.uploadFile(filePath, {
      mimeType, // Tipo de arquivo
      displayName: req.file.originalname, // Nome original do arquivo
    });

    // Instancia o modelo generativo do Google
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Define o modelo a ser usado

    // Faz a requisição para a API de geração de conteúdo com a imagem
    const result = await model.generateContent([
      "Descreva a imagem.", // Prompt para a IA descrever a imagem
      {
        fileData: {
          fileUri: uploadResult.file.uri, // URI do arquivo carregado
          mimeType: uploadResult.file.mimeType, // Tipo MIME do arquivo
        },
      },
    ]);

    // Retorna a descrição da imagem em formato JSON
    res.json({ description: result.response.text() });
  } catch (error) {
    // Trata erros e exibe no console
    console.error('Erro ao processar a imagem:', error);
    res.status(500).json({ error: error.message }); // Retorna o erro como resposta
  }
});

// Faz o servidor escutar na porta definida
app.listen(port, () => {
  console.log(`Servidor escutando...`);
});
