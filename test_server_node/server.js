// server.js
const express = require('express');
const { RekognitionClient, DetectFacesCommand } = require('@aws-sdk/client-rekognition');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg'); // Import the pg package


const app = express();
const upload = multer({ dest: 'uploads/' });

const dbClient = new Client({
    user: 'your_user',           // replace with your database user
    host: 'localhost',           // replace with your host (e.g. 'localhost' or 'your-db-host.com')
    database: 'your_database',   // replace with your database name
    password: 'your_password',   // replace with your database password
    port: 5432,                  // default PostgreSQL port
  });
  
  dbClient.connect();

// Configura as credenciais da AWS
const client = new RekognitionClient({
  region: 'us-west-2', // Altere para a região correta
  credentials: {
    accessKeyId: '', // Substitua com seu ID da chave de acesso
    secretAccessKey: '',
  },
});

app.post('/detect-faces', upload.single('file'), async (req, res) => {
  const filePath = path.join(__dirname, req.file.path);

  // Ler a imagem como um buffer
  const imageBuffer = fs.readFileSync(filePath);

  // Configuração da imagem para Rekognition
  const params = {
    Image: { Bytes: imageBuffer },
    Attributes: ['ALL'], // Retorna landmarks e outras informações
  };

  try {
    const command = new DetectFacesCommand(params);
    const data = await client.send(command);
    
    // Remove o arquivo temporário
    fs.unlinkSync(filePath);
    
    res.json(data.FaceDetails[0].Landmarks);
  } catch (err) {
    console.error('Erro ao chamar Amazon Rekognition:', err);
    fs.unlinkSync(filePath); // Remove o arquivo mesmo em caso de erro
    return res.status(500).json({ error: 'Erro ao chamar Amazon Rekognition' });
  }
});

// Inicializar o servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
