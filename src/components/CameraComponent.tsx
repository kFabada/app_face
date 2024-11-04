import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Pressable, Image } from 'react-native';
import { Camera, useCameraPermission, useCameraDevice, PhotoFile } from 'react-native-vision-camera';
import RNFS from 'react-native-fs';
import axios from 'axios';

interface ImageBlob {
  uri: string;
  name: string;
  type: string;
}

interface Landmark {
  Type: string;
  X: number;
  Y: number;
}

const CameraScreen = () => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const [photo, setPhoto] = useState<PhotoFile | null>(null);
  const [landmarks, setLandmarks] = useState<Landmark[]>([]);
  const camera = useRef<Camera>(null);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  if (!hasPermission) {
    return <ActivityIndicator />;
  }

  if (!device) {
    return <Text>Camera device not found</Text>;
  }

  const takePicture = async () => {
    const photo = await camera.current?.takePhoto();
    if (photo) {
      console.log('Foto capturada:', photo);
      setPhoto(photo);
    }
  };

  const PhotoUpload = async () => {
    if (!photo || !photo.path) {
      console.error("Caminho da imagem não está definido corretamente.");
      return;
    }

    try {
      const landmarks = await detectFace({
        uri: `file://${photo.path}`,
        name: photo.path.split('/').pop() || 'photo.jpg',
        type: 'image/jpeg',
      });
      setLandmarks(landmarks);
    } catch (error) {
      console.error("Erro no upload da foto:", error);
    }
  };

  const detectFace = async (imageBlob: ImageBlob) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri: imageBlob.uri,
        name: imageBlob.name,
        type: imageBlob.type,
      });

      const response = await axios.post(
        'http://192.168.50.254:3000/detect-faces',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      console.log(response.data)
      return storeDataBase(response.data);
    } catch (error) {
      console.error('Erro ao chamar endpoint de reconhecimento facial:', error);
      return [];
    }
  };

  const storeDataBase = async (response) => {
    try {
      const id_user = "123";
    
      if (!photo || !photo.path) {
        throw new Error("Caminho da imagem não definido corretamente.");
      }
  
      const imagePath = `file://${photo.path}`;
      const base64Image = await RNFS.readFile(imagePath, 'base64');
    
      await axios.post('http://192.168.50.254:3000/store-face', {
        id_user,
        face_landmark: response,
        image: base64Image,
      });
      console.log("Dados armazenados com sucesso no banco de dados");
    } catch (error) {
      console.error('Erro ao armazenar dados no banco de dados:', error);
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFill}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          ref={camera}
          photo={true}
        />
      </View>

      <Pressable onPress={takePicture} style={styles.captureButton}>
        <Text style={styles.buttonText}>Tirar Foto</Text>
      </Pressable>

      {photo && (
        <View style={styles.photoPreviewContainer}>
          <Image
            source={{ uri: `file://${photo.path}` }}
            style={styles.photoPreview}
          />
          <Pressable onPress={PhotoUpload} style={styles.uploadButton}>
            <Text style={styles.buttonText}>Upload</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    position: 'absolute',
    bottom: 100,
    width: 100,
    height: 50,
    backgroundColor: '#1e90ff',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadButton: {
    marginTop: 20,
    width: 100,
    height: 50,
    backgroundColor: '#32cd32',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  photoPreviewContainer: {
    position: 'absolute',
    top: '30%',
    alignItems: 'center',
  },
  photoPreview: {
    width: 200,
    height: 200,
    borderRadius: 10,
  },
});

export default CameraScreen;
