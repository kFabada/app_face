require('dotenv').config();
const express = require('express');
const { RekognitionClient, DetectFacesCommand, CompareFacesCommand } = require('@aws-sdk/client-rekognition');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
const bodyParser = require('body-parser');


const app = express();
const upload = multer({ dest: 'uploads/' });

// Configuração do banco de dados
const dbClient = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'face_api',
  password: '1234',
  port: 5432,
});

dbClient.connect();

// Configuração da AWS Rekognition
const client = new RekognitionClient({
  region: 'us-west-2',
  credentials: {
    accessKeyId: '', // Substitua com seu ID da chave de acesso
    secretAccessKey: '',
  },
});

app.use(bodyParser.json());

app.post('/detect-faces', upload.single('file'), async (req, res) => {
  const filePath = path.join(__dirname, req.file.path);
  const imageBuffer = fs.readFileSync(filePath);

  const params = {
    Image: { Bytes: imageBuffer },
    Attributes: ['ALL'],
  };

  try {
    const command = new DetectFacesCommand(params);
    const data = await client.send(command);
    fs.unlinkSync(filePath);
    res.json(data.FaceDetails[0].Landmarks);
  } catch (err) {
    console.error('Erro ao chamar Amazon Rekognition:', err);
    fs.unlinkSync(filePath);
    return res.status(500).json({ error: 'Erro ao chamar Amazon Rekognition' });
  }
});

app.post('/store-face', async (req, res) => {
  const { id_user, face_landmark } = req.body;

  try {
    const query = `
      INSERT INTO face_data (id_user, face_landmark)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const values = [id_user, JSON.stringify(face_landmark)];

    const result = await dbClient.query(query, values);
    res.status(201).json({ message: 'Dados armazenados com sucesso!', data: result.rows[0] });
  } catch (err) {
    console.error('Erro ao armazenar dados no banco de dados:', err);
    res.status(500).json({ error: 'Erro ao armazenar dados no banco de dados' });
  }
});


app.post('/compare-face', upload.single('file'), async (req, res) => {
  const filePath = path.join(__dirname, req.file.path);
  const userId = req.body.id_user; // Pegue o ID do usuário do corpo da requisição

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

      // Remover o arquivo temporário
      fs.unlinkSync(filePath);

      // Verifique se FaceDetails e Landmarks existem
      if (data.FaceDetails && data.FaceDetails.length > 0) {
          const landmarks = data.FaceDetails[0].Landmarks;

          // Aqui você pode implementar a lógica de comparação com os dados do banco
          // Por exemplo, comparando landmarks com os armazenados para o usuário

          // Exemplo de resposta
          res.json({ match: true, landmarks }); // Retorne true se as faces coincidirem
      } else {
          res.status(400).json({ error: 'Nenhum rosto detectado na imagem.' });
      }
  } catch (err) {
      console.error('Erro ao chamar Amazon Rekognition:', err);
      fs.unlinkSync(filePath); // Remove o arquivo mesmo em caso de erro
      return res.status(500).json({ error: 'Erro ao chamar Amazon Rekognition' });
  }
});


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
