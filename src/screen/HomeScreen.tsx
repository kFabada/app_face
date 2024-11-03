import React from 'react';
import {Button, View, Text, StyleSheet } from 'react-native';


export function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
    <Text>Muda para Tela</Text>
        <Button title="Tela Registra"
         onPress={() => navigation.navigate('TelaRegistraFace')}/>

        <Button title="Tela Comparar"
         onPress={() => navigation.navigate('TelaCompararFace')}/>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'white', 
    },
    text: {
      fontSize: 20,
      color: 'black',
    },
  });