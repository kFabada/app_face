import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Pressable } from 'react-native';
import { Camera, useCameraPermission, useCameraDevice, PhotoFile } from 'react-native-vision-camera';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const FaceComparisonScreen = () => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const [photo, setPhoto] = useState<PhotoFile | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const camera = useRef<Camera>(null);
  const navigation = useNavigation();

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
      setErrorMessage(null); // Limpa mensagem de erro ao tirar uma nova foto
      comparePhoto(photo);
    }
  };

  const comparePhoto = async (photo: PhotoFile) => {
    const formData = new FormData();
    formData.append('file', {
      uri: `file://${photo.path}`,
      name: photo.path.split('/').pop() || 'photo.jpg',
      type: 'image/jpeg',
    });
    formData.append('id_user', '123'); // Substitua pelo ID real do usuário

    try {
      const response = await axios.post(
        'http://192.168.50.254:3000/compare-face',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      if (response.data.match) {
        console.log('Autenticação bem-sucedida!');
        navigation.navigate('TelaUsuario'); // Navegar para a tela principal
      } else {
        console.log('Autenticação falhou. Usuário não reconhecido.');
        setErrorMessage('Usuário não reconhecido. Tente novamente.'); // Mensagem de erro
      }
    } catch (error) {
      console.error('Erro ao comparar rostos:', error);
      setErrorMessage('Erro ao comparar rostos. Tente novamente.'); // Mensagem de erro genérica
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
        >
          <Text>Comparar</Text>
        </Pressable>
        <View>
        {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>} 
        </View>
      </View>
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
  errorText: {
    color: 'red',
    position: 'absolute',
    top: 50, // Ajuste conforme necessário
    alignSelf: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Fundo para melhor visibilidade
    padding: 10,
    borderRadius: 5,
  },
});

export default FaceComparisonScreen;
