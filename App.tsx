// In App.js in a new project

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as React from "react";

import "react-native-gesture-handler";
import Connect from "./screens/Connect";
import Connected from "./screens/Connected";

const Stack = createNativeStackNavigator();

const EmptyHeader = () => <></>;

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="connect"
        screenOptions={{ header: EmptyHeader }}
      >
        <Stack.Screen name="connect" component={Connect} />
        <Stack.Screen name="connected" component={Connected} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
