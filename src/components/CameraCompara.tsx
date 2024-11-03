import React, { useEffect, useRef, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Pressable, Image } from 'react-native';
import { Camera, useCameraPermission, useCameraDevice, PhotoFile } from 'react-native-vision-camera';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';

const FaceComparisonScreen = () => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const [photo, setPhoto] = useState<PhotoFile | null>(null);
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
    }
  };

  const comparePhoto = async () => {
    if (!photo) return;

    try {
      const formData = new FormData();
      formData.append('file', {
        uri: `file://${photo.path}`,
        name: photo.path.split('/').pop() || 'photo.jpg',
        type: 'image/jpeg',
      });
      formData.append('id_user', '1234'); // Replace with the actual user ID

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
        console.log('Authentication successful!');
        navigation.navigate('TelaUsuario'); // Navigate to the main screen
      } else {
        console.log('Authentication failed. User not recognized.');
      }
    } catch (error) {
      console.error('Error comparing faces:', error);
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
          style={{
            position: 'absolute',
            alignSelf: 'center',
            bottom: 50,
            width: 75,
            height: 75,
            backgroundColor: 'white',
            borderRadius: 37.5,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text>Snap</Text>
        </Pressable>
      </View>

      {photo && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: `file://${photo.path}` }} style={styles.image} />
          <Pressable onPress={comparePhoto} style={styles.compareButton}>
            <Text>Authenticate</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
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
  compareButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
  },
});

export default FaceComparisonScreen;
