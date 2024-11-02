import { View, Text, ActivityIndicator, StyleSheet, Pressable, Image } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Camera, useCameraPermission, useCameraDevice, PhotoFile } from 'react-native-vision-camera';

const CameraScreen = () => {
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('front');
  const [photo, setPhoto] = useState<PhotoFile>();

  const camera = useRef<Camera>(null);

  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission]);

  if (!hasPermission) {
    return <ActivityIndicator />;
  }

  const onTakePicturePress = async () => {
    const photo = await camera.current?.takePhoto();
    setPhoto(photo);
  };

  const uploadPhoto = async () => {
    if (!photo) {
      return;
    }

    try {
      const result = await fetch(`file://${photo.path}`);
      const blob = await result.blob();

      const response = await fetch("https://demofaceapidomain.cognitiveservices.azure.com/", {
        method: "POST",
        headers: {
          "Content-Type": "application/octet-stream",
          "Ocp-Apim-Subscription-Key": "chave-api"
        },
        body: blob
      });

      const responseData = await response.json();
      if (response.ok) {
        console.log("Face detected:", responseData);
        await storeFaceData(responseData);
      } else {
        console.error("Error detecting face:", responseData);
      }
    } catch (error) {
      console.error("Upload error:", error);
    }
  };


  const storeFaceData = async (faceData) => {
    try {
        const response = await fetch("http://localhost/script_php.test/faceId.php", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                faceData: JSON.stringify(faceData) // Converta os dados da face para JSON
            }),
        });

    const result = await response.json();
        if (response.ok) {
            console.log("Face data stored successfully:", result);
        } else {
            console.error("Error storing face data:", result);
        }
    } catch (error) {
        console.error("Error storing face data:", error);
    }
};

  if (!device) {
    return <Text>Camera device not found</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      {photo ? (
        <Image source={{ uri: photo.path }} style={StyleSheet.absoluteFill} />
      ) : (
        <View style={StyleSheet.absoluteFill}>
          <Camera
            style={StyleSheet.absoluteFill}
            device={device}
            isActive={true}
            photo={true}
            ref={camera}
          />
          <Pressable
            onPress={onTakePicturePress}
            style={{
              position: 'absolute',
              alignSelf: 'center',
              bottom: 50,
              width: 75,
              height: 75,
              backgroundColor: 'white',
              borderRadius: 37.5, // Corrige o raio para metade do diâmetro
              justifyContent: 'center',
              alignItems: 'center',
            }}
          />
          
        </View>
      )}
    </View>
  );
};

export default CameraScreen;
