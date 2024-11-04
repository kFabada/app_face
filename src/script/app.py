from flask import Flask, request, jsonify
from deepface import DeepFace
import base64
import numpy as np
from io import BytesIO
from PIL import Image

app = Flask(__name__)

@app.route('/authenticate', methods=['POST'])
def authenticate():
    data = request.json
    img_base64 = data['image']
    
    # Decodificar a imagem base64
    img_bytes = base64.b64decode(img_base64)
    img = Image.open(BytesIO(img_bytes))
    img.save('input.jpg')  # Salvar a imagem recebida

    # Aqui você pode comparar a imagem recebida com uma imagem armazenada
    # Vamos supor que você tenha uma imagem chamada 'stored.jpg'
    try:
        result = DeepFace.verify('input.jpg', 'stored.jpg')
        return jsonify(result)
    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
