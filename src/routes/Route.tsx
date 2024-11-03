import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import { HomeScreen } from '../screen/HomeScreen';
import { TelaRegistraFace } from '../screen/TelaRegistraFace';
import { TelaCompararFace } from '../screen/TelaCompararFace';
import { TelaUsuario } from '../screen/TelaUsuario';

const Stack = createNativeStackNavigator();

const Routes = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName='Home'>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{title: 'Principal'}}
        />
        <Stack.Screen 
        name="TelaRegistraFace" 
        component={TelaRegistraFace} />

        <Stack.Screen 
        name="TelaCompararFace"
         component={TelaCompararFace} />

        <Stack.Screen 
        name="TelaUsuario" 
        component={TelaUsuario} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Routes;