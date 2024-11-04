const express = require('express');
const multer = require('multer');
const { RekognitionClient, DetectFacesCommand, CompareFacesCommand } = require('@aws-sdk/client-rekognition');
const { Client } = require('pg');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(express.json({ limit: '10mb' }));

// Configurar PostgreSQL
const db = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'face_api',
  password: '1234',
  port: 5432,
});
db.connect();

// Configuração do AWS Rekognition
const rekognitionClient = new RekognitionClient({ region: 'us-east-1' });

// Rota para detectar pontos faciais com AWS Rekognition
app.post('/detect-faces', upload.single('file'), async (req, res) => {
  const imagePath = req.file.path;
  const imageBytes = fs.readFileSync(imagePath);

  const params = {
    Image: {
      Bytes: imageBytes,
    },
    Attributes: ['ALL'],
  };

  try {
    const command = new DetectFacesCommand(params);
    const response = await rekognitionClient.send(command);
    fs.unlinkSync(imagePath); // Remover arquivo temporário

    if (!response.FaceDetails || response.FaceDetails.length === 0) {
      return res.status(400).json({ error: 'Nenhum rosto detectado na imagem.' });
    }

    res.json(response.FaceDetails.map(face => face.Landmarks));
  } catch (error) {
    console.error('Erro ao detectar rostos:', error);
    res.status(500).json({ error: 'Erro ao detectar rostos' });
  }
});

// Rota para armazenar rosto e landmarks no banco de dados
app.post('/store-face', async (req, res) => {
  const { id_user, face_landmark, image } = req.body;

  // Verificar se os dados necessários estão presentes
  if (!image) {
    console.error("Imagem não fornecida ou está vazia");
    return res.status(400).json({ error: "Imagem não fornecida" });
  }

  try {
    await db.query(
      'INSERT INTO users (id_user, face_landmarks, face_image_base64) VALUES ($1, $2, $3) ON CONFLICT (id_user) DO NOTHING',
      [id_user, JSON.stringify(face_landmark), image]
    );
    res.json({ message: 'Rosto armazenado com sucesso!' });
  } catch (error) {
    console.error('Erro ao armazenar rosto no banco de dados:', error);
    res.status(500).json({ error: 'Erro ao armazenar rosto no banco de dados' });
  }
});

// Rota para comparar rostos
app.post('/compare-face', upload.single('file'), async (req, res) => {
  const { id_user } = req.body;
  const imagePath = req.file.path;
  const newImageBytes = fs.readFileSync(imagePath);

  try {
    // Buscar a imagem armazenada do usuário
    const userResult = await db.query('SELECT face_image_base64 FROM users WHERE id_user = $1', [id_user]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const storedImageBytes = Buffer.from(userResult.rows[0].face_image_base64, 'base64');

    // Configurar parâmetros de comparação no AWS Rekognition
    const params = {
      SourceImage: {
        Bytes: storedImageBytes,
      },
      TargetImage: {
        Bytes: newImageBytes,
      },
      SimilarityThreshold: 90, // Define o limite de similaridade (ajustável)
    };

    const command = new CompareFacesCommand(params);
    const response = await rekognitionClient.send(command);
    fs.unlinkSync(imagePath); // Remover arquivo temporário

    console.log("esperando resposta do aws"); // Remover arquivo temporário
    console.log(response);

    if (!response.FaceMatches || response.FaceMatches.length === 0) {
      return res.status(400).json({ error: 'Nenhum rosto encontrado na imagem fornecida para comparação.' });
    }

    const isMatch = response.FaceMatches.length > 0;
    res.json({ match: isMatch });
  } catch (error) {
    console.error('Erro ao comparar rostos:', error);
    res.status(500).json({ error: 'Erro ao comparar rostos' });
  }
});

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));
