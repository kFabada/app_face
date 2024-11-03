import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Pressable, Image } from 'react-native';
import { Camera, useCameraPermission, useCameraDevice, PhotoFile } from 'react-native-vision-camera';
import axios from 'axios';

interface ImageBlob {
  uri: string;
  name: string;
  type: string;
}

interface Store {
  response: any;
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
      setPhoto(photo);
    }
  };

  const PhotoUpload = async () => {
    if (!photo) return;

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

      return storeDataBase(response.data);
      
    } catch (error) {
      console.error('Erro ao chamar endpoint de reconhecimento facial:', error);
      return [];
    }
  };

  const storeDataBase = async (response: Store) => {
    try {
      const id_user = "1234"; // Id do usuário a ser salvo no banco de dados
      await axios.post('http://192.168.50.254:3000/store-face', {
        id_user,
        face_landmark: response,
      });
      console.log("Dados armazenados com sucesso no banco de dados");
    } catch (error) {
      console.error('Erro ao armazenar dados no banco de dados:', error);
    }
  };
  

  return (
    <View style={{ flex: 1 }}>
      <View style={StyleSheet.absoluteFill}>
        <Camera
          style={StyleSheet.absoluteFill}
          device={device}
          isActive={true}
          ref={camera}
          photo={true}
        />
        <Pressable
          onPress={takePicture}
          style={styles.captureButton}
        />
      </View>

      {photo && (
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: `file://${photo.path}` }} 
            style={styles.image}
          />
          <Pressable onPress={PhotoUpload} style={styles.uploadButton}>
            <Text>Upload Photo</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  captureButton: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 50,
    width: 75,
    height: 75,
    backgroundColor: 'white',
    borderRadius: 37.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  image: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
    borderRadius: 10,
  },
  uploadButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
  },
});

export default CameraScreen;
