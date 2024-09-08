const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { GoogleAIFileManager } = require('@google/generative-ai/server');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');

const app = express();
app.use(cors({
  origin: '*', // Permite todas as origens (não recomendado para produção)
}));
const upload = multer({ dest: 'uploads/' });
const port = 3000;

const API_KEY = "AIzaSyDl8IHhDXss3cbGt5-DRZINXxefcbM7zRk"

const fileManager = new GoogleAIFileManager(API_KEY);

app.get('/', (req, res) => {
  res.send('Servidor está funcionando!');
});

// Rota para fazer upload e processar a imagem
app.post('/upload', upload.single('image'), async (req, res) => {
  const filePath = path.join(__dirname, req.file.path);
  console.log(filePath)
  const mimeType = req.file.mimetype;

  try {
    // Upload da imagem para a API Gemini
    const uploadResult = await fileManager.uploadFile(filePath, {
      mimeType,
      displayName: req.file.originalname,
    });

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      "Descreva a imagem.",
      {
        fileData: {
          fileUri: uploadResult.file.uri,
          mimeType: uploadResult.file.mimeType,
        },
      },
    ]);

    console.log(result.response.text())

    res.json({ description: result.response.text() });
  } catch (error) {
    console.error('Error processing image:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
